# 01 — Déploiement continu

## Pipeline CI

`.github/workflows/ci.yml`, déclenché sur push vers `main` et sur toute pull request.

Étapes séquentielles :
1. Checkout
2. Setup Bun (`oven-sh/setup-bun@v2`)
3. `bun install --frozen-lockfile`
4. `bun run lint` (Biome)
5. `bun run typecheck` (`tsc --noEmit`)
6. `bunx vitest run --exclude '**/*.integration.test.ts'` (tests purs — les tests
   d'intégration RLS exigent la base réelle, partagée dev/prod, et restent locaux
   comme la suite e2e ; `APP_POSTGRES_URL` factice pour satisfaire la garde
   fail-closed de `src/db/client.ts`, voir issue #26)
7. `bun run build` (Vite + Nitro + copie du service worker PWA)

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

## État constaté (mis à jour 2026-07-12)

- Pipeline en conditions réelles depuis sa création (2026-07-02) : a tourné sur l'ensemble des
  commits du lot auth/RLS (`05b562b` à `5d3904a`), lint→typecheck→test→build verts sur chacun,
  y compris les 4 commits `fix:` post-revue de sécurité (voir `08-historique-versions.md`).
- **Incident assumé** : CI rouge du 2026-07-03 au 2026-07-12 sans que personne ne le remarque —
  le step Test mourait à l'import (`APP_POSTGRES_URL` absent en CI, chargé par `.env.local` en
  local). Tracé (issue #26), corrigé le 2026-07-12 ; leçon retenue : un badge de statut dans le
  README rend le rouge visible (ajouté le même jour).
