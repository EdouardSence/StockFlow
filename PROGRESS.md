# PROGRESS — StockFlow

Journal de bord. Rempli rétroactivement à la session 0 bis (2026-07-02) selon l'état réel constaté
par audit + vérifications directes (build/test/DB), pas par supposition. Chaque case cochée a été
vérifiée par un moyen concret listé dans les remarques.

## Lot Init / Outillage (session 0 bis)

- [x] Biome (lint + format) déjà en place au démarrage du projet
- [x] Script `typecheck` ajouté (`tsc --noEmit`)
- [x] Husky installé, hooks `pre-commit` (lint + typecheck) et `commit-msg` (commitlint)
- [x] commitlint configuré (conventional commits, type en anglais, sujet libre)
- [x] CI GitHub Actions (`.github/workflows/ci.yml`) : lint → typecheck → test → build, sur Bun
- [x] `.env.example` vérifié contre les vraies variables lues par le code (`POSTGRES_URL`,
      fallback `DATABASE_URL`)
- [ ] ESLint / Prettier — **décision : ne pas ajouter**, redondant avec Biome qui couvre déjà
      lint + format sur ce projet. Les ajouter créerait des règles concurrentes.

### Remarques
- `bun run lint && bun run typecheck && bun run test && bun run build` : tous verts en fin de
  session (vérifié par exécution directe).

## Lot Schéma & migrations

- [x] `equipment.type` réduit à `pc | screen | printer | other` (migration
      `002_equipment_type_reduce_enum.sql`)
- [x] Contrainte CHECK `equipment_type_check` appliquée en base de production (Supabase, projet
      `npdfobiadwtxbvpyxydr`) et vérifiée par `pg_get_constraintdef`
- [x] Remap des valeurs existantes (`laptop`→`pc`, `phone`→`other`) — aucune ligne affectée, les
      3 tables étaient vides (0 lignes) au moment de la migration
- [x] Contrainte testée activement : un INSERT avec `type='laptop'` est rejeté (erreur 23514
      confirmée), un INSERT avec `type='pc'` passe et prend `status='available'` par défaut
- [x] `scripts/migrate.ts` généralisé pour appliquer tous les fichiers `src/db/migrations/*.sql`
      par ordre alphabétique (au lieu de ne lancer que `001_init.sql` en dur)

### Remarques
- Le projet Supabase était en pause (`INACTIVE`) au début de la session, réveillé via l'outil
  MCP Supabase avant application de la migration.
- **RLS (Row Level Security) désactivé** sur les 3 tables (`users`, `equipment`, `incidents`) —
  signalé par l'advisory Supabase. Non corrigé cette session : activer RLS sans policies
  bloquerait tout accès applicatif, et il n'y a pas encore d'auth pour définir des policies
  pertinentes. À traiter avec le Lot Auth.

## Lot Auth

- [ ] Non commencé. Aucun code d'authentification (JWT, session, login) dans le repo à ce jour.

## Lot CRUD équipements

- [x] Routes présentes et code compile : `/equipment` (liste), `/equipment/new` (création),
      `/equipment/$id` (détail + changement de statut), versions desktop et mobile (détection
      responsive < 768px)
- [x] Couche DB vérifiée directement : INSERT/SELECT/DELETE fonctionnent contre la vraie base
      Supabase (testé via SQL direct)
- [ ] **Non vérifié de bout en bout via l'app** : `bun run dev` + `curl localhost:3000/equipment`
      renvoie une **erreur 500**. Cause : `POSTGRES_URL` est vide dans `.env.local` (seules les
      variables de prod sont renseignées côté Vercel, cf. Lot Déploiement). Impossible de tester
      le rendu SSR de la liste équipements en local sans ces credentials.
- [ ] Formulaire de création (`/equipment/new`) non testé manuellement bout en bout cette session

### Remarques
- `/scan` répond bien en 200 en local (ne dépend pas de la DB au chargement initial).
- Prochaine session : obtenir un `POSTGRES_URL` de dev (ou pointer vers une DB Supabase locale)
  pour permettre les tests SSR en local.

## Lot Génération QR

- [x] Génération réelle via la lib `qrcode`, composant `QRCodeImage` dans `/equipment/new`,
      encode l'URL absolue `/equipment/:id` — code présent et compile
- [ ] Non revérifié visuellement cette session (dernière vérification connue : session du
      2026-05-08, cf. historique de commits)

## Lot Scan mobile

- [x] Route `/scan` répond 200 en local
- [x] Parsing d'URL QR (regex UUID) et navigation vers `/equipment/$id` : code présent, inchangé
      depuis la dernière vérification fonctionnelle (session du 2026-05-08)
- [ ] Test caméra réel non repassé cette session (nécessite un device physique / permissions
      navigateur, non testable en environnement CLI)

## Lot Pannes & assignation

- [ ] **Absent.** La table `incidents` existe en base et dans `src/db/types.ts`, mais aucune
      route, Server Function ou UI ne l'utilise. `assigned_to` sur `equipment` est un champ texte
      brut affiché tel quel (pas de sélecteur d'utilisateur, pas de vraie logique d'assignation).
      La tuile "Signaler une panne" sur l'accueil mobile est un bouton sans `onClick` — décoratif.
      À construire entièrement.

## Lot PWA offline

- [ ] **Absent.** `vite-plugin-pwa` est dans `devDependencies` mais jamais importé dans
      `vite.config.ts` — pas de service worker généré, pas de cache offline.
- [x] Manifest corrigé cette session : `manifest.webmanifest` référençait `/icon-192.png` et
      `/icon-512.png`, absents du repo. Fichiers dupliqués depuis `logo192.png`/`logo512.png`.
- [ ] Le manifest n'est **toujours pas lié** dans le `<head>` (`src/routes/__root.tsx` n'a pas de
      `<link rel="manifest">`) — l'app n'est pas installable en l'état, indépendamment du fix
      d'icônes. Hors périmètre de cette session (décision explicite : corriger seulement la
      référence cassée, pas câbler le PWA complet).

## Lot Harnais de tests

- [ ] 10 tests unitaires existants (`src/lib/equipment.test.ts`), tous passants, couvrant
      uniquement `validateNewEquipmentInput` et `applyEquipmentDefaults` (logique pure).
      **Insuffisant** pour le critère de couverture ≥ 80 % de la logique métier visé par la
      certification — aucun test sur les Server Functions (`getEquipments`, `createEquipmentFn`,
      `updateEquipmentStatus`), aucun test d'intégration route.

## Lot Sécurité OWASP + Accessibilité RGAA

- [ ] Sécurité : dépend du Lot Auth (non commencé). Autre gap identifié : aucune Server Function
      n'utilise Zod pour valider ses entrées (`inputValidator` fait un simple cast TypeScript,
      aucune validation runtime) — à corriger avant mise en production publique.
- [x] Accessibilité : lint `lint/a11y/*` de Biome au vert sur tout le repo (17 fichiers), corrigé
      cette session (issue GitHub #3 fermée avec le détail des correctifs). Ce n'est qu'un socle
      mécanique (titres SVG, aria-hidden, labels, fieldset/legend) — pas un audit RGAA complet
      (pas de test lecteur d'écran, pas de vérification de contraste, pas de test clavier complet).

## Lot Cahier de recette + bugs

- [ ] Non commencé. Un seul bug traité formellement via issue GitHub cette session (#3, dette
      lint), fermé avec résumé des correctifs — sert de modèle pour la suite.

## Lot Déploiement + manuels

### Remarques (état réel constaté)
- Migration SQLite → Supabase PostgreSQL déjà effectuée (commits du 2026-05-08).
- Déploiement Vercel actif, projet lié (`stock-flow`), variables d'environnement de production
  déjà configurées côté Vercel (Supabase intégration native).
- **Gap local** : `.env.local` a `POSTGRES_URL=""` — aucune variable de dev fonctionnelle. Le dev
  local ne peut pas se connecter à la DB (confirmé par l'erreur 500 sur `/equipment` en local
  cette session). Nécessite soit un `vercel env pull`, soit une DB Supabase de dev dédiée.
- Projet Supabase se met en pause automatiquement (plan gratuit, `INACTIVE` après inactivité) —
  à anticiper : la première requête après une pause peut timeout le temps du réveil (~2-3 min
  constaté cette session).
- Pas de manuel de déploiement ni de manuel de mise à jour rédigés à ce jour (pièces 01 et 16 du
  dossier de certification, ébauchées dans `docs/certification/`).

## Lot Rapport

- [ ] Non commencé — pour bien plus tard.

---

## Reprise prochaine session

- Résoudre l'accès DB en local (`vercel env pull` ou DB de dev) pour pouvoir enfin tester le CRUD
  équipements de bout en bout via l'app, pas seulement en SQL direct.
- Démarrer le Lot Auth : c'est un prérequis bloquant pour RLS, sécurité OWASP, et assignation.
- Construire le Lot Pannes & assignation (table `incidents` existe déjà, rien dessus pour l'instant).
