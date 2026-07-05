export const meta = {
  name: 'security-review-auth-rls',
  description: 'Revue sécurité adversariale du diff auth JWT + RLS de StockFlow',
  phases: [
    { title: 'Find', detail: '4 dimensions de revue en parallèle' },
    { title: 'Verify', detail: 'vérification contradictoire de chaque finding' },
  ],
}

// Chemin du repo : passer { repo: "/chemin/absolu" } via args ; sinon les agents
// travaillent dans le cwd de la session (racine du dépôt).
const REPO = (args && args.repo) || '.'

const CONTEXT = `
Repo: ${REPO} — StockFlow, TanStack Start (React 19) + Kysely + Supabase Postgres, runtime Bun/Node (Nitro node-server sur Vercel).
Session en cours a ajouté : auth JWT RS256 maison (access 15 min cookie httpOnly + refresh opaque rotatif hashé en DB), RBAC admin|technician, RLS Postgres (rôle stockflow_app + SET LOCAL claims + policies current_setting + grants par colonnes + fonctions SECURITY DEFINER).
Fichiers clés à lire :
- src/lib/auth-core.ts (logique pure JWT/argon2/refresh/RBAC/rate-limit)
- src/lib/auth-server.ts (cookies, issueSession, tryRefresh avec rotation+grace 10s, doLogin/doLogout, lookups SECURITY DEFINER)
- src/lib/auth.ts (server functions + middlewares, imports dynamiques)
- src/db/client.ts (withAuthContext SET LOCAL, choix APP_POSTGRES_URL)
- src/db/migrations/004_rls_policies.sql (rôle, grants, 13 policies, fonctions definer)
- src/db/migrations/003_auth_password_refresh_tokens.sql
- src/lib/equipment.ts (server functions protégées)
- src/routes/__root.tsx (garde beforeLoad), src/routes/login.tsx, src/components/Sidebar.tsx (logout)
- scripts/seed-admin.ts, scripts/migrate.ts, .env.example
Contraintes d'environnement : pooler Supabase en mode transaction (port 6543) ; rôle postgres a BYPASSRLS ; le runtime utilise APP_POSTGRES_URL (stockflow_app).
NE PAS signaler : absence de CSP/headers HTTP (dette connue), rate limiter par instance (documenté), Zod absent sur equipment (dette connue), DB unique dev/prod (connu), ssl rejectUnauthorized:false (contrainte pooler Supabase connue et préexistante).
`

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'title', 'severity', 'detail'],
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          detail: { type: 'string', description: 'scénario concret: entrée/état → conséquence' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['CONFIRMED', 'REFUTED'] },
    reason: { type: 'string' },
  },
}

const DIMENSIONS = [
  {
    key: 'jwt-crypto',
    prompt: `${CONTEXT}
Tu es un auditeur crypto/JWT. Lis les fichiers clés (surtout auth-core.ts, auth-server.ts) et cherche des failles RÉELLES et exploitables dans : usage de jose (confusion d'algorithme, absence de vérif issuer/audience, claims non validés), gestion des clés (chargement env, cache), TTL, génération/hash des refresh tokens, argon2 (paramètres, timing), le hash factice anti-énumération. Vérifie ligne par ligne. Signale uniquement des défauts démontrables avec un scénario d'attaque concret — pas de spéculation ni de best-practice générique.`,
  },
  {
    key: 'session-cookies',
    prompt: `${CONTEXT}
Tu es un auditeur session management. Lis auth-server.ts, auth.ts, login.tsx, Sidebar.tsx, __root.tsx. Cherche des failles RÉELLES dans : flags cookies (httpOnly/secure/sameSite/path/maxAge), le flux de rotation du refresh token et sa fenêtre de grâce de 10s (races, replay, familles de tokens), la révocation au logout, resolveSession (ordre access→refresh), fixation de session, le fait que loginFn ne révoque pas d'anciennes sessions, comportement quand le user est supprimé/changé de rôle alors que son access token est encore valide. Scénario concret exigé pour chaque finding.`,
  },
  {
    key: 'rls-sql',
    prompt: `${CONTEXT}
Tu es un auditeur Postgres/RLS. Lis src/db/migrations/004_rls_policies.sql, 003, client.ts (withAuthContext), scripts/migrate.ts, scripts/seed-admin.ts. Cherche des failles RÉELLES : policies contournables (valeurs de claims forgées ? qui peut faire set_config ?), grants trop larges ou manquants (colonnes, séquences, schéma), SECURITY DEFINER (search_path, fuite de données, énumération), interaction avec le pooler transaction-mode (SET LOCAL hors transaction ? fuite de claims entre requêtes poolées ?), refresh_tokens policy USING(true) (que peut faire un attaquant avec la connexion app dessus ? insertion de token forgé pour un autre user ? ce serait une élévation !), idempotence/re-runnabilité de la migration. Scénario concret exigé.`,
  },
  {
    key: 'app-integration',
    prompt: `${CONTEXT}
Tu es un auditeur d'intégration applicative. Lis auth.ts, equipment.ts, __root.tsx, login.tsx, routes/equipment/*.tsx, routes/index.tsx, routes/scan.tsx. Cherche des failles RÉELLES : server functions oubliées sans authMiddleware, routes/loaders qui échappent à la garde, données sensibles renvoyées au client (password_hash dans un selectAll ? tokens dans les réponses ?), le selectAll() de refresh_tokens dans tryRefresh, imports serveur qui fuiteraient dans le bundle client, erreurs AuthError exposant des détails, redirections ouvertes, le validator zod de loginFn (limites), withAuthContext oublié quelque part. Scénario concret exigé.`,
  },
]

phase('Find')
const results = await pipeline(
  DIMENSIONS,
  (d) => agent(d.prompt, { label: `find:${d.key}`, phase: 'Find', schema: FINDINGS_SCHEMA, effort: 'high' }),
  (review, d) =>
    parallel(
      (review?.findings ?? []).map((f) => () =>
        agent(
          `${CONTEXT}
Un auditeur prétend avoir trouvé cette faille dans ${REPO} :
FICHIER: ${f.file}${f.line ? ` ligne ~${f.line}` : ''}
TITRE: ${f.title}
SÉVÉRITÉ ANNONCÉE: ${f.severity}
DÉTAIL: ${f.detail}

Ta mission : RÉFUTER ce finding. Lis le code réel concerné (et tout fichier lié nécessaire), déroule le scénario d'attaque pas à pas. S'il ne tient pas (précondition impossible, code déjà protégé ailleurs, sévérité fantaisiste, comportement voulu et documenté), verdict REFUTED avec la preuve. Ne confirme (CONFIRMED) que si tu peux décrire l'exploitation concrète de bout en bout. En cas de doute → REFUTED.`,
          { label: `verify:${f.title.slice(0, 40)}`, phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' },
        ).then((v) => ({ ...f, dimension: d.key, verdict: v?.verdict ?? 'REFUTED', verdictReason: v?.reason ?? 'verifier failed' })),
      ),
    ),
)

const all = results.filter(Boolean).flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict === 'CONFIRMED')
const refuted = all.filter((f) => f.verdict === 'REFUTED')
log(`${all.length} findings bruts, ${confirmed.length} confirmés, ${refuted.length} réfutés`)
return { confirmed, refutedCount: refuted.length, refutedTitles: refuted.map((f) => `${f.severity}: ${f.title}`) }