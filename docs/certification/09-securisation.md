# 09 — Sécurisation

## Authentification (session 2, 2026-07-03)

### Architecture

- **Access token** : JWT RS256, durée 15 minutes, claims `sub` (id utilisateur), `role`,
  `name`, `email`, avec `issuer`/`audience` vérifiés et algorithme verrouillé (`RS256` seul
  accepté à la vérification — pas de confusion d'algorithme possible). Lib `jose`.
- **Refresh token** : opaque (32 octets aléatoires), stocké **hashé** (SHA-256) dans la table
  `refresh_tokens`. Rotation à chaque usage ; la réutilisation d'un token déjà tourné au-delà
  d'une fenêtre de grâce de 10 s (requêtes parallèles) est traitée comme un vol : révocation
  de tous les tokens de l'utilisateur.
- **Transport** : les deux tokens voyagent en cookies `httpOnly` + `Secure` (prod) +
  `SameSite=Strict` — inaccessibles au JavaScript client (XSS ne peut pas exfiltrer les
  tokens), non envoyés en navigation cross-site (CSRF fortement limité, complété par le fait
  que les server functions mutantes sont en POST avec payload sérialisé spécifique).
- **Mots de passe** : argon2id (`@node-rs/argon2`), jamais de plaintext. Quand l'email est
  inconnu, un hash factice est quand même vérifié pour égaliser le temps de réponse
  (anti-énumération de comptes). Message d'erreur générique unique.
- **Rate limiting** : 5 échecs / 15 minutes par email (en mémoire ; plafond documenté :
  par instance serverless — passer à un store partagé si multi-instance).
- **Pas d'inscription publique** : comptes créés par seed (`scripts/seed-admin.ts`) ou par un
  admin. Clés RS256 fournies par variables d'environnement (PEM base64), jamais commitées.

### RBAC

Deux rôles (`admin`, `technician`), présents dans le JWT et revérifiés côté serveur :
- `authMiddleware` : vérifie le token (avec refresh silencieux), injecte `context.user`.
- `adminMiddleware` : exige le rôle admin.
- **Toutes** les server functions equipment sont derrière `authMiddleware`. La garde de route
  côté client (`beforeLoad` → redirect `/login`) est du confort UX, pas une barrière.

## RLS — défense en profondeur

### Décision d'architecture

Contrainte de départ : la table `users` est custom (pas Supabase Auth), donc `auth.uid()` est
indisponible. Trois approches ont été étudiées :

| Approche | Verdict |
|---|---|
| **A. Claims JWT propagés par `SET LOCAL` + rôle Postgres applicatif dédié** | **Retenue** |
| B. Adoption partielle de Supabase Auth (GoTrue) avec `users` en miroir | Écartée |
| C. Rôles Postgres par niveau de privilège (un pool par rôle) | Écartée |

**Pourquoi A** : conserve le JWT maison exigé par le périmètre ; *fail-closed* (une requête
qui oublie le wrapper n'a aucun claim → les policies refusent — un oubli devient un bug
visible, pas une faille silencieuse) ; compatible avec le pooler Supabase en mode transaction
(`SET LOCAL` est transactionnel par définition) ; permet des policies par utilisateur
(`app_user_id()`), pas seulement par rôle.

**Pourquoi pas B** : `auth.uid()` n'est « natif » que via PostgREST/supabase-js ; en connexion
Postgres directe (notre couche Kysely), il lit `request.jwt.claims`, qu'il faudrait poser via
`SET LOCAL`… soit la même plomberie que A, plus une dépendance GoTrue, et un remplacement du
flux JWT maison déjà validé.

**Pourquoi pas C** : les policies ne connaîtraient que le rôle, jamais l'utilisateur — aucune
policy par ligne possible (ex. « un technicien ne modifie que ses incidents ») sans tout
refaire ; C est un sous-ensemble strict de A.

**Constat déterminant vérifié en base** : sur Supabase, le rôle `postgres` a `BYPASSRLS = true`
(requête `pg_roles`). Toute connexion applicative via `POSTGRES_URL` ignorerait donc RLS,
`FORCE ROW LEVEL SECURITY` inclus. Le rôle applicatif dédié n'est pas une préférence, c'est
une obligation.

### Implémentation (migration `004_rls_policies.sql`)

- Rôle `stockflow_app` (`NOLOGIN` dans la migration ; `LOGIN PASSWORD` posé hors-git,
  connexion via `APP_POSTGRES_URL`). Sans `BYPASSRLS`, non propriétaire → RLS s'applique.
- `withAuthContext(user, fn)` (src/db/client.ts) : transaction +
  `set_config('app.user_id'/'app.role', ..., true)` ; policies via `current_setting`.
- RLS activé sur `users`, `equipment`, `incidents`, `refresh_tokens` (13 policies) :
  - equipment/incidents : SELECT/INSERT/UPDATE pour `technician` et `admin`, DELETE `admin` ;
  - users : SELECT de sa propre ligne ou `admin` ; INSERT/UPDATE/DELETE `admin` ;
  - refresh_tokens : rôle app uniquement (flux auth, avant qu'une identité soit posée).
- **Grants par colonnes sur `users`** : `password_hash` est inscriptible mais illisible via le
  rôle app — même un attaquant exécutant du SQL arbitraire avec la connexion applicative ne
  peut pas lire les hashes. Le login passe par `auth_login_lookup` (fonction
  `SECURITY DEFINER` appartenant à `postgres`, `search_path` figé, EXECUTE réservé au rôle
  app, révoqué pour PUBLIC/anon/authenticated).
- Ceinture-bretelles : `REVOKE ALL … FROM anon, authenticated` — l'API Data Supabase
  (PostgREST) n'a plus aucun privilège sur ces tables (l'advisory « RLS disabled » de la
  session 1 est résorbée).

### Preuves (tests exécutés le 2026-07-03, tous verts)

- `src/lib/auth-core.test.ts` — 18 tests unitaires : signature/vérification JWT, expiration,
  clé étrangère, token altéré (tentative d'escalade de rôle), argon2id ok/ko, unicité et hash
  des refresh tokens, RBAC, rate limiting.
- `src/db/rls.integration.test.ts` — 13 tests d'intégration contre la base réelle, exécutés
  avec la **connexion applicative brute, sans la couche applicative** (simulation d'un
  contournement) : sans claims rien n'est visible ni modifiable ; un technicien ne peut ni
  supprimer un équipement, ni lire un autre utilisateur, ni lire `password_hash` (même le
  sien) ; un admin peut supprimer mais ne lit pas non plus les hashes.
- Script e2e (protocole RPC réel contre le dev server) : accès refusé sans session, login
  refusé sur mauvais mot de passe, login → cookies → données, logout → session révoquée.

### Dettes connues

- Zod ne valide que `loginFn` ; les server functions equipment gardent un cast TypeScript.
- En-têtes HTTP de sécurité (CSP…) non configurés.
- Rate limiting par instance (voir plus haut).
- `APP_POSTGRES_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` à provisionner sur Vercel avant le
  prochain déploiement.
