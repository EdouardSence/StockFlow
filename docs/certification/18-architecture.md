# 18 — Architecture logicielle structurée

Pièce officielle Bloc 2 « Architecture logicielle structurée ». Numérotée 18 pour la même
raison que `17-criteres-qualite-performance.md` (éviter la collision avec la numérotation
locale déjà en place — 04 et 06 sont pris). Ce document consolide sans dupliquer : le détail
outillage vit dans `03-environnement-de-developpement.md`, le détail schéma dans
`06-modele-de-donnees.md`.

## Vue conteneur (C4, niveau 2)

```
┌─────────────────────────┐      ┌──────────────────────────────┐      ┌───────────────────┐
│ Client (navigateur/PWA) │──────▶ Server functions TanStack Start │──────▶ PostgreSQL (Supabase) │
│ React 19 + TanStack      │ SSR/ │ (Vite + Nitro, runtime Bun)     │ Kysely│ RLS + rôle applicatif │
│ Router, Tailwind 4       │ RPC  │ authMiddleware / adminMiddleware│      │ stockflow_app         │
└─────────────────────────┘      └──────────────────────────────┘      └───────────────────┘
```

- **Client** : routes fichier TanStack Router (`src/routes/*`), garde `beforeLoad` (confort
  UX, pas une barrière de sécurité — voir `09-securisation.md`).
- **Server functions** : point d'entrée unique vers les données, toujours derrière
  `authMiddleware`/`adminMiddleware` (`src/lib/auth.ts`).
- **Data-infra** : PostgreSQL Supabase, accès exclusif via Kysely (`src/db/client.ts`), RLS
  actif sur les 4 tables, rôle `stockflow_app` sans `BYPASSRLS` (détail complet :
  `09-securisation.md`).

## Confrontation cadrage vs réel

| Brique du cadrage | État réel aujourd'hui (tag `v0.3.0`) |
|---|---|
| Auth + RBAC | Livré : JWT RS256 + RBAC (`admin`/`technician`), voir `09-securisation.md` |
| RLS défense en profondeur | Livré : 4 tables, `withAuthContext`, fail-closed |
| CRUD équipements + QR | Livré : `equipment/{index,new,$id}.tsx`, génération QR (`qrcode`) |
| Scan mobile | Livré : `scan.tsx` (`html5-qrcode`) |
| Panneau incidents | Livré : `incidents.tsx` (cycle open → in_progress → resolved), server functions `src/lib/incidents.ts`, badges d'incidents ouverts |
| Tableau de bord administrateur | Livré : `index.tsx` (accueil desktop avec vue d'ensemble du parc) |
| Synchronisation hors-ligne / PWA | Livré (2026-07-12) : service worker Workbox, consultation offline, création d'incident hors-ligne avec file de sync — voir section ci-dessous |
| Manuels (déploiement/utilisation/mise à jour) | Rédigés (2026-07-12/13) : `15-manuel-deploiement.md` (avec arbitrage hébergement + annexe portabilité), `16-manuel-mise-a-jour.md`, `21-manuel-utilisation.md` |

## Fonctionnement hors-ligne (PWA)

Livré le 2026-07-12 (issue #9). Deux briques indépendantes :

**Cache (service worker).** `vite-plugin-pwa` en mode `generateSW` (`vite.config.ts`) :
le SW généré ne fait que du cache runtime — `CacheFirst` sur les assets buildés (hashés,
immuables), `NetworkFirst` (timeout 3 s) sur les navigations (`sf-pages`) et sur les
server functions **GET uniquement** (`sf-data`). Les POST (mutations) ne passent jamais
par le cache. Pas de précache : l'app est SSR (pas de `index.html`), et le plugin génère
le SW dans `dist/` avant que Nitro assemble `.output/public` — le script `build` copie
`sw.js` + workbox dans la sortie servie. Résultat : toute page déjà visitée reste
consultable hors-ligne.

**File de synchronisation (code applicatif).** `src/lib/offline-queue.ts` : quand
`createIncidentFn` échoue en erreur réseau, l'incident est mis en file IndexedDB
(API native, aucune dépendance). Un bandeau global (`OfflineSyncBanner`) affiche
« N incident(s) en attente de synchronisation » avec flush automatique au retour du
réseau (event `online`) + bouton manuel. Le flush s'arrête au premier échec : rien
n'est perdu, rien n'est envoyé deux fois. La logique pure (`flushItems`) est testée
en Vitest ; le parcours complet (offline → file → sync → ligne en base) est couvert
par le scénario e2e OF1. Choix assumé : seule la création d'incident (cas terrain du
technicien sans réseau) est disponible hors-ligne — le reste du CRUD est online-only.

**Garde auth dégradée.** Hors-ligne, `getSessionFn` échoue en erreur de transport :
`beforeLoad` (`__root.tsx`) retombe alors sur la dernière identité connue (localStorage,
champs non sensibles : id/name/email/role, purgée au logout) pour servir le shell.
Aucun droit n'en découle : les données affichées viennent du cache SW déjà autorisé,
et toute mutation repasse par le serveur (authMiddleware + RLS inchangés) au flush —
un 401 laisse la file intacte. Rejeté : `workbox-background-sync` (Background Sync API
Chromium-only, file invisible depuis React, intestable unitairement).

## Découpage du code

Feature-based par route (`src/routes/equipment/*`, `src/routes/scan.tsx`, `src/routes/login.tsx`),
logique métier pure isolée dans `src/lib/*.ts` (testée indépendamment du framework — voir
`11-harnais-de-tests.md`), accès données centralisé dans `src/db/*` (un seul point de contact
avec Postgres, cf. règle CLAUDE.md « accès DB exclusivement via Kysely »).
