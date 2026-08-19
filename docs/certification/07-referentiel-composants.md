# 07 — Référentiel de composants

Deux référentiels distincts : les composants d'interface internes, et les composants
tiers (dépendances) avec leur politique de suivi.

## Composants d'interface internes (`src/components/`)

| Composant | Rôle |
|---|---|
| `Sidebar.tsx` | Navigation desktop, carte utilisateur, déconnexion, badge incidents ouverts |
| `MobileLayout.tsx` | Logo, icônes de type d'équipement, barre de navigation basse mobile |
| `StatusBadge.tsx` | Badges de statut équipement + badge « incidents ouverts » |
| `FakeQR.tsx` | Rendu QR de démonstration |
| `OfflineSyncBanner.tsx` | Bandeau global « N incident(s) en attente de synchronisation » (PWA) |

Règle : les composants réutilisés entre routes vivent ici ; les vues propres à une seule
route (ex. `MobileEquipmentDetail`) restent colocalisées dans le fichier de route.

## Composants tiers — dépendances de production

Source de vérité : `package.json` (contraintes) + `bun.lock` (versions résolues).

| Dépendance | Rôle |
|---|---|
| `@tanstack/react-start`, `@tanstack/react-router` | Framework SSR + routage fichier (voir `04-framework.md`) |
| `react`, `react-dom` (19) | Rendu UI |
| `kysely` + `pg` | Accès PostgreSQL typé (jamais de SQL concaténé) |
| `zod` | Validation des entrées serveur (`inputValidator`) |
| `jose` | JWT RS256 (signature/vérification) |
| `@node-rs/argon2` | Hachage des mots de passe (argon2id) |
| `effect` | Noyau fonctionnel du domaine (transitions incident, assignation) |
| `qrcode` / `html5-qrcode` | Génération / scan des QR codes |
| `vite-plugin-pwa` (dev) | Génération du service worker Workbox (voir `18-architecture.md`) |
| `@sentry/react` | Remontée d'erreurs prod (import dynamique client, PII désactivée) |
| `tailwindcss` 4 | Styles utilitaires + tokens |
| `lucide-react`, `uuid` | Icônes, identifiants |

## Politique de suivi

- **Versions verrouillées** par `bun.lock` (commité) ; montées de version = commit dédié.
- **Vulnérabilités** : `bun audit` — vulnérabilités transitives **dev-only** connues et
  tracées (issue #24, différée par choix : aucune n'affecte le runtime de production —
  16 au premier inventaire du 2026-07-07, 40 au ré-audit du 2026-08-13, chemins
  re-vérifiés à chaque mesure).

  Sortie brute de la dernière mesure (extrait, `bun audit` du 2026-08-19, identique au
  ré-audit du 2026-08-13 — paquets touchés et ligne de synthèse) :

  ```
  js-yaml  >=4.0.0 <=4.1.1
  brace-expansion  >=5.0.0 <5.0.6
  nanoid  <3.3.16
  postcss  <=8.5.22
  undici  >=7.0.0 <7.29.0
  @babel/core  <=7.29.0
  shell-quote  >=1.1.0 <=1.8.3
  fast-uri  >=3.0.0 <3.1.3
  vite  >=8.0.0 <=8.0.15
  ws  >=8.0.0 <8.20.1
  launch-editor  <=2.14.0

  40 vulnerabilities (1 critical, 24 high, 12 moderate, 3 low)
  ```

  Aucun de ces paquets n'est une dépendance de production directe ou transitive du
  runtime (chaînes détaillées dans le commentaire de re-mesure de l'issue #24).
- **Pas de nouvelle dépendance sans justification** : la PWA offline a été livrée avec
  zéro ajout (IndexedDB natif plutôt qu'une librairie de file).
