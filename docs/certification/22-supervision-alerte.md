# 22 — Supervision et signalement (pièce 2, Bloc 4 — C4.1.2)

État **vérifié sur l'instance réelle** le 2026-07-15 (API Sentry, org `edouard-9w`,
projet `stockflow-pwa`, région UE `de.sentry.io`) — pas une description d'intention.

## Périmètre supervisé, et pourquoi celui-là

- **Quoi** : les erreurs runtime côté client (exceptions non attrapées, erreurs
  d'hydratation React) de l'application déployée. Capture par `@sentry/react`, initialisé
  en import dynamique client uniquement (`src/routes/__root.tsx`), `sendDefaultPii:
  false` (minimisation RGPD — pas d'IP ni de PII envoyées à un tiers, correctif F14 de
  la revue de sécurité).
- **Indicateurs suivis** : nouvelles erreurs (issues groupées par empreinte), fréquence
  et escalade d'une erreur existante, nombre d'utilisateurs touchés, régressions
  (résolu → réapparu).
- **Pourquoi ce périmètre** : proportionné à un MVP mono-développeur. Le client est là
  où vivent les parcours critiques (scan, saisie offline) et où les erreurs sont
  invisibles autrement ; côté serveur, les échecs des server functions remontent au
  client en erreurs capturables, et la plateforme (Vercel) fournit ses propres logs de
  fonction. Une observabilité d'entreprise (APM, tracing distribué, uptime tiers)
  serait disproportionnée ici et le dossier ne prétend pas l'avoir.

## Modalité de signalement configurée (l'exigence C4.1.2)

Règle d'alerte **active** sur le projet (ID `541468`, créée le 2026-05-07, état
`enabled`) :

| Élément | Valeur vérifiée |
|---|---|
| Déclencheurs | **Nouvelle issue de haute priorité** OU **issue existante repassant en haute priorité** (l'escalade Sentry détecte les pics de fréquence anormaux d'une erreur connue) |
| Action | **Email** aux membres actifs de l'organisation (cible `issue_owners`, repli `ActiveMembers`) |
| Fréquence | 0 min (pas de délai de regroupement — signalement immédiat) |
| URL | <https://edouard-9w.sentry.io/monitors/alerts/541468/> |

Le couple « nouvelle erreur » + « escalade d'une erreur existante » couvre les deux
modalités demandées (signalement d'inédit, signalement de pic) sans règle métrique
custom supplémentaire — la détection d'escalade de Sentry remplit le rôle du seuil
« N occurrences/heure » avec un modèle adaptatif plutôt qu'un seuil arbitraire.

## Preuve de fonctionnement bout en bout (pas théorique)

- **Dernier déclenchement réel : 2026-07-04 21:10:13 UTC** — 16 secondes après la
  première occurrence de l'issue `STOCKFLOW-PWA-2` (2026-07-04 21:09:57). L'email est
  arrivé pendant que l'anomalie était fraîche.
- **La boucle complète a fonctionné sur un cas réel** : `STOCKFLOW-PWA-2` (échec
  d'hydratation React sur `/admin/users`, 38 occurrences) est la même anomalie que
  l'issue GitHub [#32](https://github.com/EdouardSence/StockFlow/issues/32) du lot
  mobile — le diff d'hydratation capturé par Sentry montre exactement le symptôme
  qualifié (serveur : `<aside>` sidebar desktop ; client : `<main>` colonne mobile).
  Corrigée le 2026-07-13 (état initial de `useMobile` forcé à `false`) ; aucune
  occurrence après le déploiement du correctif ; issue Sentry **résolue le 2026-07-15**
  avec un commentaire de traçabilité pointant vers #32.
- `STOCKFLOW-PWA-1` (« impression étiquettes non implémentée ») est l'erreur de
  vérification volontaire du câblage : un bouton de l'UI envoie une exception de test
  via `captureException` — preuve que la chaîne de capture fonctionne en production.

## Limites connues (honnêtes, avec piste)

1. **L'init Sentry n'est pas conditionnée à l'environnement** : les sessions de dev
   local remontent aussi, taguées `production` (l'environnement par défaut de Sentry
   quand il n'est pas fourni). Les 38 occurrences de `STOCKFLOW-PWA-2` viennent en
   réalité des audits Playwright locaux — le signal reste juste (l'anomalie était
   réelle), mais le volume est du bruit de dev. Amélioration identifiée (pièce 6 /
   recommandations) : garder l'init derrière `import.meta.env.PROD` et poser
   explicitement `environment`.
2. **Capture client uniquement** : une erreur serveur qui ne remonte pas au client
   (ex. tâche de migration) n'est pas vue par Sentry — couverte par les logs Vercel et
   le caractère supervisé des opérations concernées (migrations lancées à la main).
3. La configuration des règles a été **vérifiée en lecture par l'API** ; toute évolution
   de règle se fait dans le dashboard Sentry (l'accès API en écriture n'est pas câblé
   dans l'outillage du projet, et n'a pas besoin de l'être).
