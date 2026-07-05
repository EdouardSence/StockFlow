# 13 — Cahier de recettes

Pièce officielle Bloc 2 « Cahier de recettes ». Les scénarios de recette seront implémentés
en tests e2e Playwright (`e2e/`, `bun run test:e2e`) lors d'une session dédiée — seule
l'infrastructure d'exécution et un smoke test existent à ce jour.

## Stratégie base de données (à lire avant tout scénario)

**Constat (2026-07-05)** : un seul projet Supabase existe (`npdfobiadwtxbvpyxydr`). Le dev
local, la suite de tests (`bun run test`, tests d'intégration RLS inclus) et le déploiement
Vercel public pointent tous sur la **même base Postgres**. Dette connue et assumée pour
cette session ; la vraie solution — base de test séparée (branche Supabase ou second
projet) — reste la cible à terme, hors périmètre faute de temps/quota.

Mesures de confinement en attendant :

1. **Convention de nommage stricte** : toute donnée créée par la suite e2e porte le préfixe
   `e2e-ephemeral-` (ids, emails, qr_codes — constante `E2E_PREFIX`, `e2e/support/db.ts`).
   Distinctif et improbable à dessein : jamais un simple `test-`, qui pourrait matcher des
   données réelles ou les fixtures RLS (`rls-test-`).
2. **Sweep systématique** (`sweepEphemeralData`) : suppression de toute ligne
   `incidents`/`equipment`/`refresh_tokens`/`users` matchant le préfixe, dans l'ordre des
   FK. Il tourne **avant** la suite (globalSetup — nettoie les restes d'un run précédent
   interrompu) **et après** (globalTeardown — best-effort, jamais bloquant). Pas de cleanup
   par test : un test qui crashe ne doit rien laisser derrière lui au-delà du prochain run.
3. **Jamais en CI** : la suite e2e ne s'exécute qu'en local, à la demande, sous supervision
   (`workers: 1`, `retries: 0` — pas d'écritures concurrentes ni de re-runs silencieux sur
   la base partagée).

## Scénarios de recette

_À rédiger (session dédiée). Prévu : login/logout, CRUD équipement, déclaration d'incident
mobile, cycle de vie incident admin, assignation admin/technicien, garde-fous RBAC._

### Smoke (implémenté)

| # | Scénario | Attendu | Test |
|---|----------|---------|------|
| S1 | Login admin (compte `e2e-ephemeral-admin@stockflow.test` créé par globalSetup) puis logout via la Sidebar | Redirection `/` après login, retour `/login` après logout | `e2e/smoke.spec.ts` |
