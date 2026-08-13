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
- **Pas de nouvelle dépendance sans justification** : la PWA offline a été livrée avec
  zéro ajout (IndexedDB natif plutôt qu'une librairie de file).
