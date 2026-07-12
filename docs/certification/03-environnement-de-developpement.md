# 03 — Environnement de développement

## Outils

| Outil | Rôle |
|---|---|
| Bun | Runtime + gestionnaire de paquets + test runner |
| Biome | Lint + format (remplace ESLint + Prettier — un seul outil, une seule config) |
| TypeScript | Typage statique, vérifié par `tsc --noEmit` |
| Vitest | Tests unitaires |
| Husky | Hooks git locaux |
| commitlint | Validation du format des messages de commit |

## Scripts (`package.json`)

- `bun run dev` — serveur de dev (Vite, port 3000)
- `bun run build` — build production (+ copie du service worker PWA dans `.output/public`)
- `bun run preview` — sert le build de production
- `bun run lint` / `bun run typecheck` / `bun run test` / `bun run test:coverage`
- `bun run test:e2e` — suite Playwright (local uniquement, base partagée — cf. CLAUDE.md)
- `bun run migrate` — rejoue les migrations SQL (idempotentes, ordre alphabétique)
- `bun run check` — Biome check (lint + format en une passe)

## Pourquoi pas ESLint/Prettier

Biome couvre déjà lint (règles JS/TS/React/a11y) et format en un seul binaire, sans conflit de
config entre deux outils. Ajouter ESLint/Prettier en plus serait une redondance, pas un
complément — décision prise en session 0 bis.

## Variables d'environnement

Voir `.env.example` (documente les trois variables réellement utilisées et la génération
des clés JWT). En local, `APP_POSTGRES_URL` (rôle applicatif RLS) suffit au runtime ;
`POSTGRES_URL` (rôle propriétaire) ne sert qu'aux migrations. Détail des rôles :
`09-securisation.md` et `15-manuel-deploiement.md`.
