# 23 — Problème résolu avec le support client (pièce 8, Bloc 4)

> **Document vivant** — statut au 2026-07-15 : **ticket ouvert, en attente de réponse**.
> À mettre à jour dès réception d'une réponse (l'échange complet, puis la résolution).

## Constat initial (qualification)

Le runtime de StockFlow se connecte à Postgres via le **pooler Supabase en mode
transaction** (Supavisor, `aws-0-eu-west-1.pooler.supabase.com:6543`, variable
`APP_POSTGRES_URL`). Toute la sécurité RLS repose sur des claims posés par
`set_config('request.jwt.claims', …, true)` (sémantique `SET LOCAL`) à l'intérieur d'une
transaction explicite (`withAuthContext`, `src/db/client.ts`).

En mode transaction, une même connexion serveur est partagée entre clients d'une
transaction à l'autre. Deux garanties sont donc **critiques** et vérifiées empiriquement
(15 tests d'intégration RLS, `09-securisation.md`) mais **non confirmées officiellement** :

1. un client possède la connexion serveur pendant toute sa transaction explicite —
   aucun autre client ne peut observer les GUC posés en `SET LOCAL` ;
2. Supavisor remet la connexion à zéro entre deux attributions (un `SET` de niveau
   *session* qui fuirait d'un client à l'autre contournerait silencieusement la RLS).

Pour un mécanisme de sécurité, s'appuyer sur un comportement observé plutôt que
documenté est une dette : d'où la demande de confirmation officielle.

## Canal et ticket

- Canal : GitHub Discussions `supabase/supabase`, catégorie **Questions** — le canal de
  support officiel du plan gratuit (le formulaire dashboard route les plans payants).
- Ticket : <https://github.com/orgs/supabase/discussions/47946>, ouvert le 2026-07-15.
- Contenu : contexte (RLS + JWT maison, rôle applicatif dédié, pattern
  `BEGIN; set_config(..., true); …; COMMIT;`, policies fail-closed) et les trois
  questions ci-dessus, plus la question du mode session (port 5432) comme alternative
  recommandée ou non.

## Échange et résolution

*(à compléter à la réponse — copie de l'échange, lecture critique, décision retenue :
confirmation du pattern, ou bascule en mode session, ou mitigation supplémentaire)*
