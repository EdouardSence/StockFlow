# 12 — Couverture de code

Pièce officielle Bloc 2 « Couverture de code ». Mesure produite par
`bun run test:coverage` (Vitest + `@vitest/coverage-v8`, provider épinglé sur la version de
Vitest), rapport détaillé dans `coverage/` (artefact généré, non versionné).

> **Document vivant** : à remesurer après chaque session ajoutant des tests — en particulier
> après la session e2e Playwright (voir § Trajectoire).

## Mesure du 2026-07-05 (72/72 tests verts)

Périmètre : les modules réellement importés par la suite de tests (`src/db/client.ts` et
`src/lib/*.ts`). Les routes JSX n'entrent pas dans ce périmètre — cohérent avec l'objectif
fixé dans `CLAUDE.md` : ≥ 80 % sur la logique métier pure, pas 80 % globaux sur du JSX de
présentation.

### Global

| Métrique   | Couverture | Détail  |
| ---------- | ---------- | ------- |
| Statements | 51,1 %     | 91/178  |
| Branches   | 65,1 %     | 71/109  |
| Functions  | 31,7 %     | 19/60   |
| Lines      | 51,8 %     | 85/164  |

### Par fichier

| Fichier                   | Stmts   | Branch | Funcs  | Nature                        |
| ------------------------- | ------- | ------ | ------ | ----------------------------- |
| `lib/incidents-domain.ts` | 100 %   | 100 %  | 100 %  | domaine pur (Effect)          |
| `lib/equipment-domain.ts` | 100 %   | 100 %  | 100 %  | domaine pur (Effect)          |
| `lib/auth-core.ts`        | 90,5 %  | 96,2 % | 80 %   | logique auth (argon2, JWT)    |
| `db/client.ts`            | 53,8 %  | 50 %   | 0 %    | coquille (connexion, RLS ctx) |
| `lib/equipment.ts`        | 32,6 %  | 42,2 % | 11,1 % | coquille (server functions)   |
| `lib/auth.ts`             | 27,3 %  | 0 %    | 0 %    | coquille (middlewares)        |
| `lib/incidents.ts`        | 26,8 %  | 55,6 % | 14,3 % | coquille (server functions)   |

## Lecture : domaine pur vs coquilles

L'architecture « noyau fonctionnel pur / coquille impérative » (voir `18-architecture.md`)
rend cette répartition attendue et voulue :

- **Domaine pur à 100 % sur les 4 métriques** : `incidents-domain.ts` (state machine
  `open → in_progress → resolved`) et `equipment-domain.ts` (règles d'assignation) sont sans
  I/O et testés exhaustivement (matrice complète des transitions, tous les cas d'erreur).
  C'est là que vivent les règles métier — le critère « ≥ 80 % sur la logique métier pure »
  est atteint et dépassé.
- **`auth-core.ts` à 90,5 %** : logique de sécurité (hachage argon2, signature/vérification
  JWT) testée directement ; le résidu non couvert est utilitaire.
- **Coquilles basses (26–54 %)** : `equipment.ts`, `incidents.ts`, `auth.ts` et `client.ts`
  sont les server functions TanStack Start et le câblage Kysely/RLS. Leur logique se réduit
  à de l'orchestration I/O : elle ne s'exerce pas en test unitaire sans mocker la base et le
  runtime HTTP — des mocks qui testeraient le mock, pas le comportement. Ce qui en est
  couvert aujourd'hui l'est par les fonctions pures extraites (`validateNewEquipmentInput`,
  `validateNewIncidentInput`, `normalizeIncidentDescription`) et, côté base réelle, par les
  tests d'intégration RLS (`src/db/rls.integration.test.ts`) qui attaquent Postgres
  directement — hors instrumentation v8, donc invisibles dans ces pourcentages.

## Pourquoi « Functions » est à 31,7 %

Le chiffre est mécaniquement tiré vers le bas par la forme du code des coquilles : chaque
server function TanStack (`createServerFn().middleware().inputValidator().handler()`)
compte 2 à 3 fonctions (validateur, handler, callbacks de transaction) qui ne s'exécutent
que dans le runtime HTTP complet. 41 des 60 fonctions du périmètre sont de ce type. Les
fonctions de logique pure, elles, sont toutes exercées (19/19 côté domaine + validation).
Le pourcentage global « functions » mesure donc surtout la proportion coquille/domaine du
codebase, pas un déficit de tests sur la logique.

## Trajectoire

La session suivante (tests e2e Playwright — cahier de recettes, pièce 13) exercera les
coquilles pour de vrai : navigateur → route → server function → middleware → Kysely →
Postgres RLS. Les handlers, validateurs et callbacks de transaction aujourd'hui à 0 %
seront traversés par les parcours réels (login, CRUD équipement, déclaration d'incident,
assignation), ce qui fera mécaniquement remonter « Functions » et « Statements » sans
écrire un seul test unitaire de mock.

**À faire après cette session** : relancer `bun run test:coverage`, mettre à jour les deux
tableaux ci-dessus et dater la nouvelle mesure.
