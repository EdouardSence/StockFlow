# 11 — Harnais de tests

> **Document vivant** : mis à jour à chaque session ajoutant des tests. Décrit l'état présent
> (90 tests vitest + 31 scénarios e2e Playwright, 2026-07-07), pas une couverture finale.

## Tests existants

| Fichier | Framework | Cible | # tests |
|---|---|---|---|
| `src/lib/auth-core.test.ts` | Vitest | Logique auth pure : JWT RS256 (signature/vérification/expiration/algorithme verrouillé), argon2id, refresh tokens (unicité, hash), RBAC (`assertRole`), rate limiting | 18 |
| `src/db/rls.integration.test.ts` | Vitest, base réelle | RLS Postgres via connexion applicative brute (sans la couche `withAuthContext`, simulation d'un contournement) : sans claims / claims `technician` / claims `admin` / flux login `SECURITY DEFINER` | 13 |
| `src/lib/equipment.test.ts` | Vitest | Schémas d'entrée Zod des server functions equipment : validation (nom, type, statut, longueurs), défauts et normalisation à null | 12 |
| `src/lib/incidents.test.ts` | Vitest | Validation des entrées incident : `validateNewIncidentInput`, `normalizeIncidentDescription` | 9 |
| `src/lib/incidents-domain.test.ts` | Vitest | Noyau fonctionnel pur (Effect) du cycle de vie incident : les 9 combinaisons `from × to` de `transitionIncident` (2 valides, 7 rejetées), `nextIncidentStatus` | 12 |
| `src/lib/equipment-domain.test.ts` | Vitest | Noyau fonctionnel pur (Effect) de `assignEquipment` : introuvable, assignation depuis `available`/`assigned` (succès) et `broken`/`maintenance` (échec typé), désassignation depuis les 4 statuts (`broken`/`maintenance` préservés, pas écrasés) | 10 |
| `src/lib/auth.test.ts` | Vitest | Schéma Zod `changePasswordSchema` (self-service, issue #13) : payload valide, nouveau mot de passe trop court, champ courant vide, champ manquant | 4 |
| `src/lib/users.test.ts` | Vitest | Schémas Zod `newUserSchema`/`userIdSchema` (admin, issue #12) : payload valide, mot de passe trop court, rôle invalide, nom vide, email invalide, id valide/vide | 7 |

**Total : 90 tests vitest**, tous verts (`bun run test`), plus **31 scénarios e2e
Playwright** (`bun run test:e2e`, local uniquement — voir `13-cahier-de-recettes.md`,
dont AC1-AC3 pour le changement de mot de passe self-service et AU1-AU4 pour la gestion
des comptes via UI admin).

### Première utilisation d'Effect dans le codebase (session 6)

`incidents-domain.ts` et `equipment-domain.ts` sont le premier noyau fonctionnel écrit avec
Effect (voir `19-frameworks-paradigmes.md`) : fonctions pures, types d'erreur discriminés
(`Data.TaggedError`), testées avec `Effect.runSync(Effect.either(...))` sans mock ni I/O. Les
tests couvrent exhaustivement la matrice de transitions (toutes les paires `from × to`), pas
seulement les cas heureux — exactement le type de couverture visé par C2.2.2 sur la logique
métier critique.

## Ce qui est délibérément hors périmètre de tests unitaires

Le JSX de présentation (routes, composants) n'a pas de suite de tests unitaires dédiée — choix
assumé (voir `CLAUDE.md` § Tests) : l'objectif de couverture (≥ 80 %) porte sur la logique
métier pure de `src/lib/*.ts`, pas sur la présentation. Aucun test d'intégration end-to-end
(Playwright, etc.) n'existe à ce jour — dette à qualifier si le KPI « couverture » de
`17-criteres-qualite-performance.md` doit être vérifié sur des parcours complets plutôt que sur
la seule logique unitaire.

## Mesure de couverture

`bun run test:coverage` existe comme script mais n'est pas encore une étape de la CI (voir
`01-deploiement-continu.md`) — le pourcentage réel `src/lib/*.ts` n'a pas été mesuré et consigné
formellement à la date de rédaction de ce document.
