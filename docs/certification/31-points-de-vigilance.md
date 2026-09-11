# 31 — Registre des points de vigilance (pièce 7, Bloc 3 — C3.1)

Le critère « les points de vigilance sont soulignés » relève d'une compétence **éliminatoire**.
Ce registre consolide en un seul endroit ce que les 23 pièces du dossier documentaient déjà
séparément. Rien n'y est nouveau — la valeur est dans la consolidation et dans la
qualification.

Un point de vigilance n'est pas un bug : c'est une **limite connue, laissée en l'état
délibérément**, avec la conséquence qu'elle emporte. Le registre existe pour que ces limites
soient dites par le porteur du projet avant d'être trouvées par quelqu'un d'autre.

## Registre

| Réf | Point de vigilance | Portée | Criticité | Statut | Conséquence si non traité |
|---|---|---|---|---|---|
| **V1** | Base de test partagée avec la production, mitigée par convention de préfixe et sweep | Exploitation | Moyenne | Accepté | Pollution des données réelles ; reliquats visibles à l'écran — dont pendant la démonstration du 18/09 |
| **V2** | Claims JWT auto-déclarés : la RLS protège de l'oubli de contexte et de l'accès anonyme, **pas** d'une connexion applicative compromise | Sécurité | Moyenne | Accepté, documenté | Fausse assurance si la protection est surclamée. La limite est écrite noir sur blanc plutôt que maquillée |
| **V3** | Rate limiting du login **en mémoire**, donc par instance serverless | Sécurité | Faible | Accepté | Le plafond réel de tentatives est multiplié par le nombre d'instances actives |
| **V4** | Couverture de tests globale à 44,8 % — élevée sur le noyau critique, faible ailleurs | Qualité | Moyenne | Accepté, assumé | Une régression sur les couches non couvertes passe la CI. Choix délibéré : couvrir le domaine et l'authentification plutôt que d'atteindre un pourcentage |
| **V5** | Dépendances déclarées en `latest`, dont `nitro-nightly` | Reproductibilité | Moyenne | **Clos le 09/09** | Sept versions figées à l'exact dans `package.json`, `bun.lock` régénéré, chaîne CI rejouée en local (lint, typecheck, 84 tests, build). Avant : une installation sans lock, ou un `bun update`, pouvait casser le build sans qu'aucune ligne de code n'ait changé |
| **V6** | Vulnérabilités transitives sur les dépendances de développement (#24) | Sécurité | Faible | Différé par choix | Périmètre de développement uniquement, pas d'exposition en production |
| **V7** | Mise en pause du projet Supabase après une semaine d'inactivité (palier gratuit) | Exploitation | Moyenne | Accepté | Indisponibilité au premier accès. **S'est déjà produit** — le projet était `INACTIVE` au début d'une session |
| **V8** | Ressource humaine unique, sans redondance ni transfert de compétence | Organisation | **Élevée** | Accepté, non traité | Une indisponibilité de deux semaines en juillet faisait manquer le jalon du Bloc 2. Aucune mitigation n'existait |
| **V9** | Aucun relevé de temps tenu sur la durée du projet | Pilotage | Moyenne | **Ouvert** | Impossible de mesurer la productivité réelle, de calibrer les estimations suivantes ou de facturer au réel |
| **V10** | Couverture des domaines Effect non reproductible par la commande standard | Qualité / cohérence | Moyenne | **Clos le 11/09** | Artefact de mesure par agent : Vitest masque les fichiers couverts à 100 % quand il tourne sous un agent IA. Dans un terminal humain, les deux domaines ont toujours affiché 100 %. `skipFull: false` dans `vitest.config.ts` les montre dans tous les cas |

## Les trois limites de sécurité ouvertes dans le suivi

Le dépôt est public et son suivi affiche **cinq issues ouvertes**. Deux figurent déjà au
registre — #7 (V2) et #24 (V6). Les trois autres sont des **limites de conception**, arbitrées
et documentées en `09-securisation.md`, pas des anomalies en attente de correction. Elles sont
laissées ouvertes délibérément, pour que la limite reste visible plutôt qu'archivée. Les
consigner ici est ce qui fait que le registre et le suivi public disent la même chose.

| Réf | Limite | Criticité | Conséquence assumée |
|---|---|---|---|
| **V11** (#4) | Jeton d'accès non ré-interrogé en base pendant ses 15 minutes de vie | Faible | Une révocation de droits met jusqu'à 15 minutes à prendre effet. Compromis standard du JWT sans état, retenu pour ne pas interroger la base à chaque requête |
| **V12** (#5) | Pas de déconnexion globale multi-appareils | Faible | Un appareil oublié reste connecté tant que vit son jeton de renouvellement. Mitigé par la rotation systématique et la révocation de toute la famille de jetons en cas de rejeu détecté |
| **V13** (#6) | `auth_login_lookup` (SECURITY DEFINER) expose `password_hash` à la connexion applicative | Faible | Appelable sans claims posés. Dominé par V2 : qui détient la connexion applicative dispose de chemins plus directs. Le grant par colonnes reste la barrière contre l'accès accidentel |

## Relevé le 11 septembre

| Réf | Point de vigilance | Criticité | Statut | Conséquence |
|---|---|---|---|---|
| **V14** | Fonctions Vercel exécutées dans la région par défaut `iad1` (Washington), alors que la base est en Irlande et que le support du 6/09 annonçait « tous en UE » | Moyenne | **Ouvert, correction différée** | Les données personnelles transitent par les États-Unis à chaque requête, et chaque requête base traverse l'Atlantique. Correction d'une ligne (`regions` → `dub1`) qui suppose un redéploiement de la production : différée pour ne pas la toucher à une semaine de la démonstration |

## Le point encore ouvert — V9 — et les deux clos en septembre

**V5 est clos.** Les sept dépendances déclarées en `latest` — cinq paquets TanStack, le plugin
de devtools et l'alias `nitro-nightly` — portent désormais leur version exacte dans
`package.json`. Le lock a été régénéré sur ces mêmes versions résolues, et la chaîne
d'intégration rejouée en entier, en local, pour vérifier que le figeage ne changeait rien : lint,
typecheck, 84 tests hors intégration, build. Le point le moins visible du registre était aussi
le plus facile à corriger — cinq minutes, et le projet n'embarque plus une *nightly* flottante.

**V9 — le relevé de temps.** C'est la vraie lacune de pilotage de ce projet, et elle est
exposée comme telle au tableau de bord plutôt que dissimulée.

**V10 est clos, et c'est le plus instructif des trois.** Relevé le 31 août en réexécutant la
mesure avant de construire le support — mais **par un agent**. La cause, trouvée le 11 septembre :
Vitest détecte qu'il tourne sous un agent IA et masque alors, dans son rapport texte, les fichiers
couverts à 100 %. Les deux domaines étaient mesurés à 100 % ; dans un terminal humain, ils l'ont
toujours affiché. L'écart n'existait que dans le rapport vu par l'agent. C'est l'illustration exacte
de la règle du projet : ce qu'un agent rapporte se vérifie — y compris quand il rapporte un
problème.

## Ce que ce registre dit de la méthode

Sept des dix points du registre sont **acceptés** : connus, chiffrés dans leurs conséquences,
et laissés ouverts délibérément parce que les traiter coûterait plus que le risque encouru sur
un MVP — et les trois limites de sécurité du suivi le sont pour la même raison.
Un risque accepté n'est pas un risque oublié — et la différence entre les deux, sur un projet,
se voit exactement à l'existence d'un registre comme celui-ci.
