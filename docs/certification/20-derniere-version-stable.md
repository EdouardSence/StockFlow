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
  Anomalies AN-1 (#22, bouton scan décoratif → saisie manuelle livrée) et AN-2 (#23,
  crash au démontage de /scan après échec caméra) corrigées en session 10 bis — suite
  e2e à 21/21 (SC3/SC4 ajoutés).
- Tableau de bord desktop (session 10 ter, design « StockFlow v1 ») : KPI, parc récent
  avec actions contextuelles, panneau incidents ouverts — la racine ne redirige plus vers
  /equipment. Suite e2e à 24/24.
- Lot sécurité (2026-07-07, issues #14/#8/#17 fermées) : validation Zod sur toutes les
  server functions equipment, erreurs Postgres masquées au client (garde F11 dans
  `withAuthContext`), en-têtes HTTP de sécurité (CSP/XFO/HSTS/Permissions-Policy) vérifiés
  en production. 74 tests vitest, e2e 24/24.
- Rate limiting du login trois niveaux (2026-07-07, issue #15) + audit OWASP Top 10
  formalisé (#18) — voir `09-securisation.md`.
- Self-service mot de passe `/account` (#13) et gestion des comptes admin `/admin/users`
  (#12, migration 006) — 94 tests vitest, e2e 31/31.
- Accessibilité (2026-07-07, issues #11/#19/#25) : audit RGAA outillé complet
  (`10-accessibilite.md`), sélecteur de type en vrais radios natifs, focus clavier
  visible rétabli (suppression des `outline:none` inline), contraste AA du texte
  « faint » corrigé. Couverture de code clôturée sur le bon périmètre (#16,
  `12-couverture-de-code.md`).
- **PWA offline (2026-07-12, issue #9)** : app installable (manifest lié), service
  worker Workbox (consultation hors-ligne des pages visitées), création d'incident
  hors-ligne avec file IndexedDB et bandeau de synchronisation visible. 99 tests
  vitest + e2e 32/32 (scénario OF1). Voir `18-architecture.md` § Fonctionnement
  hors-ligne.
- Pièces documentaires 04/05/07 rédigées, manuel d'utilisation créé
  (`21-manuel-utilisation.md`), README réel (2026-07-12).
- Pas encore taggé — snapshot `v0.3.0` ci-dessous toujours la dernière version taguée.
  Un tag `v0.4.0` serait justifié à ce stade (auth+RLS → incidents → sécurité → a11y →
  PWA) — à poser lors de la prochaine session de déploiement.

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
