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
- **Grants par colonnes sur `users`** : `password_hash` est inscriptible mais non lisible par un
  `SELECT` direct via le rôle app — bloque un bug applicatif (ex. un futur `SELECT *`
  négligent) qui exposerait le hash. Le login passe par `auth_login_lookup` (fonction
  `SECURITY DEFINER` appartenant à `postgres`, `search_path` figé, EXECUTE accordé au rôle app).
  **Nuance importante (revue session 3, voir plus bas)** : cette fonction reste appelable sans
  claims posés, donc un attaquant qui tiendrait la connexion `stockflow_app` elle-même (SQL
  arbitraire) peut boucler dessus pour tous les emails et exfiltrer tous les hachages — le
  grant par colonnes protège contre un bug de lecture négligent, pas contre une connexion
  applicative totalement compromise (qui a de toute façon un chemin plus direct : forger
  `set_config('app.role','admin')` puis `UPDATE users SET role='admin'`, cf. plus bas).
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

## Revue de sécurité adversariale (session 3, 2026-07-04)

### Méthode

Revue à deux passes sur l'ensemble du diff auth+RLS de la session 2 : (1) plusieurs agents
« auditeurs » indépendants (JWT/crypto, sessions/cookies, RLS/SQL, intégration applicative)
cherchent des failles avec scénario d'attaque concret exigé ; (2) chaque finding est ensuite
soumis à un agent « réfuteur » indépendant, chargé explicitement de le contredire contre le
code réel, avec consigne « en cas de doute → réfuté ». Seuls les findings qui survivent cette
contradiction sont retenus. La première exécution de cette revue a été interrompue par une
limite de session : 3 des 4 auditeurs et les 14 réfuteurs ont échoué en cours de route, et le
script de post-traitement a silencieusement remplacé les échecs par un verdict « réfuté » par
défaut — un résultat « tout est réfuté » qui n'avait jamais été réellement vérifié. Reconduite
intégralement sur un second modèle avant tout correctif (14 findings distincts jugés, 0 échec).
Leçon retenue et appliquée : ne jamais interpréter un résultat de revue automatisée comme
concluant sans inspecter le journal d'exécution et confirmer l'absence d'échecs silencieux.

### Constat transversal le plus important

Sous l'hypothèse de menace « la connexion Postgres `stockflow_app` elle-même est compromise »
(exécution SQL arbitraire — c'est précisément l'hypothèse testée par
`rls.integration.test.ts`), la RLS à claims auto-déclarés (`SET LOCAL app.role`, sans
`auth.uid()` natif) **ne protège pas** : l'attaquant peut poser lui-même
`set_config('app.role','admin')` puis exécuter directement `UPDATE users SET role='admin'
WHERE id=<son id>` — élévation immédiate, plus directe que n'importe quel autre chemin
d'attaque envisagé (contournement de policy sur `refresh_tokens`, extraction de `password_hash`
via `auth_login_lookup`…). Ce que cette architecture RLS protège réellement :
1. un bug applicatif qui **oublie** `withAuthContext` (fail-closed : zéro claim posé, Postgres
   refuse tout) ;
2. la surface PostgREST/anon (`REVOKE ALL … FROM anon, authenticated`).
Elle ne protège **pas** contre un serveur applicatif totalement compromis avec exécution SQL
libre — sous cette hypothèse, toute la mécanique de claims s'effondre au même titre que le
reste. C'est une propriété connue de toute RLS basée sur des claims de session plutôt que sur
une identité native Postgres (option B écartée pour d'autres raisons, cf. plus haut), pas un
défaut spécifique à cette implémentation — mais elle doit être présentée ainsi au jury plutôt
que comme une garantie absolue contre un « attaquant avec accès SQL ».

### Corrections appliquées suite à la revue

| # | Sévérité | Défaut | Correctif |
|---|---|---|---|
| Fail-open RLS | medium | `src/db/client.ts` retombait silencieusement sur `POSTGRES_URL` (rôle `postgres`, BYPASSRLS) si `APP_POSTGRES_URL` manquait — RLS désactivée sans la moindre erreur | Erreur levée au démarrage si `APP_POSTGRES_URL` absent |
| Grâce post-logout | medium | La fenêtre de grâce de rotation (10 s) ne distinguait pas un token révoqué par rotation d'un token révoqué par **logout** — un cookie volé rejoué dans les 10 s suivant un logout légitime obtenait quand même un nouvel access token, sans déclencher la détection de vol | `doLogout` révoque désormais hors fenêtre de grâce ; un replay est traité comme un vol (révocation de la famille) |
| Grâce ignore l'expiration | low | La branche de grâce ne vérifiait pas `expires_at` | Vérification ajoutée |
| Rotation non atomique | medium | Deux requêtes concurrentes avec le même refresh token pouvaient toutes deux tourner (`SELECT` puis `UPDATE` par `id`, sans condition), laissant un refresh token valide 7 j orphelin et non traçable | `UPDATE … WHERE revoked_at IS NULL` conditionnel (CAS), la requête perdante retombe en grâce |
| DoS par rate limiter | medium | Clé du rate limiter = email seul, vérifié avant les identifiants : un attaquant distant pouvait verrouiller le compte de n'importe qui pendant 15 min en connaissant juste son email | Clé recomposée `IP:email` (`getRequestIP({xForwardedFor:true})`) |
| Fuite mémoire rate limiter | low | La `Map` des tentatives n'était jamais purgée des entrées expirées | Éviction à la lecture |
| PII Sentry | low | `sendDefaultPii: true` envoyait IP + PII par défaut à un tiers (Sentry) | Passé à `false` |

Vérification post-correctif : `tsc` (0 erreur), Biome (0 issue), 41/41 tests (18 unitaires +
13 intégration RLS contre la vraie base + 10 equipment/rate-limit), build Vite/Nitro réussi, et
un smoke test direct contre la base réelle (login → logout → replay du refresh token volé dans
la fenêtre de grâce → **rejeté**, alors qu'il était accepté avant correctif ; rate limiter par
IP+email confirmé : la victime reste capable de se connecter depuis sa propre IP pendant qu'un
attaquant sur une autre IP est bloqué après 5 échecs).

### Findings réfutés (jugés non exploitables ou non pertinents pour ce projet)

- **Forge de session admin via `refresh_tokens` (policy `USING(true)`)** : réfuté — sous la
  précondition requise (connexion app compromise), il existe un chemin d'attaque strictement
  plus simple et direct sur `users` (cf. constat transversal ci-dessus), qui rend ce vecteur
  redondant. L'ouverture de la policy est un choix documenté et nécessaire (le flux de login
  écrit avant qu'une identité soit posée).
- **Absence de purge de `refresh_tokens`** : réfuté comme faille — l'absence de grant `DELETE`
  est en fait un *durcissement* (empêche un attaquant de couvrir ses traces), et le volume est
  négligeable à l'échelle visée (TPE/PME). C'est une dette d'hygiène opérationnelle, pas un
  risque de sécurité.
- **`REVOKE … FROM anon, authenticated` casserait une migration sur Postgres non-Supabase** :
  réfuté — aucune cible Postgres vanilla n'existe dans ce projet (CI ne lance pas de migration,
  dev et prod pointent tous deux vers Supabase, où ces rôles existent nativement).

### Findings confirmés mais jugés de sévérité mineure pour ce projet (non corrigés, documentés)

- **Access token JWT non révocable pendant sa durée de vie (15 min)** : un rôle rétrogradé, un
  compte supprimé ou un logout n'invalident pas un access token déjà émis avant son expiration
  naturelle. Tradeoff standard de toute architecture JWT stateless à courte durée de vie,
  documenté ici comme choix assumé plutôt que comme un oubli — fenêtre bornée à 15 min.
- **Pas de « déconnexion de tous les appareils »** : login et logout ne révoquent que la
  session courante, pas les autres refresh tokens actifs de l'utilisateur. Atténué par la
  détection de réutilisation déjà en place (dès que l'un des deux détenteurs du token rejoue
  après l'autre, toute la famille est révoquée) — le scénario « le token volé survit 7 jours
  pleins » ne tient que si la victime n'utilise plus jamais l'application pendant toute la
  fenêtre. Fonctionnalité manquante réelle, pas une faille activement exploitable dans le cas
  courant.
- **Messages d'erreur Postgres bruts renvoyés au client sur les server functions equipment**
  (noms de table/contrainte/colonne visibles si un technicien poste des données invalides,
  ex. `status` hors énumération) : corrélé à la dette Zod déjà connue mais distinct — c'est une
  fuite de schéma, pas seulement une absence de validation. Hors périmètre auth strict de cette
  session (touche le CRUD equipment), laissé en dette qualifiée pour la suite.
- **`auth_login_lookup` appelable sans claims** : voir la nuance ajoutée plus haut sur les
  grants par colonnes.
