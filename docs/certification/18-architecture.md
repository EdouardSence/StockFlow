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
| Panneau incidents | Table `incidents` existe en base et en type TypeScript ; **aucune route ni server function ne l'utilise** — non construit |
| Tableau de bord administrateur | Non construit — référence design existante (`design-reference/`, supprimée après la session d'alignement visuel), prévu session 6 |
| Synchronisation hors-ligne / PWA | Non câblée — prévu session 7 |
| Manuels (déploiement/utilisation/mise à jour) | Non rédigés (`15-manuel-deploiement.md`, `16-manuel-mise-a-jour.md` sont des stubs) |

## Découpage du code

Feature-based par route (`src/routes/equipment/*`, `src/routes/scan.tsx`, `src/routes/login.tsx`),
logique métier pure isolée dans `src/lib/*.ts` (testée indépendamment du framework — voir
`11-harnais-de-tests.md`), accès données centralisé dans `src/db/*` (un seul point de contact
avec Postgres, cf. règle CLAUDE.md « accès DB exclusivement via Kysely »).
