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

## Remesure du 2026-07-06 (après la session e2e — correction d'une prédiction)

Remesure post-session cahier de recettes : **chiffres strictement identiques** à la mesure
du 2026-07-05 (51,1 / 65,1 / 31,7 / 51,8 %).

La version précédente de ce document prédisait que la suite e2e ferait « mécaniquement
remonter » Functions et Statements. C'était faux sur le chiffre, et il faut le dire
précisément : les 19 scénarios Playwright traversent bien les coquilles de bout en bout
(navigateur → route → server function → middleware → Kysely → Postgres RLS, avec
assertions sur les lignes réellement écrites — voir `13-cahier-de-recettes.md`), mais ils
s'exécutent dans le **process du serveur dev**, séparé du process vitest que le provider
v8 instrumente. La couverture *mesurée* ne voit donc que les tests unitaires et
d'intégration vitest.

Lecture correcte pour le jury : les coquilles sont désormais **exercées et vérifiées**
(e2e + tests RLS sur base réelle), mais ces vérifications sont **invisibles dans le
pourcentage v8**, qui reste l'affaire de la logique pure (100 % domaine, 90,5 %
auth-core — le critère ≥ 80 % sur la logique métier reste atteint). Fusionner les deux
mesures (instrumenter le serveur dev via `NODE_V8_COVERAGE`/c8 et merger les rapports)
est possible mais hors périmètre — le gain serait cosmétique, pas probant.

**Document vivant** : relancer `bun run test:coverage` et dater toute nouvelle mesure
après chaque session ajoutant des tests vitest.

## Remesure du 2026-07-07 (après le lot sécurité #14/#8/#17)

Statements 49,2 % (92/187) · Branches 62,1 % (54/87) · Functions 30,2 % (19/63) ·
Lines 50,6 %. Variation attendue : les validateurs maison testés à 100 % ont été
remplacés par des schémas Zod (déclaratifs — moins de branches à couvrir, testés par
12 tests dédiés) et `withAuthContext` a gagné la garde d'erreurs pg (F11). La lecture
domaine pur = 100 % / coquilles basses reste inchangée.
