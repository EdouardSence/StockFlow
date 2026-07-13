# 16 — Manuel de mise à jour

## Mise à jour applicative (code)

1. Branche ou commit sur `main` (projet mono-développeur : trunk-based assumé).
2. Garde-fous automatiques, dans l'ordre :
   - hooks Husky locaux : `pre-commit` (lint + typecheck), `commit-msg` (commitlint) ;
   - CI GitHub Actions : lint → typecheck → tests purs → build (badge dans le README —
     leçon de l'issue #26 : un rouge doit se voir) ;
   - suites locales avant tout changement à risque : `bun run test` (99 tests, intégration
     RLS incluse) et `bun run test:e2e` (36 scénarios, base réelle — local uniquement).
3. Push sur `main` → déploiement production Vercel automatique. Une PR donne un
   déploiement preview pour valider avant merge.
4. Jalon significatif → tag annoté `vX.Y.Z` (historique : `08-historique-versions.md`).

**Retour arrière** : Vercel → Deployments → « Promote to Production » sur le déploiement
précédent (instantané). Voir `15-manuel-deploiement.md`.

## Mise à jour du schéma de base de données

Règles (CLAUDE.md, appliquées depuis la migration 001) :

- Toute évolution = **nouveau fichier** `src/db/migrations/NNN_description.sql`, appliqué
  par ordre alphabétique via `bun run migrate` (`POSTGRES_URL`, rôle propriétaire).
- **Jamais éditer un fichier déjà appliqué en prod** — une erreur se corrige en avant
  (fichier suivant).
- Le script rejoue **tous** les fichiers à chaque exécution (pas de table de suivi) :
  chaque migration doit être **idempotente** (`IF NOT EXISTS`, `CREATE OR REPLACE`,
  `DROP ... IF EXISTS` avant recréation de policy).
- Contrainte de synchronisation : `equipment.type` est contraint par un `CHECK` en base
  **et** par un type TypeScript — les deux doivent évoluer dans le même commit.

Ordre d'une mise à jour avec migration : migration appliquée d'abord (compatible avec le
code encore déployé), puis déploiement du code qui l'exploite.

## Mise à jour des dépendances

- `bun.lock` committé = versions verrouillées ; montée de version = commit dédié qui
  passe CI + suites locales (e2e si le runtime est touché).
- `bun audit` à chaque montée : les 16 vulnérabilités transitives **dev-only** connues
  sont tracées (issue #24, différées par choix — aucune n'affecte le runtime de prod).
- Après toute montée touchant Vite/Nitro/vite-plugin-pwa : vérifier que le build produit
  toujours `sw.js` copié dans la sortie statique — `.vercel/output/static/` sur Vercel,
  `.output/public/` en local (piège documenté dans CLAUDE.md et `18-architecture.md` ;
  l'issue #34 a montré qu'une cible codée en dur casse silencieusement les déploiements :
  vérifier le statut Vercel après push, la CI GitHub ne le voit pas).

## Spécificités PWA (service worker)

- `registerType: "autoUpdate"` : après un déploiement, les clients récupèrent le nouveau
  service worker à la navigation suivante — pas d'action utilisateur, pas de purge
  manuelle. Les caches runtime (`sf-pages`, `sf-data`, `sf-assets`) sont gérés par
  Workbox.
- Les incidents en file offline (IndexedDB, côté client) survivent aux mises à jour :
  la file est rejouée vers `createIncidentFn` au retour du réseau, quelle que soit la
  version déployée entre-temps.

## Rotation des clés JWT

Regénérer la paire RS256 (procédure openssl dans `.env.example`), remplacer
`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` en Production, redéployer. Effet immédiat : tous les
access et refresh tokens existants deviennent invalides → reconnexion globale de tous
les utilisateurs (c'est le comportement voulu en cas de compromission).

## Points d'attention connus

- **Supabase plan gratuit** : le projet se met en pause après inactivité — la première
  requête post-pause peut timeouter le temps du réveil (~2-3 min constaté).
- **Base partagée dev/prod** (dette documentée, `13-cahier-de-recettes.md`) : la suite
  e2e ne tourne jamais en CI ; en local, elle est confinée par le préfixe
  `e2e-ephemeral-` et le sweep systématique.
