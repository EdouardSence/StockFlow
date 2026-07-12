# StockFlow

Gestion de parc informatique pour TPE/PME : inventaire des équipements, QR codes,
scan mobile, signalement et suivi d'incidents — avec création d'incident hors-ligne
(PWA, file de synchronisation).

Projet de certification RNCP 39583 niveau 7, Bloc 2 (dossier : `docs/certification/`).

## Stack

| Couche | Choix |
|---|---|
| Runtime / packages | [Bun](https://bun.sh) |
| Framework | TanStack Start (React 19, SSR) + TanStack Router (routes fichier) |
| Build | Vite 8 + Nitro |
| Base de données | PostgreSQL (Supabase), query builder Kysely, RLS actif |
| Style | Tailwind CSS 4 |
| Lint / format | Biome |
| Tests | Vitest (unitaires) + Playwright (e2e, local uniquement) |
| PWA | vite-plugin-pwa (Workbox), IndexedDB pour la file offline |
| Erreurs prod | Sentry (client) |
| Déploiement | Vercel + intégration Supabase native |

## Démarrer

```bash
bun install
cp .env.example .env.local   # renseigner les variables (voir ci-dessous)
bun run migrate              # migrations SQL (src/db/migrations/, ordre alphabétique)
bun run dev                  # http://localhost:3000
```

Variables d'environnement (documentées dans `.env.example`) :

- `APP_POSTGRES_URL` — rôle applicatif `stockflow_app` (RLS), utilisé par le runtime.
- `POSTGRES_URL` — rôle postgres (BYPASSRLS), **réservé aux migrations/seeds**.
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — paire RS256 pour l'auth maison.

## Scripts

```bash
bun run dev            # serveur de dev (port 3000)
bun run build          # build prod (.output/) + copie du service worker
bun run preview        # sert le build prod
bun run test           # suite Vitest
bun run test:coverage  # couverture (v8)
bun run test:e2e       # Playwright — LOCAL UNIQUEMENT (base partagée, cf. CLAUDE.md)
bun run lint           # Biome lint (a11y incluse)
bun run typecheck      # tsc --noEmit
bun run migrate        # applique les migrations SQL
```

## Architecture (résumé)

- `src/routes/` — routes fichier (login, équipements, scan, incidents, admin).
- `src/lib/` — logique métier pure + server functions (toujours derrière
  `authMiddleware`/`adminMiddleware`).
- `src/db/` — client Kysely, migrations, `withAuthContext` (claims RLS).
- `e2e/` — scénarios Playwright (données préfixées `e2e-ephemeral-`, sweep auto).

Sécurité : JWT RS256 (access 15 min + refresh rotatif httpOnly), RLS fail-closed sur
les 4 tables, validation Zod des entrées serveur, rate limiting du login. Détail :
`docs/certification/09-securisation.md`. Architecture complète (dont fonctionnement
hors-ligne) : `docs/certification/18-architecture.md`.

## Conventions

- Commits : Conventional Commits, type en anglais, description en français
  (vérifié par commitlint).
- Accessibilité : RGAA — règles Biome `lint/a11y/*` bloquantes, audit dans
  `docs/certification/10-accessibilite.md`.
- Tout bug devient une issue GitHub qualifiée avant correction (traçabilité C2.3.2).
