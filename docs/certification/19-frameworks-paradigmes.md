# 19 — Frameworks et paradigmes

Pièce officielle Bloc 2 « Frameworks et paradigmes ». Numérotée 19 pour la même raison que les
deux pièces précédentes (04 et 06 déjà pris localement). Contenu basé sur `CLAUDE.md` et
lecture directe du code (`package.json`, `src/`), pas une reformulation du pitch Bloc 1.

## Stack retenue et justification

| Choix | Alternative écartée | Pourquoi |
|---|---|---|
| **TanStack Start** (React 19, SSR, routes fichier) | Next.js | SSR + server functions typées de bout en bout sans couche API séparée à maintenir |
| **Kysely** (query builder typé) | Prisma / ORM | SQL explicite et typé, pas de couche de génération opaque au-dessus des policies RLS (critique ici : la RLS dépend de la transaction posée par `withAuthContext`, un ORM masquerait ce détail) |
| **Tailwind CSS 4** | CSS modules / styled-components | Utility-first, cohérent avec des tokens CSS custom properties (`src/styles.css`) réutilisés tels quels par le design system |
| **Biome** | ESLint + Prettier | Un seul binaire lint+format, décision déjà actée (voir `03-environnement-de-developpement.md`) |
| **Bun** | Node.js + npm/pnpm | Runtime + gestionnaire de paquets + test runner en un seul outil |

## Paradigme réel du code

- **TypeScript strict** sur l'ensemble du code applicatif, types dérivés du schéma DB
  (`src/db/types.ts`) plutôt que dupliqués manuellement.
- **Feature-based par route**, logique métier pure séparée du JSX de présentation dans
  `src/lib/*.ts` (`auth-core.ts`, `equipment.ts`) — c'est cette séparation qui rend le KPI
  « couverture ≥ 80 % sur la logique métier pure » atteignable sans exiger de couvrir le JSX
  (voir `11-harnais-de-tests.md`).
- **Server functions comme unique frontière** vers les données, chacune portant explicitement
  `authMiddleware`/`adminMiddleware` (pas de logique métier dans les composants React).

## Effect : évalué au cadrage, intégration différée au bon domaine

`package.json` déclare `effect` (`^3.21.2`), mais aucun import dans `src/` à ce jour (`useEffect`
de React n'a aucun rapport). Ce n'est pas une dette de dépendance inutilisée : Effect a été
évalué et retenu au cadrage Bloc 1 pour la logique métier critique. Son intégration a été
délibérément reportée sur le domaine le plus adapté à ses garanties (transitions d'état, règles
métier avec cas d'erreur réels) plutôt qu'utilisée de façon cosmétique sur du code déjà simple
(auth). Intégration prévue en session 6 (pannes & assignation).
