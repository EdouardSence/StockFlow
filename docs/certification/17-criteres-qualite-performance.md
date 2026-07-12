# 17 — Critères de qualité et de performance

Pièce officielle Bloc 2 « Critères de qualité et de performance ». Numérotée 17 (et non 02)
pour ne pas entrer en collision avec la numérotation locale déjà en place dans ce dossier —
voir la note de décalage numérotation dans `14-plan-correction-bogues.md`.

## KPI cibles (cadrage Bloc 1)

Ces 8 indicateurs ont été fixés au cadrage du projet (Bloc 1), avant tout code. Ils servent de
référence — l'état de mesure réelle (fait / à mesurer) est indiqué pour chacun.

| # | KPI | Cible | État de mesure aujourd'hui |
|---|---|---|---|
| 1 | Time-to-value | < 1 jour (prise en main) | Non mesuré formellement (pas d'étude utilisateur menée) |
| 2 | Réduction de l'inventaire fantôme | -50 % | Non mesurable avant déploiement client réel |
| 3 | Parc scannable | 100 % sous 6 mois | Fonctionnalité QR/scan livrée (`scan.tsx`, génération QR) ; déploiement client non commencé |
| 4 | Temps de chargement | < 2 s en 3G | Non mesuré (pas de test de charge/Lighthouse réalisé à ce jour) |
| 5 | Couverture de tests logique métier | ≥ 80 % sur `src/lib/*.ts` | **Atteint et mesuré** (2026-07-07, `12-couverture-de-code.md`) : domaines Effect 100 %, auth-core 92 %, schémas 100 % comportemental |
| 6 | SUS (System Usability Scale) | 80/100 visé | Non mesuré (nécessite panel d'utilisateurs, pas encore mené) |
| 7 | Vulnérabilités critiques OWASP | 0 | Revue adversariale menée (session 3, voir `09-securisation.md`) — 0 finding critique confirmé non corrigé à ce jour |
| 8 | Coût d'hébergement | ≤ 30 €/mois | Vercel + Supabase, paliers gratuits actuels — coût réel non encore facturé (pas de trafic client) |

## Gates de qualité réellement en place aujourd'hui

Ce ne sont pas les KPI produit ci-dessus, mais les garde-fous automatisés qui bloquent une
régression avant qu'elle n'atteigne `main` (détail complet : `01-deploiement-continu.md`) :

- **CI** (`.github/workflows/ci.yml`) : `lint` (Biome) → `typecheck` (`tsc --noEmit`) →
  tests purs (Vitest, hors intégration DB — issue #26) → `build` (Vite + Nitro),
  séquentiel, un échec bloque le merge.
- **Hooks locaux** (Husky) : `pre-commit` (`lint && typecheck`), `commit-msg` (commitlint,
  format Conventional Commits imposé).
- **Aucun seuil de couverture n'est actuellement appliqué en CI** (`test:coverage` existe en
  script mais n'est pas une étape de la pipeline) — dette à qualifier si le KPI #5 doit devenir
  un gate bloquant plutôt qu'une mesure ponctuelle.

## Ce que ce document n'est pas

Un audit de performance réel (Lighthouse, charge 3G, temps de réponse serveur) n'a pas été
mené — les lignes correspondantes ci-dessus sont marquées « non mesuré », pas remplies avec un
chiffre inventé.
