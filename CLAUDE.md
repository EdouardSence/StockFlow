# StockFlow

Gestion de parc informatique pour TPE/PME (équipements, QR codes, scan mobile, incidents).
Projet de certification RNCP 39583 niveau 7, Bloc 2 (code source + dossier 30 pages, jury).

## Stack réelle

- Runtime/package manager : Bun
- Framework : TanStack Start (React 19, SSR) + TanStack Router (routes fichier)
- Build : Vite 8 + Nitro
- DB : PostgreSQL (Supabase), driver `pg`, query builder Kysely (`src/db/client.ts`)
- Style : Tailwind CSS 4
- Lint/format : Biome (PAS ESLint/Prettier — redondant, ne pas ajouter)
- Tests : Vitest
- Erreurs prod : Sentry (import dynamique côté client uniquement, cf. `src/routes/__root.tsx`)
- QR : génération `qrcode`, scan `html5-qrcode`
- Déploiement : Vercel, intégration Supabase native (`POSTGRES_URL` / `DATABASE_URL`)

## Modèle de données (post-migration 002)

```
users(id, name, email, role: admin|technician, created_at)
equipment(id, name, type: pc|screen|printer|other, brand, model, serial_number,
          qr_code, status: available|assigned|broken|maintenance,
          assigned_to FK→users, notes, created_at, updated_at)
incidents(id, equipment_id FK→equipment, reported_by FK→users, description,
          status: open|in_progress|resolved, created_at, resolved_at)
```

Migrations dans `src/db/migrations/*.sql`, appliquées par ordre alphabétique via `bun run migrate`
(voir `scripts/migrate.ts`). Toute évolution de schéma = nouveau fichier `NNN_description.sql`,
jamais d'édition d'un fichier de migration déjà appliqué en prod.

`equipment.type` est contraint en DB par un CHECK constraint (`equipment_type_check`), pas
seulement côté TypeScript — les deux doivent rester synchronisés.

## Conventions de commit

Conventional Commits, message en français, type en anglais :
`feat|fix|docs|style|refactor|perf|test|chore(scope): description en français`

Vérifié automatiquement par commitlint (hook `commit-msg`, config `commitlint.config.js`).

## Sécurité

- **Auth** : JWT RS256 maison (access 15 min + refresh rotatif en cookies httpOnly). Toute
  nouvelle server function touchant aux données DOIT porter `authMiddleware` (ou
  `adminMiddleware`) de `src/lib/auth.ts` — la garde `beforeLoad` côté routes est du confort
  UX, jamais la barrière.
- **RLS actif** sur les 4 tables (users, equipment, incidents, refresh_tokens) avec le rôle
  `stockflow_app` (`APP_POSTGRES_URL`). Toute requête de données DOIT passer par
  `withAuthContext(context.user, trx => ...)` (src/db/client.ts) — hors de ce wrapper, aucun
  claim n'est posé et Postgres refuse tout (fail-closed, c'est voulu).
- `src/lib/auth-server.ts` ne doit JAMAIS être importé statiquement depuis un module
  atteignable par le client (routes, composants, auth.ts) : import dynamique dans les
  handlers uniquement, sinon l'import-protection casse le build.
- `users.password_hash` est illisible via le rôle app (grant par colonnes) ; le login passe
  par la fonction SECURITY DEFINER `auth_login_lookup`. Ne pas « corriger » un
  `permission denied` sur cette colonne en élargissant les grants.
- Validation des entrées serveur : Zod dans `inputValidator()` (fait pour `loginFn` ; dette
  restante sur les server functions equipment, voir PROGRESS.md).
- Accès DB exclusivement via Kysely (`src/db/client.ts`). Jamais de SQL concaténé/interpolé.
- Secrets uniquement en variables d'environnement (`.env.local`, jamais commité). `.env.example`
  documente les variables réellement utilisées. `POSTGRES_URL` (rôle postgres, BYPASSRLS) est
  réservé aux migrations/seeds — le runtime utilise `APP_POSTGRES_URL`.

## Accessibilité (RGAA)

Critère éliminatoire de la certification. Règles Biome `lint/a11y/*` doivent rester au vert.
- Toute icône SVG décorative (accompagnée de texte visible ou dans un bouton déjà nommé) :
  `aria-hidden="true"`.
- Tout bouton icône seul (sans texte visible) : `aria-label` explicite.
- Tout groupe de contrôles (boutons radio-like, checkboxes) : `<fieldset><legend>`, pas de
  `<label>` orphelin.

## Tests

Objectif : couverture ≥ 80 % sur la logique métier pure (`src/lib/*.ts`), critère éliminatoire.
Ne pas viser 80 % de couverture globale (le JSX de présentation n'a pas besoin de tests unitaires
exhaustifs — privilégier des tests d'intégration ciblés sur les routes critiques si besoin).

## Tests e2e (Playwright)

⚠️ **La base Postgres est partagée dev/test/prod** (un seul projet Supabase — dette connue,
la vraie solution à terme est une base de test séparée, branche ou second projet Supabase).
En conséquence :
- La suite e2e (`bun run test:e2e`, `e2e/`) ne tourne **JAMAIS automatiquement en CI** —
  uniquement en local, à la demande, sous supervision.
- Toute donnée créée par un test e2e porte le préfixe strict `e2e-ephemeral-` (id, email,
  qr_code…) — jamais un simple `test-`. Constante `E2E_PREFIX` dans `e2e/support/db.ts`.
- Le sweep (`sweepEphemeralData`) supprime toute ligne matchant le préfixe et tourne avant
  la suite (restes d'un run interrompu) ET après (best-effort, globalTeardown) — pas de
  cleanup par test isolé qui pourrait être sauté.

## Traçabilité

Tout bug découvert devient une issue GitHub qualifiée (description, reproduction, impact) avant
correction, pour alimenter le plan de correction des bogues (C2.3.2) du dossier de certification.
Fermer l'issue avec un commentaire résumant le correctif appliqué, pas juste la fermer silencieusement.
