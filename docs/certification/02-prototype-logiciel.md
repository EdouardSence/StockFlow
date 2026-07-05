# 02 — Prototype logiciel

## Alignement design system (session, 2026-07-04)

Le code réel (routes `equipment/*`, `login`, `scan`, composants partagés) a été développé
avant l'export Claude Design de référence. Cette session aligne visuellement les écrans déjà
existants sur ce design system (thème sombre, typographie Geist/Geist Mono, palette
sémantique par statut) — sans créer de nouvel écran ni modifier le comportement fonctionnel.

Design de référence : projet Claude Design `867d348d-aa8b-4228-86b4-8c8dfaf6d027`,
fichier `StockFlow.dc.html`. Périmètre explicitement exclu de cette session : le tableau de
bord administrateur et le panneau incidents (référence pour la session 6 — pannes &
assignation) et la file de synchronisation hors-ligne (référence pour la session 7 — PWA).

### Changements

- **Tokens** (`src/styles.css`) : palette claire (oklch) → palette sombre (hex/rgba fidèles
  à l'export), polices Inter/JetBrains Mono → Geist/Geist Mono. Les noms de variables CSS
  (`--sf-bg`, `--sf-fg`, `--sf-mono`…) sont inchangés — seules les valeurs changent.
- **Statuts équipement** (`src/components/StatusBadge.tsx`) : palette sémantique reprise à
  l'identique de l'export (`available`/`assigned`/`broken`/`maintenance`), `STATUS_META`
  exporté pour être réutilisé (KPI de la liste, tuiles d'action de la fiche détail) plutôt
  que dupliqué.
- **Écrans retouchés** : `login`, `equipment/index` (liste), `equipment/new` (création),
  `equipment/$id` (fiche détail, desktop + mobile), `scan`, `index` (accueil mobile — hors
  liste initiale de la mission mais lié directement à `/scan` et `/equipment/*`, laissé
  incohérent visuellement aurait cassé ce parcours), `Sidebar`, `MobileLayout`.
- **Accessibilité** : le pattern du sélecteur de type d'équipement (`<fieldset>` +
  `<legend>` visuellement masquée + boutons, un `<label htmlFor>` par champ nommé) est
  inchangé — seules les valeurs de style (couleurs, ombres) ont bougé. Vérifié après coup :
  `fieldset`/`legend`/`htmlFor` toujours présents à l'identique dans `equipment/new.tsx`.

### Captures avant / après

| Écran | Avant | Après |
|---|---|---|
| Connexion | `captures/before/login.png` | `captures/after/login.png` |
| Liste équipements | `captures/before/equipment-list.png` | `captures/after/equipment-list.png` |
| Nouvel équipement | `captures/before/equipment-new.png` | `captures/after/equipment-new.png` |
| Fiche équipement (desktop) | `captures/before/equipment-detail-desktop.png` | `captures/after/equipment-detail-desktop.png` |
| Fiche équipement (mobile) | `captures/before/equipment-detail-mobile.png` | `captures/after/equipment-detail-mobile.png` |
| Scanner | `captures/before/scan.png` | `captures/after/scan.png` |

Capturées via Chromium headless (`puppeteer-core`) contre le serveur de dev réel, session
authentifiée, mêmes viewports avant/après.

### Dette / hors périmètre

- La liste des équipements (`equipment/index.tsx`) n'a aucun lien cliquable vers la fiche
  détail (`equipment/$id`) — constaté en préparant les captures (une navigation directe par
  URL a été nécessaire). Pré-existant, non introduit par cette session, non corrigé ici
  (changement de comportement, hors périmètre visuel strict).
- `FakeQR.tsx` n'est référencé nulle part dans les routes (code mort) — laissé tel quel
  (fond blanc/points sombres), non retouché.
