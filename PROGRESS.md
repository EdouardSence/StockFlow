# PROGRESS — StockFlow

Journal de bord. Rempli rétroactivement à la session 0 bis (2026-07-02) selon l'état réel constaté
par audit + vérifications directes (build/test/DB), pas par supposition. Chaque case cochée a été
vérifiée par un moyen concret listé dans les remarques.

## Lot Init / Outillage (session 0 bis)

- [x] Biome (lint + format) déjà en place au démarrage du projet
- [x] Script `typecheck` ajouté (`tsc --noEmit`)
- [x] Husky installé, hooks `pre-commit` (lint + typecheck) et `commit-msg` (commitlint)
- [x] commitlint configuré (conventional commits, type en anglais, sujet libre)
- [x] CI GitHub Actions (`.github/workflows/ci.yml`) : lint → typecheck → test → build, sur Bun
- [x] `.env.example` vérifié contre les vraies variables lues par le code (`POSTGRES_URL`,
      fallback `DATABASE_URL`)
- [ ] ESLint / Prettier — **décision : ne pas ajouter**, redondant avec Biome qui couvre déjà
      lint + format sur ce projet. Les ajouter créerait des règles concurrentes.

### Remarques
- `bun run lint && bun run typecheck && bun run test && bun run build` : tous verts en fin de
  session (vérifié par exécution directe).

## Lot Schéma & migrations

- [x] `equipment.type` réduit à `pc | screen | printer | other` (migration
      `002_equipment_type_reduce_enum.sql`)
- [x] Contrainte CHECK `equipment_type_check` appliquée en base de production (Supabase, projet
      `npdfobiadwtxbvpyxydr`) et vérifiée par `pg_get_constraintdef`
- [x] Remap des valeurs existantes (`laptop`→`pc`, `phone`→`other`) — aucune ligne affectée, les
      3 tables étaient vides (0 lignes) au moment de la migration
- [x] Contrainte testée activement : un INSERT avec `type='laptop'` est rejeté (erreur 23514
      confirmée), un INSERT avec `type='pc'` passe et prend `status='available'` par défaut
- [x] `scripts/migrate.ts` généralisé pour appliquer tous les fichiers `src/db/migrations/*.sql`
      par ordre alphabétique (au lieu de ne lancer que `001_init.sql` en dur)
- [x] Migration 003 (session 2) : `users.password_hash` + table `refresh_tokens` — appliquée
      en production
- [x] Migration 004 (session 2) : rôle `stockflow_app`, RLS + 13 policies sur les 4 tables,
      grants par colonnes, fonctions SECURITY DEFINER — appliquée en production et vérifiée
      par tests d'intégration

### Remarques
- Le projet Supabase était en pause (`INACTIVE`) au début de la session, réveillé via l'outil
  MCP Supabase avant application de la migration.
- **RLS (Row Level Security) désactivé** sur les 3 tables (`users`, `equipment`, `incidents`) —
  signalé par l'advisory Supabase. Non corrigé cette session : activer RLS sans policies
  bloquerait tout accès applicatif, et il n'y a pas encore d'auth pour définir des policies
  pertinentes. À traiter avec le Lot Auth.

## Lot Auth (session 2, 2026-07-03)

- [x] JWT RS256 : access token 15 min (claims sub/role/name/email, issuer/audience vérifiés,
      algorithme verrouillé RS256) — lib `jose`, clés PEM en env (base64). Vérifié : 5 tests
      unitaires (roundtrip, expiration, mauvaise clé, token altéré/escalade de rôle, chaîne
      arbitraire), tous verts.
- [x] Refresh token : opaque 256 bits, hashé SHA-256 en DB (`refresh_tokens`, migration 003),
      cookie httpOnly/secure/SameSite=Strict 7 j, **rotation à chaque usage** + détection de
      réutilisation (token tourné réutilisé après 10 s de grâce → révocation de toute la famille).
- [x] Mots de passe : argon2id (`@node-rs/argon2`), hash factice vérifié quand l'email est
      inconnu (anti-énumération par timing). Vérifié : tests unitaires ok/ko/hash corrompu.
- [x] Rate limiting login : 5 échecs / 15 min par email (en mémoire — plafond documenté :
      par instance serverless). Vérifié : 4 tests unitaires.
- [x] RBAC : `assertRole` + `authMiddleware`/`adminMiddleware` (TanStack `createMiddleware`).
      Toutes les server functions equipment protégées par `authMiddleware` — la vérification
      est côté serveur, l'UI (garde `beforeLoad` → redirect `/login`) n'est que du confort.
- [x] Écran `/login` minimal ; pas d'inscription publique — comptes créés via
      `scripts/seed-admin.ts` (admin seedé et vérifié). Logout dans la Sidebar (révoque le
      refresh token en DB + purge les cookies).
- [x] **Vérifié de bout en bout** (dev server + protocole RPC réel) : accès protégé sans
      session rejeté UNAUTHORIZED ; mauvais mot de passe rejeté (message générique) ; login →
      cookies posés → `getSession`/`getEquipments` OK ; logout → session nulle. Script e2e
      rejoué avec succès le 2026-07-03.
- [ ] Gestion des comptes via UI admin (création/désactivation) — à construire ; seed
      uniquement pour l'instant.
- [x] Changement de mot de passe self-service (issue #13, 2026-07-07) : page `/account`,
      server function `changePasswordFn` (Zod, `authMiddleware`). `users_update` étant
      admin-only (RLS), deux fonctions SECURITY DEFINER dédiées (`auth_password_lookup`,
      `auth_change_password`, migration `005_password_self_service.sql`) bypass RLS pour
      cette seule colonne — jamais appelées avec un id arbitraire, toujours `context.user.id`
      résolu du JWT. Vérifié : 4 tests Zod (`auth.test.ts`) + scénarios e2e AC1-AC3
      (`e2e/account.spec.ts`) sur des comptes éphémères dédiés (pas de mutation sur
      `E2E_TECH`, partagé par d'autres specs).

### Remarques
- Fichiers : `src/lib/auth-core.ts` (logique pure testée), `src/lib/auth-server.ts` (serveur
  uniquement — ne JAMAIS l'importer statiquement depuis un module atteignable par le client,
  l'import-protection du bundler casse le build sinon), `src/lib/auth.ts` (déclarations server
  functions/middlewares, client-safe).
- Zod valide les entrées de `loginFn`. Les server functions equipment gardent leur cast
  TypeScript sans validation runtime — dette restante, voir Lot Sécurité.

## Lot RLS / Défense en profondeur (session 2, 2026-07-03)

- [x] **RLS activé sur les 4 tables** (users, equipment, incidents, refresh_tokens) —
      migration 004, appliquée en production. L'advisory Supabase « RLS disabled » est résorbée.
- [x] Architecture retenue : **claims JWT propagés par `SET LOCAL` + rôle Postgres applicatif
      dédié** (`stockflow_app`, sans BYPASSRLS). Alternatives écartées et justification :
      docs/certification/09-securisation.md.
- [x] `withAuthContext(user, fn)` (src/db/client.ts) : transaction + `set_config('app.user_id'/
      'app.role', ..., true)` ; les policies lisent `current_setting`. Fail-closed : requête
      hors wrapper = zéro claim = accès refusé.
- [x] Grants par colonnes sur `users` : `password_hash` inscriptible mais **illisible** via le
      rôle app (même admin, même en contournant l'app). Le login passe par la fonction
      `SECURITY DEFINER auth_login_lookup`, seule à voir le hash.
- [x] **Vérifié par 13 tests d'intégration contre la vraie base** (src/db/rls.integration.test.ts,
      connexion applicative brute = couche app contournée) : sans claims → 0 ligne visible,
      INSERT/UPDATE bloqués ; technicien → CRUD equipment ok, DELETE refusé, ne lit que sa
      ligne users, `SELECT password_hash` → permission denied ; admin → DELETE ok, hash
      toujours illisible. Tous verts le 2026-07-03.
- [x] `postgres` (BYPASSRLS confirmé par requête pg_roles) réservé aux migrations/seeds ;
      le runtime utilise `APP_POSTGRES_URL`. Corrigé session 3 : `src/db/client.ts` lève une
      erreur au démarrage si `APP_POSTGRES_URL` est absent (fail-closed, plus de fallback
      silencieux vers `POSTGRES_URL`/BYPASSRLS).
- [x] **Limite honnête du modèle de menace documentée** (revue adversariale session 3,
      voir docs/certification/09-securisation.md) : les policies basées sur `current_setting`
      protègent contre un oubli de `withAuthContext` (fail-closed) et contre la surface
      PostgREST/anon — **pas** contre une connexion `stockflow_app` elle-même compromise
      (SQL arbitraire), qui peut forger `set_config('app.role','admin')` et s'auto-promouvoir
      via `UPDATE users`. C'est une propriété connue de toute RLS à claims auto-déclarés, pas
      un oubli de cette implémentation — mais le dossier de certification doit le présenter
      ainsi plutôt que comme une garantie absolue.

## Lot Auth — revue de sécurité adversariale (session 3, 2026-07-04)

Revue multi-agents (findings → réfutation indépendante Sonnet 5, 14 findings distincts jugés,
0 erreur de vérification) sur le diff auth+RLS de la session 2. Détail complet, verdicts et
correctifs : docs/certification/09-securisation.md.

- [x] **5 corrections appliquées et vérifiées** (tsc/lint/41 tests/build verts + smoke test
      direct contre la vraie base) :
  - Fail-open RLS (`APP_POSTGRES_URL` absent → BYPASSRLS silencieux) → throw au démarrage.
  - Fenêtre de grâce (10 s) de rotation du refresh token s'appliquait aussi aux tokens révoqués
    par **logout** → un cookie volé rejoué juste après un logout légitime obtenait quand même
    un access token. Logout revoque désormais hors fenêtre de grâce (traité comme vol si rejoué).
  - Fenêtre de grâce ne vérifiait pas `expires_at` → corrigé au passage.
  - Rotation du refresh token non atomique (deux requêtes concurrentes avec le même token
    pouvaient toutes deux tourner et laisser un token orphelin valide 7 j) → `UPDATE ... WHERE
    revoked_at IS NULL` conditionnel (compare-and-swap sur `numUpdatedRows`).
  - Rate limiter de login clé sur l'email seul, vérifié avant les identifiants → un attaquant
    distant pouvait verrouiller le compte de quiconque pendant 15 min en connaissant juste son
    email (DoS ciblé). Clé recomposée en `IP:email` (`getRequestIP({xForwardedFor:true})`).
  - Map du rate limiter jamais purgée (croissance mémoire non bornée) → éviction des entrées
    expirées à la lecture.
- [x] Sentry `sendDefaultPii` passé à `false` (était `true` — fuite IP/PII par défaut vers un
      tiers, point RGPD, trouvé par la même revue).
- [x] **Dette corrigée depuis** (sessions 10 quater/quinquies, issues #8/#14/#15 fermées) :
  - Rate limiter à trois étages (paire IP:email 5, email 20, IP 30 — 15 min) contre le
    brute-force distribué et le credential stuffing ; reste en mémoire par instance
    (résiduel documenté dans #15).
  - Messages d'erreur Postgres bruts (noms table/contrainte/colonne) sérialisés jusqu'au client
    sur les server functions equipment sans validation runtime — corrélé à la dette Zod déjà
    connue, mais c'est un vecteur de fuite distinct (fuite de schéma, pas juste absence de
    validation).
  - Pas de « déconnexion de tous les appareils » : un refresh token volé n'est invalidé que par
    détection de réutilisation (rotation), pas par un logout ou un re-login explicite. Atténué
    par la détection de réutilisation existante, mais reste une fonctionnalité manquante.
  - `auth_login_lookup` (SECURITY DEFINER) reste appelable sans claims et expose
    `password_hash` à quiconque tient la connexion `stockflow_app` — contredit la formulation
    trop absolue « password_hash illisible via le rôle app » (vrai contre un `SELECT` négligent,
    faux contre un attaquant SQL arbitraire, qui a de toute façon un chemin plus direct via
    `UPDATE users`). À reformuler dans le dossier, pas un correctif de code isolé.
  - JWT access token stateless : rôle/suppression/logout non appliqués pendant les 15 min de
    TTL restantes (tradeoff standard, documenté, pas un oubli).

### Remarques
- 3 des 4 dimensions de revue et tous les vérificateurs de la première passe ont échoué sur
  une limite de session (crash, pas refus) — le résultat initial « tout réfuté » était un
  artefact du fallback `?? 'REFUTED'` du script, pas une vérification réelle. Reconduit
  intégralement sur Sonnet 5 (14/14 vérifications réussies, 0 erreur) avant tout correctif.
  Rappel pour la suite : ne jamais interpréter un résultat de workflow comme concluant sans
  lire `journal.jsonl` et confirmer l'absence d'échecs silencieux.

## Lot CRUD équipements

- [x] Routes présentes et code compile : `/equipment` (liste), `/equipment/new` (création),
      `/equipment/$id` (détail + changement de statut), versions desktop et mobile (détection
      responsive < 768px)
- [x] Couche DB vérifiée directement : INSERT/SELECT/DELETE fonctionnent contre la vraie base
      Supabase (testé via SQL direct)
- [x] Lecture de bout en bout vérifiée en session 2 : `getEquipments` via le protocole RPC réel
      avec session authentifiée renvoie les données (l'erreur 500 de la session 1 venait du
      `POSTGRES_URL` vide, résolu par `APP_POSTGRES_URL`).
- [ ] Formulaire de création (`/equipment/new`) non testé manuellement bout en bout cette session

### Remarques
- `/scan` répond bien en 200 en local (ne dépend pas de la DB au chargement initial).
- Prochaine session : obtenir un `POSTGRES_URL` de dev (ou pointer vers une DB Supabase locale)
  pour permettre les tests SSR en local.

## Lot Génération QR

- [x] Génération réelle via la lib `qrcode`, composant `QRCodeImage` dans `/equipment/new`,
      encode l'URL absolue `/equipment/:id` — code présent et compile
- [ ] Non revérifié visuellement cette session (dernière vérification connue : session du
      2026-05-08, cf. historique de commits)

## Lot Scan mobile

- [x] Route `/scan` répond 200 en local
- [x] Parsing d'URL QR (regex UUID) et navigation vers `/equipment/$id` : code présent, inchangé
      depuis la dernière vérification fonctionnelle (session du 2026-05-08)
- [ ] Test caméra réel non repassé cette session (nécessite un device physique / permissions
      navigateur, non testable en environnement CLI)

## Lot Pannes & assignation (session 6, 2026-07-05)

- [x] Noyau fonctionnel pur avec Effect (première utilisation dans le codebase, voir
      `docs/certification/19-frameworks-paradigmes.md`) :
      `src/lib/incidents-domain.ts` (`transitionIncident`, cycle `open→in_progress→resolved`
      linéaire strict) et `src/lib/equipment-domain.ts` (`assignEquipment`, règles
      assignation/désassignation), types d'erreur discriminés (`Data.TaggedError`).
- [x] Coquille impérative : `src/lib/incidents.ts` (`createIncidentFn`, `listIncidentsFn`
      admin-only, `advanceIncidentFn`) et `assignEquipmentFn`/`getAssignableUsersFn` ajoutées à
      `src/lib/equipment.ts`, toutes derrière `authMiddleware`/`adminMiddleware`, persistées via
      `withAuthContext`.
- [x] Écran incidents admin (`src/routes/incidents.tsx`, route `/incidents`) conforme au mockup
      Claude Design (badges de statut sémantiques, bouton d'avancement, section "résolus
      récemment" repliée, `resolved_at` affiché) — gardé `adminMiddleware` : la policy RLS
      `users_select` ne laisse un technicien voir que sa propre ligne, une jointure vers `users`
      pour le nom du déclarant masquerait silencieusement les incidents des autres techniciens
      pour un non-admin.
- [x] Assignation sur `equipment/$id.tsx` : admin choisit n'importe quel utilisateur (liste
      complète visible par RLS) ; technicien limité à s'auto-assigner/se désassigner (RLS ne lui
      expose pas ses collègues — décision utilisateur explicite, pas une omission).
- [x] 22 tests de domaine exhaustifs (9 combinaisons `from×to` pour les incidents, 10 cas pour
      l'assignation) — 63/63 tests verts, `tsc`/Biome/build propres, `effect` confirmé absent du
      bundle client (vérifié dans `.output/public`).
- [x] Règle "auto-broken à l'ouverture d'un incident" tranchée **manuelle** (décision
      utilisateur) : ouvrir un incident ne change pas `equipment.status` automatiquement, un
      admin doit qualifier puis passer l'équipement en `broken` via l'action existante.
      Mitigation visuelle livrée (session 6 bis) : badge `OpenIncidentBadge` (nombre
      d'incidents ouverts/en cours) sur la liste équipements et la fiche `$id.tsx` —
      avertissement, jamais blocage.
- [x] UI de déclaration d'incident (session 6 bis) : la tuile "Signaler panne" (mobile,
      `$id.tsx`) appelle désormais `createIncidentFn` (ligne `incidents` réelle, `status open`,
      `reported_by` = user courant, description optionnelle) et ne touche plus
      `equipment.status`. Validation d'entrée `validateNewIncidentInput` +
      `normalizeIncidentDescription` côté serveur.
- [x] Vérifié sous RLS (tests d'intégration) : un technicien peut créer un incident sur un
      équipement qui lui est assigné ET sur un équipement non assigné — les deux cas sont
      légitimes, la policy `incidents_insert` n'a volontairement aucun filtre de propriété.
- [x] Suite de tests : 72/72 verts (7 tests unitaires validation incident + 2 tests RLS
      ajoutés en session 6 bis).

## Lot PWA offline

- [ ] **Absent.** `vite-plugin-pwa` est dans `devDependencies` mais jamais importé dans
      `vite.config.ts` — pas de service worker généré, pas de cache offline.
- [x] Manifest corrigé cette session : `manifest.webmanifest` référençait `/icon-192.png` et
      `/icon-512.png`, absents du repo. Fichiers dupliqués depuis `logo192.png`/`logo512.png`.
- [ ] Le manifest n'est **toujours pas lié** dans le `<head>` (`src/routes/__root.tsx` n'a pas de
      `<link rel="manifest">`) — l'app n'est pas installable en l'état, indépendamment du fix
      d'icônes. Hors périmètre de cette session (décision explicite : corriger seulement la
      référence cassée, pas câbler le PWA complet).

## Lot Harnais de tests

- [ ] 10 tests unitaires existants (`src/lib/equipment.test.ts`), tous passants, couvrant
      uniquement `validateNewEquipmentInput` et `applyEquipmentDefaults` (logique pure).
      **Insuffisant** pour le critère de couverture ≥ 80 % de la logique métier visé par la
      certification — aucun test sur les Server Functions (`getEquipments`, `createEquipmentFn`,
      `updateEquipmentStatus`), aucun test d'intégration route.

## Lot Sécurité OWASP + Accessibilité RGAA

- [x] Auth + RBAC + RLS livrés et testés (voir Lot Auth et Lot RLS, session 2). Couvre :
      broken access control (middlewares serveur + RLS), cryptographic failures (argon2id,
      RS256, tokens hashés en DB), identification failures (rotation refresh, anti-énumération,
      rate limiting). Détail et choix d'architecture : docs/certification/09-securisation.md.
- [x] Zod sur les server functions equipment (session 10 quater, issue #14) : schémas
      `newEquipmentSchema`/`equipmentIdSchema`/`updateEquipmentStatusSchema`/
      `assignEquipmentSchema` parsés dans `inputValidator`, défauts et normalisation à null
      intégrés, 12 tests unitaires (74 au total).
- [x] Erreurs Postgres brutes masquées au client (issue #8, F11) : interception SQLSTATE
      dans `withAuthContext` (point unique), détail loggé serveur, message générique client.
- [x] En-têtes de sécurité HTTP (issue #17) : vercel.json — CSP (limite documentée :
      `'unsafe-inline'` script requis par l'hydratation TanStack Start), XCTO, XFO DENY,
      Referrer-Policy, Permissions-Policy (camera=self pour le scan), HSTS. Vérifiés en prod,
      zéro violation CSP sur les parcours réels.
- [x] Audit OWASP formalisé (issue #18, 2026-07-07) : checklist Top 10 (2021) complète dans
      `09-securisation.md` — statut par catégorie avec preuves (code, tests, issues), 4
      catégories 🟡 aux résiduels tracés (#4, #5, #7, #24), `bun audit` passé (16 vulns
      transitives confinées à l'outillage dev, issue #24).
- [x] Accessibilité : lint `lint/a11y/*` de Biome au vert sur tout le repo (17 fichiers), corrigé
      cette session (issue GitHub #3 fermée avec le détail des correctifs). Ce n'est qu'un socle
      mécanique (titres SVG, aria-hidden, labels, fieldset/legend) — pas un audit RGAA complet
      (pas de test lecteur d'écran, pas de vérification de contraste, pas de test clavier complet).

## Lot Cahier de recette + bugs (session 10, 2026-07-06)

- [x] Suite e2e Playwright complète (`e2e/`, 6 specs) : 19 scénarios couvrant auth (4),
      RBAC (3, dont replay réseau d'un appel serveur admin-only avec session technicien),
      CRUD équipement + génération QR (4), scan via contrat d'URL encodée (2), boucle
      incidents avec assertions en base réelle (3), assignation (3). **19/19 verts, 35,9 s**
      (2026-07-06). Base partagée confinée : préfixe `e2e-ephemeral-` + sweep avant/après
      (0 résidu vérifié au run suivant).
- [x] `docs/certification/13-cahier-de-recettes.md` rédigé depuis les résultats réels :
      tableau par fonctionnalité (ID, acteur, prérequis, étapes, attendu, obtenu, renvoi
      test), anomalies, hors-périmètre livré documenté explicitement (PWA, export, notifs,
      journal d'audit, suppressions, caméra réelle).
- [x] Processus detect → qualifie → corrige appliqué : anomalie AN-1 (bouton « Saisir le
      code manuellement » de `scan.tsx` sans action) → issue #22 qualifiée sur le Kanban,
      pas de correction silencieuse. Fausse piste R3 (HTTP 200 sur refus) investiguée et
      écartée : sérialisation d'erreur TanStack Start, le serveur refuse bien (FORBIDDEN).
- [x] Couverture remesurée (2026-07-06) : chiffres identiques — l'e2e tourne dans le
      process du serveur dev, hors instrumentation v8. Prédiction corrigée honnêtement
      dans `12-couverture-de-code.md`.
- [x] Session 10 ter — tableau de bord (design « StockFlow v1.dc.html », décision : fusion
      dans le shell existant, login + sidebar conservés) : la racine desktop est une vraie
      page « Vue d'ensemble du parc » (4 KPI, parc récent avec assigné/statut/actions
      contextuelles, actions rapides, incidents ouverts). `listOpenIncidentsFn` sans join
      `users` (RLS technicien). Scénarios D1-D3, suite e2e **24/24** (39,4 s). Hors scope
      assumé de v1 : header à onglets (artefact de prototype), champs formulaire absents du
      schéma (état général, date d'achat, localisation), indicateur online/offline (PWA #9).
- [x] Session 10 bis : AN-1 corrigée (#22, saisie manuelle du code avec vérification
      serveur via `getEquipmentById`, scénarios SC3/SC4) ; AN-2 découverte par SC3 et
      corrigée (#23, crash au démontage de `/scan` après échec caméra — `stop()`
      html5-qrcode jette en synchrone). Suite e2e à **21/21** (41,7 s).

## Lot Documentation certification (session, 2026-07-05)

Rédaction des pièces Bloc 2 qui n'avaient aucune dépendance bloquante (contenu déjà factuel :
cadrage Bloc 1, code livré, git log). Numérotées 17-20 pour éviter toute collision avec la
numérotation locale déjà en place (02/04/06/12 pris par d'autres sujets) — voir la note dans
`docs/certification/17-criteres-qualite-performance.md`.

- [x] `docs/certification/17-criteres-qualite-performance.md` — 8 KPI du cadrage Bloc 1 (cible
      vs. état de mesure réel, la plupart « non mesuré » plutôt qu'inventés) + gates CI/Husky
      réellement en place.
- [x] `docs/certification/18-architecture.md` — vue conteneur C4 (client/server functions/data),
      table cadrage vs. réel (incidents/dashboard/PWA non construits).
- [x] `docs/certification/19-frameworks-paradigmes.md` — stack justifiée + paradigme réel du
      code. Effect (`^3.21.2`, `package.json`) évalué et retenu au cadrage Bloc 1 pour la
      logique métier critique ; intégration délibérément différée sur le domaine adapté à ses
      garanties (transitions d'état, cas d'erreur réels) plutôt qu'utilisée sur de l'auth déjà
      simple — prévue session 6 (pannes & assignation).
- [x] `docs/certification/20-derniere-version-stable.md` — snapshot au tag `v0.3.0` (document
      vivant, à remettre à jour à chaque tag).
- [x] `docs/certification/08-historique-versions.md` — tags `v0.2.0`/`v0.3.0` + convention de
      commit + l'épisode des 4 commits `fix:` post-revue de sécurité (documenté comme choix
      délibéré de ne pas réécrire l'historique, voir aussi Lot Auth — revue adversariale).
- [x] `docs/certification/11-harnais-de-tests.md` — état réel des 41 tests (18 auth-core + 13
      RLS intégration + 10 equipment), document vivant. Note : `test:coverage` existe en script
      mais pas encore en étape CI, pourcentage réel non mesuré.
- [x] `docs/certification/01-deploiement-continu.md` — correction de la phrase périmée « pas
      encore passé en conditions réelles » (la CI a tourné sur tout le lot auth/RLS, 8 commits).

## Lot Déploiement + manuels

### Remarques (état réel constaté)
- Migration SQLite → Supabase PostgreSQL déjà effectuée (commits du 2026-05-08).
- Déploiement Vercel actif, projet lié (`stock-flow`), variables d'environnement de production
  déjà configurées côté Vercel (Supabase intégration native).
- ~~Gap local : `.env.local` a `POSTGRES_URL=""`~~ **Résolu en session 2** : `APP_POSTGRES_URL`
  (rôle applicatif RLS) est posé en local — le dev server se connecte, `/equipment` répond.
  `POSTGRES_URL` (rôle postgres, migrations) reste vide en local ; les migrations passent par
  le MCP Supabase.
- **⚠️ Action requise avant le prochain déploiement Vercel** : ajouter en Production les
  variables `APP_POSTGRES_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (valeurs dans `.env.local`).
  Sans `APP_POSTGRES_URL`, l'app tournerait avec le rôle postgres et RLS serait inopérant ;
  sans les clés JWT, toute requête auth échoue au démarrage.
- Projet Supabase se met en pause automatiquement (plan gratuit, `INACTIVE` après inactivité) —
  à anticiper : la première requête après une pause peut timeout le temps du réveil (~2-3 min
  constaté cette session).
- Pas de manuel de déploiement ni de manuel de mise à jour rédigés à ce jour (pièces 01 et 16 du
  dossier de certification, ébauchées dans `docs/certification/`).

## Lot Rapport

- [ ] Non commencé — pour bien plus tard.

---

## Reprise prochaine session

- Poser les 3 variables d'env sur Vercel (voir ⚠️ ci-dessus) puis déployer et vérifier l'auth
  en production.
- Construire le Lot Pannes & assignation (table `incidents` prête, policies RLS déjà en place).
- Résorber la dette Zod sur les server functions equipment.
