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
- `bun run build` — build production
- `bun run lint` / `bun run typecheck` / `bun run test`
- `bun run migrate` — applique les migrations SQL non appliquées
- `bun run check` — Biome check (lint + format en une passe)

## Pourquoi pas ESLint/Prettier

Biome couvre déjà lint (règles JS/TS/React/a11y) et format en un seul binaire, sans conflit de
config entre deux outils. Ajouter ESLint/Prettier en plus serait une redondance, pas un
complément — décision prise en session 0 bis.

## Variables d'environnement

Voir `.env.example`. En développement local, `POSTGRES_URL` doit être renseigné (actuellement
vide dans `.env.local` — dette connue, voir `PROGRESS.md` § Lot Déploiement).
