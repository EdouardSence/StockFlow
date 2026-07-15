# 23 — Problème résolu avec le support client (pièce 8, Bloc 4)

> Statut au 2026-07-15 : **résolu** — réponse reçue le 2026-07-15 (moins de 12 h après
> ouverture), pattern confirmé, aucune modification nécessaire.

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

Réponse reçue le **2026-07-15 à 11:23 UTC** (utilisateur `DGO0`), soit moins de 12 h
après l'ouverture. Synthèse point par point :

1. **Possession de la connexion pendant la transaction : confirmée.** En mode
   transaction, la *transaction* est l'unité de multiplexage : la connexion serveur est
   attribuée à un client au `BEGIN` et n'est réattribuée qu'après `COMMIT`/`ROLLBACK`.
   Entrelacer les requêtes de deux clients dans une transaction ouverte casserait la
   sémantique transactionnelle elle-même.

2. **Point clé de la réponse : la garantie ne dépend même pas du pooler.** `set_config(…,
   true)` / `SET LOCAL` est borné à la transaction **par le serveur Postgres lui-même** —
   la valeur est automatiquement annulée au commit ou rollback (documentation officielle
   `SET` : *« Specifies that the command takes effect for only the current
   transaction »*). Au moment où le pooler pourrait redonner la connexion à un autre
   client, le GUC a déjà disparu, qu'un reset type `DISCARD ALL` s'exécute ou non. La
   crainte initiale (garantie n° 2) était donc mal posée : le danger documenté du mode
   transaction concerne le `SET` de niveau *session* — d'où la règle « état
   transaction-scoped uniquement sur le port 6543 », que StockFlow respecte déjà.

3. **Pattern recommandé : oui.** C'est le mécanisme qu'utilise la stack Supabase
   elle-même : PostgREST injecte `request.jwt.claims` via `set_config(…, true)` dans la
   transaction de la requête, et les policies lisent `current_setting('request.jwt.claims',
   true)` — exactement le pattern de `withAuthContext`. Pas de bascule en mode session
   (port 5432) nécessaire.

Deux points de vigilance donnés en retour, vérifiés sur le code :

- **Toute requête doit réellement passer dans la transaction porteuse de claims** (le
  piège classique : une requête auto-commit émise hors `BEGIN`). Couvert : l'accès aux
  données passe exclusivement par `withAuthContext`, et les policies fail-closed font
  qu'un oubli dégrade en « zéro ligne », jamais en fuite — le répondant confirme que
  c'est le bon mode de défaillance.
- **Garder `current_setting(…, true)`** (missing_ok) pour qu'un GUC absent rende NULL et
  non une erreur — déjà le cas dans les 13 policies.

### Décision retenue

Pattern **confirmé et conservé tel quel** : transaction explicite + claims `SET LOCAL` +
policies fail-closed sur le pooler transaction-mode. La garantie repose sur la sémantique
du serveur Postgres, pas seulement sur le comportement observé du pooler — la dette
« comportement observé, non documenté » du constat initial est levée. Aucun changement de
code ni d'infrastructure.
