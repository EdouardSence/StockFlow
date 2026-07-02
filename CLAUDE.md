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

- Validation des entrées serveur : utiliser Zod dans chaque `createServerFn().inputValidator()`
  (actuellement absent sur certaines Server Functions de `src/lib/equipment.ts` — dette connue,
  voir PROGRESS.md, à combler avant la mise en prod publique).
- Accès DB exclusivement via Kysely (`src/db/client.ts`). Jamais de SQL concaténé/interpolé.
- Secrets uniquement en variables d'environnement (`.env.local`, jamais commité). `.env.example`
  documente les variables réellement utilisées par le code.
- RLS (Row Level Security) est désactivé sur `users`, `equipment`, `incidents` en base — connu,
  bloqué par l'absence d'authentification (cf. Lot Auth dans PROGRESS.md). Ne pas activer RLS
  sans policies définies : ça couperait tout accès applicatif.

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

## Traçabilité

Tout bug découvert devient une issue GitHub qualifiée (description, reproduction, impact) avant
correction, pour alimenter le plan de correction des bogues (C2.3.2) du dossier de certification.
Fermer l'issue avec un commentaire résumant le correctif appliqué, pas juste la fermer silencieusement.
