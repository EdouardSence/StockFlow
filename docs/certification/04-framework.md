# 04 — Framework

Framework applicatif : **TanStack Start** (React 19, SSR, routes fichier via TanStack
Router), build **Vite 8 + Nitro**, runtime **Bun**.

Ce document est volontairement court : la justification complète du choix (alternatives
écartées, tableau comparatif TanStack Start vs Next.js, Kysely vs ORM, Biome vs
ESLint+Prettier) et les paradigmes réellement appliqués dans le code vivent dans
**`19-frameworks-paradigmes.md`** — pas de duplication, une seule source de vérité.

Points spécifiques au framework qui structurent le projet :

- **Server functions** (`createServerFn`) comme unique frontière client → données,
  chacune derrière `authMiddleware`/`adminMiddleware` (`src/lib/auth.ts`).
- **Routes fichier** (`src/routes/*`) avec garde `beforeLoad` (confort UX ; la barrière
  de sécurité reste côté serveur — `09-securisation.md`).
- **SSR + PWA** : rendu serveur des pages, service worker Workbox en cache runtime
  (`18-architecture.md` § Fonctionnement hors-ligne).
