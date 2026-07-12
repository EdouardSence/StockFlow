# 15 — Manuel de déploiement

## Arbitrage hébergement (décision du 2026-07-13)

Le cadrage Bloc 1 envisageait Scalingo (PaaS français, datacenters green). La production
tourne sur **Vercel + Supabase** depuis mai 2026 — décision de **rester sur cette
infrastructure**, écart de cadrage assumé :

- La prod est éprouvée et vérifiée : variables posées (issue #20), RLS câblée sur le
  pooler Supabase, en-têtes de sécurité vérifiés en production (#17), build PWA compatible.
- Une migration à ~3 sessions de la fin du projet cumulerait : réécriture du pipeline de
  déploiement, migration des données Postgres (ou infra hybride Scalingo+Supabase, qui
  viderait l'argument green/souveraineté de sa substance), perte des previews par PR, et
  re-validation complète (e2e, headers, PWA) — pour zéro valeur fonctionnelle.
- L'application n'est pas verrouillée sur Vercel : voir l'annexe « Portabilité Scalingo »
  en fin de document.

## Architecture de déploiement

| Brique | Service | Rôle |
|---|---|---|
| Application (SSR Nitro + assets + service worker) | Vercel (projet `stock-flow`) | Build + runtime + CDN |
| Base de données | Supabase (projet `npdfobiadwtxbvpyxydr`, pooler eu-west-1) | PostgreSQL + RLS |
| Erreurs runtime | Sentry (client uniquement, PII désactivée) | Observabilité prod |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | lint → typecheck → tests purs → build |

## Déploiement depuis zéro

### 1. Base de données (Supabase)

1. Créer un projet Supabase (région UE).
2. Appliquer les migrations avec le rôle propriétaire :
   ```bash
   POSTGRES_URL="postgresql://postgres.<ref>:<mdp>@<pooler>:6543/postgres" bun run migrate
   ```
   Les fichiers `src/db/migrations/*.sql` sont rejoués **intégralement dans l'ordre
   alphabétique** à chaque exécution — ils sont idempotents par convention
   (`IF NOT EXISTS`, `CREATE OR REPLACE`), il n'y a pas de table de suivi.
3. Donner un mot de passe au rôle applicatif (créé par la migration 004, hors git) :
   ```sql
   ALTER ROLE stockflow_app LOGIN PASSWORD '<mot de passe fort>';
   ```
4. Créer le premier compte admin (seed manuel : `INSERT INTO users` + hash argon2id —
   ou via un compte existant et l'écran `/admin/users` ensuite).

### 2. Application (Vercel)

1. Importer le dépôt GitHub dans Vercel (framework auto-détecté, build `bun run build`).
2. Activer l'intégration Supabase native (pose `POSTGRES_URL`/`DATABASE_URL` — utilisées
   uniquement par les migrations, jamais par le runtime).
3. Poser les variables d'environnement **Production** (voir `.env.example` pour la
   génération des clés) :
   - `APP_POSTGRES_URL` — rôle `stockflow_app` (RLS). **Sans elle, l'app refuse de
     démarrer** (garde fail-closed, `src/db/client.ts`) — c'est voulu : pas de repli
     silencieux sur le rôle postgres qui désactiverait la RLS.
   - `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — paire RS256 en base64 (génération openssl
     documentée dans `.env.example`).
4. Pousser sur `main` → déploiement production. Chaque pull request obtient un
   déploiement preview.

Les en-têtes de sécurité (CSP, X-Frame-Options, HSTS…) sont portés par `vercel.json` —
rien à configurer dans le dashboard.

### 3. Vérifications post-déploiement

```bash
curl -sI https://<domaine>/login | grep -i "content-security-policy\|strict-transport"
curl -s -o /dev/null -w "%{http_code}" https://<domaine>/sw.js          # attendu : 200
curl -s -o /dev/null -w "%{http_code}" https://<domaine>/manifest.webmanifest  # 200
```

Puis connexion réelle avec un compte de test, un scan QR, un signalement d'incident.

## Rollback

Dashboard Vercel → Deployments → « Promote to Production » sur le déploiement précédent
(instantané, sans rebuild). Les migrations DB étant idempotentes et additives, un
rollback applicatif ne nécessite pas de rollback de schéma ; une migration fautive se
corrige **en avant** (nouveau fichier `NNN`), jamais en éditant un fichier déjà appliqué.

## Annexe — Portabilité Scalingo

Ce qui changerait si l'arbitrage était renversé (rien de bloquant côté code) :

1. **Runtime** : build Nitro preset `node-server` (`.output/server/index.mjs`) +
   `Procfile` (`web: bun .output/server/index.mjs`) — le code applicatif est inchangé.
2. **Base** : addon PostgreSQL Scalingo, rejouer `bun run migrate`, recréer le rôle
   `stockflow_app` et son mot de passe, migrer les données (`pg_dump`/`pg_restore`).
3. **Variables** : identiques (`APP_POSTGRES_URL`, clés JWT) — posées via
   `scalingo env-set`.
4. **En-têtes de sécurité** : `vercel.json` ne s'applique plus — à porter dans la config
   Nitro (`routeRules.headers`) ou un middleware.
5. **Perdu** : previews par PR, intégration Supabase native, rollback un-clic (remplacé
   par le redéploiement d'un tag git).
