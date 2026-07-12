# PWA offline (issue #9) — Design

Date : 2026-07-12 · Statut : validé

## Objectif

Tenir la promesse du cadrage Bloc 1 : application installable, consultation hors-ligne
des données déjà visitées, création d'incident hors-ligne avec **file de synchronisation
visible** (cas terrain : technicien qui scanne un équipement sans réseau).

Périmètre retenu (option C) : une seule mutation offline — la création d'incident.
Le reste du CRUD reste online-only, choix assumé documenté dans le rapport.

## Architecture retenue

`vite-plugin-pwa` en mode `generateSW` (Workbox généré). Le service worker ne fait
**que** du cache ; la file de synchronisation vit dans le code applicatif.

Alternative rejetée : SW custom (`injectManifest`) + `workbox-background-sync`.
Background Sync API est Chromium-only, la queue serait invisible depuis React sans
postMessage, et la logique deviendrait intestable en Vitest. Sur-ingénierie pour une
seule mutation.

## Composants

### 1. Manifest
- Supprimer `public/manifest.json` (reliquat TanStack, contenu périmé).
- Garder `public/manifest.webmanifest` (déjà brandé StockFlow).
- Lier dans `head()` de `src/routes/__root.tsx` : `rel="manifest"`, `theme-color`,
  `apple-touch-icon` (icon-192).

### 2. Service worker (vite.config.ts)
- `VitePWA({ registerType: "autoUpdate", ... })`.
- Précache : app shell (assets buildés).
- `runtimeCaching` : `NetworkFirst` sur les server functions **GET** uniquement
  (les lectures : getEquipments, getEquipmentById, listIncidentsFn…). Les POST ne
  passent jamais par le cache.
- `navigateFallback` pour servir le shell sur navigation offline.

### 3. Garde auth offline (src/routes/__root.tsx)
- `beforeLoad` : distinguer échec **réseau** (offline) d'un 401.
  - Erreur réseau → utiliser l'identité en cache (`localStorage`, champs non
    sensibles uniquement : id, name, email, role) et laisser passer le shell.
  - 401/pas de session (online) → redirect /login, comportement inchangé.
- La barrière de sécurité reste côté serveur (authMiddleware + RLS), inchangée.
  L'identité cachée n'ouvre aucun droit : toute donnée affichée offline vient du
  cache de données déjà autorisées, toute mutation re-passe par le serveur au flush.
- Au flush, un 401 conserve la file intacte et renvoie au login.

### 4. File d'incidents offline (src/lib/offline-queue.ts)
- IndexedDB (API native, pas de dépendance).
- API : `enqueue(incident)`, `flush(sendFn)`, `list()`, `count()`.
- Logique pure (sérialisation, itération, gestion d'échec partiel) testable en Vitest.
- Intégration UI :
  - `createIncidentFn` échoue en erreur réseau → `enqueue` + message
    « Incident enregistré hors-ligne, sera synchronisé au retour du réseau ».
  - Bandeau global : « N incident(s) en attente de synchronisation » + bouton
    « Synchroniser » ; flush automatique sur event `online`.
  - Échec partiel au flush : les éléments non envoyés restent en file.

### 5. Tests
- Vitest : logique de la file (enqueue/flush/échec partiel/ordre).
- e2e Playwright (local uniquement, préfixe `e2e-ephemeral-`) :
  `context.setOffline(true)` → consultation équipement déjà visité,
  création incident offline, retour online, vérification de la sync en DB.

### 6. Documentation
- PROGRESS.md : session PWA offline.
- 18-architecture.md : section offline (SW, stratégie de cache, file).
- Fermeture #9 avec commentaire résumant le correctif.

## Hors périmètre
- Mutations offline autres que création d'incident.
- Background Sync API.
- Résolution de conflits (une création d'incident ne conflicte pas : insert pur).
