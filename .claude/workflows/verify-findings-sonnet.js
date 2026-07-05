export const meta = {
  name: 'verify-findings-sonnet',
  description: 'Vérification adversariale (Sonnet 5) des findings sécurité auth+RLS déjà collectés',
  phases: [{ title: 'Verify', detail: 'un réfuteur par finding distinct' }],
}

// Chemin du repo : passer { repo: "/chemin/absolu" } via args ; sinon les agents
// travaillent dans le cwd de la session (racine du dépôt).
const REPO = (args && args.repo) || '.'

const CONTEXT = `
Repo: ${REPO} — StockFlow, TanStack Start (React 19) + Kysely + Supabase Postgres, runtime Bun/Node (Nitro node-server sur Vercel).
Auth JWT RS256 maison (access 15 min cookie httpOnly + refresh opaque rotatif hashé en DB), RBAC admin|technician, RLS Postgres (rôle stockflow_app + SET LOCAL claims via withAuthContext + policies current_setting + grants par colonnes + fonctions SECURITY DEFINER).
Fichiers: src/lib/auth-core.ts, src/lib/auth-server.ts, src/lib/auth.ts, src/db/client.ts, src/db/migrations/004_rls_policies.sql, 003_auth_password_refresh_tokens.sql, src/lib/equipment.ts, src/routes/__root.tsx, scripts/seed-admin.ts, scripts/migrate.ts.
Env: pooler Supabase transaction-mode (6543) ; rôle postgres a BYPASSRLS ; runtime = APP_POSTGRES_URL (stockflow_app).
Modèle de menace des tests d'intégration RLS = "serveur app compromis / middleware contourné / injection SQL en écriture" : l'attaquant peut exécuter du SQL arbitraire via la connexion stockflow_app. C'est la défense en profondeur revendiquée par le dossier.
NE PAS réfuter au motif de dettes déjà documentées et acceptées : absence CSP/headers, rate limiter par instance (mais le CHOIX de clé/ordre est en scope), Zod absent sur equipment (mais fuite d'erreurs pg est en scope), DB unique dev/prod, ssl rejectUnauthorized:false.
`

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reason', 'severityAdjusted'],
  properties: {
    verdict: { type: 'string', enum: ['CONFIRMED', 'REFUTED'] },
    severityAdjusted: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'], description: 'sévérité réelle recalibrée pour le contexte (TPE/PME, 2 rôles, jury certif), none si réfuté' },
    reason: { type: 'string', description: 'preuve du déroulé pas-à-pas, cite fichier:ligne' },
  },
}

// Findings distincts (dédupliqués depuis les 5 dimensions de la revue).
const FINDINGS = [
  { id: 'F1-jwt-no-recheck', sev: 'high', file: 'src/lib/auth-server.ts:184', title: 'resolveSession court-circuite sur le JWT access : rôle/suppression/logout non appliqués jusqu\'à 15 min',
    detail: 'resolveSession (l.184-192) retourne l\'utilisateur décodé du payload JWT sans requête DB tant que l\'access token est valide. Le rôle sert d\'autorité pour adminMiddleware (auth.ts:27) ET withAuthContext qui pose app.role pour RLS (client.ts). Un admin rétrogradé/supprimé/déconnecté garde son rôle et son accès (RLS inclus) jusqu\'à 15 min. Pas de jti/blacklist/version de session.' },
  { id: 'F2-no-global-logout', sev: 'high', file: 'src/lib/auth-server.ts:225', title: 'login/logout ne révoquent jamais les autres sessions ; refresh volé survit 7 j',
    detail: 'issueSession (l.70-93) INSERT toujours une ligne, ne révoque aucune existante. doLogout (l.229-240) ne révoque que le token du cookie courant. Un refresh volé T survit à un re-login et à un logout côté victime. Nuance à évaluer: la détection de réutilisation (l.140-152) se déclenche-t-elle dès que la victime OU l\'attaquant tourne le token ? Si oui, "survit 7 j pleins" n\'est vrai que si la victime ne réutilise jamais l\'app.' },
  { id: 'F3-grace-covers-logout', sev: 'high', file: 'src/lib/auth-server.ts:140', title: 'Fenêtre de grâce 10s couvre les tokens révoqués par logout → replay 10s post-logout mint un access token',
    detail: 'doLogout pose revoked_at=now() (l.235), même colonne que la rotation. tryRefresh (l.140-165) traite tout token révoqué depuis <=10s comme rotation bénigne : émet un access token frais SANS révocation de famille. Attaquant détenant sf_refresh rejoue dans les 10s du logout → access token 15 min, vol non détecté.' },
  { id: 'F4-rotation-not-atomic', sev: 'medium', file: 'src/lib/auth-server.ts:173', title: 'Rotation non atomique : deux requêtes concurrentes double-rotent, orphelin refresh valide 7 j',
    detail: 'SELECT (l.133) → check revoked_at null → UPDATE WHERE id=row.id (l.173-177) → issueSession, hors transaction, sans CAS. Deux requêtes concurrentes avec le même T lisent revoked_at=null, révoquent T, insèrent T1 et T2. Le cookie garde T2, T1 reste valide non révoqué 7 j, orphelin, jamais marqué → sa réutilisation ne déclenche pas la révocation de famille. Correctif: UPDATE ... WHERE id=? AND revoked_at IS NULL RETURNING, n\'émettre que si rowCount=1.' },
  { id: 'F5-grace-ignores-expiry', sev: 'low', file: 'src/lib/auth-server.ts:154', title: 'La branche de grâce ignore expires_at',
    detail: 'Le chemin de grâce (l.140-165) ne vérifie pas expires_at (contrairement au chemin normal l.167). Un refresh révoqué dans les 10s de/après son expiration 7 j émet quand même un access token 15 min. Fenêtre étroite.' },
  { id: 'F6-refresh-forge-admin', sev: 'high', file: 'src/db/migrations/004_rls_policies.sql:101', title: 'refresh_tokens en USING(true)/WITH CHECK(true) : forge de session admin sans la clé JWT (élévation)',
    detail: 'La policy refresh_tokens_all n\'impose aucun lien entre app.user_id et user_id de la ligne insérée ; stockflow_app a GRANT INSERT. Attaquant avec la connexion app (modèle de menace des tests) : (1) set_config app.role=admin puis SELECT id FROM users WHERE role=\'admin\' ; (2) INSERT INTO refresh_tokens(user_id=<admin_id>, token_hash=encode(digest(t,\'sha256\'),\'hex\'), expires_at=now()+30d, revoked_at NULL) avec t un token qu\'il choisit ; (3) présente t dans sf_refresh → tryRefresh trouve la ligne, refreshLookup renvoie l\'admin, signe un access token RS256 admin valide. Conversion écriture-DB → session admin applicative HTTP, sans posséder la clé privée, survivant à une rotation des identifiants DB. Note: le flux légitime insère sans claims (db brut), donc WITH CHECK(user_id=app_user_id()) casserait le login — évaluer si c\'est réellement corrigeable/impactant vu que quiconque a la connexion app peut déjà tout lire/écrire sur equipment/incidents.' },
  { id: 'F7-password-hash-via-definer', sev: 'high', file: 'src/db/migrations/004_rls_policies.sql:116', title: 'password_hash extractible par le rôle app via auth_login_lookup — contredit le contrôle "illisible via rôle app"',
    detail: 'Grant par colonnes bloque SELECT password_hash direct (test l.137). Mais auth_login_lookup est SECURITY DEFINER (owner postgres, bypass grants), RETURNS password_hash, EXECUTE accordé à stockflow_app, appelable SANS claims (test l.170). Attaquant avec la connexion app : set_config app.role=admin ; SELECT email FROM users ; pour chaque email SELECT password_hash FROM auth_login_lookup(email) → tous les hachages argon2 pour crackage offline. Le contrôle annoncé (CLAUDE.md, dossier, "password_hash illisible via rôle app") est faux sous ce modèle de menace : le grant colonne ne bloque qu\'un SELECT négligent. Correctif possible: rôle login dédié pour l\'EXECUTE, ou documenter honnêtement le risque résiduel.' },
  { id: 'F8-fail-open-postgres-url', sev: 'medium', file: 'src/db/client.ts:14', title: 'Fallback silencieux vers POSTGRES_URL (BYPASSRLS) si APP_POSTGRES_URL absent : RLS off sans erreur (fail-open)',
    detail: 'Le runtime choisit APP_POSTGRES_URL ?? POSTGRES_URL ?? DATABASE_URL. Si un déploiement Vercel oublie APP_POSTGRES_URL, l\'app se connecte avec postgres (BYPASSRLS) : toutes les policies 004 ignorées, withAuthContext pose des claims que personne ne lit, chaque requête réussit, aucun test runtime ne casse, aucune alerte. Toute la défense en profondeur s\'évapore en silence. Correctif: exiger APP_POSTGRES_URL au runtime (throw si absent) ou vérifier au boot que la connexion n\'a pas BYPASSRLS.' },
  { id: 'F9-revoke-nonsupabase', sev: 'low', file: 'src/db/migrations/004_rls_policies.sql:36', title: 'REVOKE FROM anon,authenticated échoue sur Postgres vanilla + migration non transactionnelle → état partiel',
    detail: 'Ligne 36 révoque sur anon/authenticated (rôles Supabase). Sur PG vanilla (CI locale) ces rôles n\'existent pas → erreur. migrate.ts (l.18) envoie chaque .sql en un seul query sans BEGIN/COMMIT englobant → instructions précédentes auto-commitées, migration partielle. Idempotent au re-run mais ne peut jamais aboutir sans ces rôles. Correctif: REVOKE conditionnel (DO $$ IF EXISTS pg_roles $$) et/ou transaction par migration.' },
  { id: 'F10-login-ratelimit-dos', sev: 'medium', file: 'src/lib/auth-server.ts:203', title: 'Verrouillage de compte à distance : rate limiter login clé sur email seul, vérifié avant les credentials',
    detail: 'loginLimiter.isLimited(email) évalué avant vérif du mot de passe, clé = email seul (pas d\'IP). Attaquant non authentifié : 5 POST loginFn avec l\'email victime + mot de passe bidon → 15 min de "Trop de tentatives" pour la victime même avec le bon mot de passe. Répétable = DoS ciblé sur tout compte dont l\'email est connu. Distinct de la dette "limiteur par instance" : ici c\'est le choix de clé et l\'ordre. Correctif: clé IP+email, ou ne compter qu\'après échec de credential valide, ou backoff.' },
  { id: 'F11-pg-error-leak', sev: 'medium', file: 'src/lib/equipment.ts:66', title: 'Messages d\'erreur Postgres bruts sérialisés jusqu\'au client et affichés dans l\'UI',
    detail: 'Les handlers equipment n\'ont pas de try/catch ; TanStack Start sérialise le message des erreurs vers le client (login.tsx et new.tsx affichent déjà err.message). Un technicien forge createEquipmentFn avec status invalide ou assigned_to inexistant (validator = simple cast) → violation CHECK/FK → message pg complet (noms tables/contraintes/colonnes) renvoyé et affiché. Fuite de schéma. Correctif indépendant de Zod: wrapper les handlers pour messages génériques + log serveur.' },
  { id: 'F12-refresh-unbounded', sev: 'low', file: 'src/db/migrations/004_rls_policies.sql:31', title: 'refresh_tokens : pas de grant DELETE ni purge → croissance non bornée',
    detail: 'stockflow_app a SELECT/INSERT/UPDATE seulement, aucun job de nettoyage. Chaque login + chaque rotation (~toutes les 15 min par utilisateur actif) insère une ligne jamais supprimée. ~96 lignes/j/utilisateur actif, historique infini pour la détection de réutilisation. Correctif: purge périodique expires_at < now()-interval via rôle migrations ou fonction SECURITY DEFINER.' },
  { id: 'F13-ratelimiter-map-unbounded', sev: 'low', file: 'src/lib/auth-core.ts:139', title: 'Rate limiter : Map jamais purgée → croissance mémoire non bornée',
    detail: 'createLoginRateLimiter stocke chaque clé email dans une Map ; entrées expirées écrasées seulement si la même clé revient, reset() seulement au login réussi. Attaquant envoyant des échecs avec emails uniques → une entrée par email, jamais évincée → mémoire croissante + CPU argon2. Correctif: éviction si resetAt<now à l\'accès, ou LRU/limite de taille.' },
  { id: 'F14-sentry-pii', sev: 'low', file: 'src/routes/__root.tsx:16', title: 'Sentry initialisé avec sendDefaultPii: true côté client',
    detail: 'sendDefaultPii:true remonte IP + données par défaut à Sentry (tiers) par événement ; les messages capturés peuvent inclure des messages serveur bruts. Pas de fuite de tokens (cookies httpOnly). Point RGPD/minimisation à justifier ou désactiver/beforeSend filtrant.' },
]

phase('Verify')
const verified = await parallel(
  FINDINGS.map((f) => () =>
    agent(
      `${CONTEXT}
Un auditeur prétend avoir trouvé cette faille dans ${REPO} :
ID: ${f.id}
FICHIER: ${f.file}
TITRE: ${f.title}
SÉVÉRITÉ ANNONCÉE: ${f.sev}
DÉTAIL: ${f.detail}

Ta mission : RÉFUTER ce finding. Lis le code réel concerné (et tout fichier lié : migrations, tests d'intégration existants, client.ts, auth-core.ts). Déroule le scénario d'attaque/le bug pas à pas contre le code réel.
- Verdict REFUTED si : précondition impossible, déjà protégé ailleurs, comportement voulu et documenté comme dette acceptée, ou sévérité fantaisiste sans exploitation réelle.
- Verdict CONFIRMED seulement si tu peux décrire l'exploitation/le défaut concret de bout en bout contre le code réel.
Recalibre severityAdjusted pour le VRAI contexte : app de gestion de parc TPE/PME, 2 rôles, projet de certification jury (pas une banque). Un tradeoff JWT standard bien connu n'est pas "high". Un fail-open silencieux de la RLS ou une extraction de tous les hachages de mots de passe le sont. En cas de doute sur la réalité technique → REFUTED, mais si le défaut est réel et juste sur-évalué, CONFIRMED avec severityAdjusted plus basse.
Cite fichier:ligne dans ta preuve.`,
      { label: `verify:${f.id}`, phase: 'Verify', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'high' },
    ).then((v) => ({ ...f, verdict: v?.verdict ?? 'ERROR', severityAdjusted: v?.severityAdjusted ?? 'unknown', verdictReason: v?.reason ?? 'verifier failed' })),
  ),
)

const ok = verified.filter(Boolean)
const confirmed = ok.filter((f) => f.verdict === 'CONFIRMED')
const refuted = ok.filter((f) => f.verdict === 'REFUTED')
const errored = ok.filter((f) => f.verdict === 'ERROR')
log(`${ok.length} vérifiés : ${confirmed.length} confirmés, ${refuted.length} réfutés, ${errored.length} en erreur`)
return {
  confirmed: confirmed.map((f) => ({ id: f.id, file: f.file, severityAdjusted: f.severityAdjusted, title: f.title, reason: f.verdictReason })),
  refuted: refuted.map((f) => ({ id: f.id, title: f.title, reason: f.verdictReason })),
  errored: errored.map((f) => f.id),
}
