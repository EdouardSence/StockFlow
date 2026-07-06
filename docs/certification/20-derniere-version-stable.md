# 20 — Dernière version fonctionnelle, fiable et viable

Pièce officielle Bloc 2 « Dernière version fonctionnelle/fiable/viable ». Numérotée 20 pour
éviter la collision avec `12-couverture-de-code.md` déjà en place localement.

> **Document vivant** : à mettre à jour à chaque nouveau tag git, pas figé sur `v0.3.0`.

## Depuis `v0.3.0` (non tagué) — session 6, pannes & assignation (2026-07-05)

- Cycle de vie incident (`open → in_progress → resolved`, linéaire strict) : noyau pur
  `src/lib/incidents-domain.ts` (Effect) + coquille `src/lib/incidents.ts` (server functions).
- Écran incidents admin (`/incidents`, `adminMiddleware`) : liste des incidents ouverts,
  bouton d'avancement, section « résolus récemment » repliée.
- Assignation équipement (`src/lib/equipment-domain.ts` + `assignEquipmentFn` sur
  `equipment/$id.tsx`) : admin choisit n'importe quel utilisateur (RLS `users_select` le
  permet) ; technicien limité à s'auto-assigner/se désassigner (RLS ne lui expose pas la
  liste de ses collègues — voir `19-frameworks-paradigmes.md`).
- 22 tests de domaine supplémentaires (63 au total, voir `11-harnais-de-tests.md`).
- Boucle de déclaration de panne complète (session 6 bis, même journée) : la tuile mobile
  « Signaler panne » crée une vraie ligne `incidents` via `createIncidentFn` (sans toucher
  `equipment.status` — qualification manuelle par l'admin depuis `/incidents`), badge
  discret « incidents ouverts/en cours » sur la liste équipements et la fiche, validation
  d'entrée serveur, 72 tests au total (dont 2 tests RLS prouvant qu'un technicien peut
  déclarer un incident sur équipement assigné comme non assigné).
- Cahier de recettes exécutable (session 10, 2026-07-06) : suite e2e Playwright de
  19 scénarios (auth, RBAC, CRUD + QR, scan, incidents, assignation), 19/19 verts contre
  la base réelle, document `13-cahier-de-recettes.md` rédigé depuis ces résultats.
  Anomalie AN-1 (bouton scan décoratif) tracée en issue #22, non corrigée à ce stade.
- Pas encore taggé — snapshot `v0.3.0` ci-dessous toujours la dernière version taguée.

## Snapshot au tag `v0.3.0` (2026-07-04 — « Authentification JWT + RBAC + RLS »)

### Opérationnel

- Authentification JWT RS256 (access 15 min + refresh rotatif httpOnly), RBAC
  `admin`/`technician` (`09-securisation.md`).
- Row Level Security active sur les 4 tables, rôle applicatif dédié `stockflow_app`.
- CRUD équipements (`equipment/index`, `equipment/new`, `equipment/$id`), statuts
  `available|assigned|broken|maintenance`.
- Génération de QR code par équipement, scan mobile (`scan.tsx`, `html5-qrcode`).
- Alignement visuel dark-theme (Geist/Geist Mono) sur les écrans ci-dessus (`02-prototype-logiciel.md`).
- CI (lint → typecheck → test → build) verte, 41/41 tests passants (voir
  `11-harnais-de-tests.md`).

### En attente (référence design existante, non construit)

- Panneau incidents (table `incidents` existe en base, aucune route ne l'utilise) — session 6.
- Tableau de bord administrateur — session 6.
- Synchronisation hors-ligne / PWA — session 7.
- Manuels de déploiement, d'utilisation, de mise à jour — stubs vides à ce jour.

### Dettes connues au moment de ce tag

Voir `09-securisation.md` § Dettes connues et `14-plan-correction-bogues.md` (Kanban) pour le
détail qualifié — non répété ici pour éviter la duplication qui rendrait ce snapshot périmé
plus vite que nécessaire.

## Précédent tag : `v0.2.0` (2026-07-03 — « Retrofit session 0 bis »)

Baseline avant le lot auth/RLS : CRUD équipements, scan, génération QR, sans authentification
ni RLS (RLS désactivé, exposition anon/authenticated complète — voir historique dans
`08-historique-versions.md`).
