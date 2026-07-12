# 05 — Langages

| Langage | Où | Pourquoi |
|---|---|---|
| **TypeScript** (strict) | Tout le code applicatif : front (React), server functions, scripts (`scripts/migrate.ts`), tests | Un seul langage de bout en bout ; types dérivés du schéma DB (`src/db/types.ts`) plutôt que dupliqués ; les contrats des server functions sont typés côté client sans couche API |
| **SQL** (PostgreSQL) | Migrations `src/db/migrations/*.sql`, policies RLS, fonction `SECURITY DEFINER` `auth_login_lookup` | Le schéma, les contraintes (`CHECK`, FK) et la sécurité ligne-à-ligne vivent dans la base — pas dans une DSL d'ORM (voir `19-frameworks-paradigmes.md`, choix Kysely) |
| **CSS** (Tailwind 4 + custom properties) | `src/styles.css` (tokens `--sf-*`), classes utilitaires | Design tokens centralisés, audités pour le contraste WCAG (`10-accessibilite.md`) |

Décisions structurantes :

- **TypeScript strict activé** (`tsconfig.json`) : pas de `any` implicite ; le typecheck
  (`bun run typecheck`) est un gate de CI au même titre que le lint.
- **Pas de JavaScript non typé** dans `src/` — le seul JS généré est le build.
- **SQL écrit à la main, jamais concaténé** : requêtes exclusivement via Kysely
  (paramétrées), règle CLAUDE.md vérifiée en revue de sécurité (`09-securisation.md`).
