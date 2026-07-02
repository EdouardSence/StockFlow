# 01 — Déploiement continu

## Pipeline CI

`.github/workflows/ci.yml`, déclenché sur push vers `main` et sur toute pull request.

Étapes séquentielles :
1. Checkout
2. Setup Bun (`oven-sh/setup-bun@v2`)
3. `bun install --frozen-lockfile`
4. `bun run lint` (Biome)
5. `bun run typecheck` (`tsc --noEmit`)
6. `bun run test` (Vitest)
7. `bun run build` (Vite + Nitro)

Le build échoue et bloque le merge si une seule de ces étapes échoue.

## Hooks locaux (avant même la CI)

Husky (`.husky/`) :
- `pre-commit` : `bun run lint && bun run typecheck` — bloque un commit qui casserait la CI sur
  ces deux points avant même qu'il parte.
- `commit-msg` : `commitlint --edit` — impose le format Conventional Commits
  (`type(scope): sujet`), voir `commitlint.config.js`.

## Déploiement

Vercel, intégration Supabase native. Push sur `main` déclenche un déploiement production ;
chaque pull request obtient un déploiement preview.

## État constaté (2026-07-02)

- Pipeline créé cette session, pas encore passé en conditions réelles (premier push après ce
  commit sera le premier run CI observable).
- Pas encore de badge de statut CI dans le README.
