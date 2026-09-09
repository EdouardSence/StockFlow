# 26 — Outil de suivi et tableau de bord (pièce 3, Bloc 3 — C3.2.1, C3.2.2)

Compétence **éliminatoire**. La grille exige un tableau de bord intégrant l'avancement, les
coûts, les délais, les risques et les ressources humaines. Les cinq dimensions figurent
ci-dessous. Tous les chiffres ont été relevés le **2026-08-31** sur le dépôt à `23d86f5`, par
exécution réelle (`vitest run`, `git log`) et non par report d'un document antérieur.

## 1. L'outil de suivi

Trois outils, un rôle chacun, cohérents avec le flux tiré de la pièce 24 :

| Outil | Rôle | Ce qu'il garantit |
|---|---|---|
| **GitHub Projects** (32 issues) | File de travail, un lot en cours | Rien n'est corrigé avant d'être qualifié en issue |
| **`PROGRESS.md`** (510 lignes) | Journal chronologique, jamais réécrit | Traçabilité de ce qui a été fait *et vérifié*, avec le moyen de vérification |
| **CI GitHub Actions** | Contrôle bloquant | lint → typecheck → tests → build ; un échec bloque la fusion |

Règle de tenue : une case n'est cochée dans `PROGRESS.md` que si la vérification a réellement
été exécutée — build vert, test passant, requête jouée. Jamais par supposition. Les entrées
passées ne sont jamais réécrites, ce qui rend le journal utilisable comme preuve.

## 2. Avancement

| Indicateur | Valeur au 31/08 | Source |
|---|---|---|
| Issues traitées et référencées en commit | 31 (#1 à #34, hors #6, #10, #20) | `git log` |
| Lots livrés | 10 sur 10 du périmètre MVP | `PROGRESS.md` |
| Versions taguées | 3 — v0.2.0 (03/07), v0.3.0 (04/07), v0.4.0 (13/07) | `git tag` |
| Migrations appliquées en production | 6 | `src/db/migrations/` |
| Commits | 116 toutes branches, **114 sur `main`** | `git rev-list --count --all` / `--count HEAD` |
| Volume de source | 11 647 lignes (62 fichiers `.ts`/`.tsx`/`.sql`) | relevé direct |

**Qualité, en appui de l'avancement** — ces chiffres sont ceux des dossiers Bloc 2 et Bloc 4,
revérifiés par exécution le 31/08 :

| Indicateur | Valeur | Vérification |
|---|---|---|
| Tests Vitest | **99** (84 purs + 15 intégration RLS) | `vitest run` : 84 passés, 8 fichiers, 0 échec |
| Scénarios e2e Playwright | 36 | 11 fichiers `.spec.ts` |
| Couverture globale | **44,77 %** | `vitest run --coverage` |
| Couverture `auth-core.ts` | 92,15 % | idem |

Ces quatre valeurs ont été **rejouées le 09/09/2026** sur une installation propre
(`bun install` depuis le lock régénéré) : 84 tests passés sur 8 fichiers, couverture globale
44,77 %, `auth-core.ts` à 92,15 %. Identiques au relevé du 31/08 — les chiffres du support
sont reproductibles par un tiers qui clone le dépôt.

> **Point à traiter avant l'oral.** Les deux fichiers du domaine Effect
> (`equipment-domain.ts`, `incidents-domain.ts`) **n'apparaissent pas** dans le rapport de
> couverture, ni avec le provider v8 ni avec istanbul — alors que leurs 14 tests passent. La
> couverture de 100 % annoncée sur ces domaines dans le dossier Bloc 2 n'est donc pas
> reproductible par la commande standard. Ce n'est pas une affirmation fausse — les tests
> couvrent bien le domaine — mais elle n'est pas démontrable à l'écran si le jury demande à
> voir. À corriger dans la configuration de couverture, ou à reformuler avant le 15/09.

## 3. Délais

L'indicateur de délai principal est le respect des jalons, parce que ce sont les seules dates
que le projet ne pouvait pas déplacer.

| Jalon | Échéance | Réel | Écart |
|---|---|---|---|
| Bloc 1 — oral | 12/06 | tenu, validé | 0 |
| Bloc 2 — dossier + code | 20-24/07 | déposé dans la fenêtre | 0 |
| Bloc 4 — dossier | 21/08 | déposé | 0 |
| Rapport d'activité | 31/08 | déposé | 0 |
| Bloc 3 — dépôt du support | 15/09 | à venir au 31/08 | — |

**4 jalons sur 4 tenus au 31/08, aucun report demandé** — cinq sur cinq une fois le support
déposé le 15/09, ce qu'affiche le support de soutenance.

Rythme de production, par relevé git : **16 journées actives** — 3 en mai, 11 en juillet, 2 en
août. Neuf de ces seize journées tombent dans les deux semaines du 3 au 15 juillet. L'écart
avec le rythme régulier annoncé au Bloc 1 est analysé en pièce 24.

## 4. Coûts

### Écart entre le budget présenté au Bloc 1 et la dépense réelle

| Poste | Budget Bloc 1 | Dépensé | Écart |
|---|---|---|---|
| Développement (25 j/h × 500 €) | 12 500 € | voir ci-dessous | — |
| Hébergement (Scalingo, 3 mois) | 90 € | 0 € — Vercel Hobby | −90 € |
| Domaine + SSL | 20 € | 0 € — sous-domaine `vercel.app`, TLS inclus | −20 € |
| Outils (GitHub, Sentry, CI) | 30 € | 0 € — paliers gratuits | −30 € |
| Contingence projet | 1 896 € | non consommée | −1 896 € |
| **Total hors charge** | **140 €** | **0 €** | **−140 €** |

### Ce que « 0 € » cache réellement

Un coût nul n'est pas une économie : c'est un **report**, et le projet en a déjà payé le prix.
Le palier gratuit Supabase met un projet en pause après une semaine d'inactivité — c'est
arrivé, `PROGRESS.md` en garde la trace : le projet était `INACTIVE` au début d'une session et
a dû être réveillé avant de pouvoir appliquer une migration. Chez un client, ce même
comportement est une indisponibilité de service.

Coût de possession réel pour une mise en production chez un client, au tarif public relevé le
31/08/2026 :

| Poste | Palier requis | Coût |
|---|---|---|
| Hébergement applicatif | Vercel Pro (1 siège) | 20 $/mois |
| Base de données | Supabase Pro — ne se met jamais en pause, sauvegardes quotidiennes | 25 $/mois |
| Supervision | Sentry, palier gratuit suffisant à ce volume | 0 € |
| **Total** | | **≈ 45 $/mois, soit de l'ordre de 500 $/an** |

L'ordre de grandeur du Bloc 1 (30 €/mois d'hébergement) était donc juste. Rapporté au gain
récurrent estimé de ~4 500 €/an, le coût de possession absorbe environ un dixième du bénéfice
annuel — et il faut y ajouter la maintenance, qui est le poste que le jury du Bloc 1 avait
relevé comme manquant.

### Coût de charge

La charge n'a pas été relevée en continu — c'est la principale lacune de pilotage de ce
projet, et elle est assumée. Deux mesures se recoupent :

| Source | Valeur | Ce qu'elle couvre |
|---|---|---|
| Relevé git, pondéré par volume de commits | ≈ 9 j/h | Uniquement la production versionnée |
| Estimation du porteur de projet | **10 à 15 j/h** | Tous postes : cadrage, code, dossiers, préparation des oraux |
| Plan de charge du Bloc 1 | 25 j/h | Estimation *a priori*, périmètre MVP |

À périmètre livré équivalent, la charge réelle se situe donc **autour de la moitié de
l'estimation initiale**. Trois précautions avant d'en tirer une conclusion :

1. Le relevé git ne voit que le code. Le cadrage, la rédaction des dossiers et la veille ne
   laissent pas de commit — d'où l'écart entre 9 et la fourchette 10-15.
2. La fourchette de 10-15 j/h est une reconstitution, pas un relevé. Elle a la précision d'un
   souvenir.
3. L'estimation de 25 j/h supposait un développeur seul sans assistance. La production
   assistée par agents a comprimé le temps d'écriture, mais **augmenté** le temps de
   spécification et de relecture.

La conclusion défendable n'est donc pas « j'ai fait deux fois plus vite », mais : *le mode de
production a déplacé la charge de l'écriture vers la spécification et le contrôle, et
l'estimation initiale ne modélisait pas ce déplacement.* Valorisée au taux du Bloc 1
(500 €/j), la charge réelle représente de l'ordre de **5 000 à 7 500 €** contre 12 500 €
budgétés — un écart qui profiterait au client, mais qui n'a de valeur d'argument que si l'on
dit d'où vient le chiffre.

## 5. Risques

| Réf | Risque | Criticité | Statut | Traitement |
|---|---|---|---|---|
| R1 | CI en échec non détectée (restée rouge 9 jours, #26) | Élevée | Clos | Badge de statut au README, sonde de disponibilité planifiée |
| R2 | Recette aveugle au parcours mobile réel | Élevée | Clos | Passe de vérification sur téléphone physique, AN-3 à AN-6 corrigées (#28-#32) |
| R3 | Base de test partagée avec la production | Moyenne | **Accepté** | Convention de préfixe + sweep. Dette documentée, non résolue |
| R4 | Claims JWT auto-déclarés : la RLS ne protège pas d'une connexion applicative compromise | Moyenne | **Accepté** | Limite documentée honnêtement plutôt que surclamée |
| R5 | Rate limiting en mémoire, donc par instance serverless | Faible | **Accepté** | Plafond documenté |
| R6 | Mise en pause du projet Supabase (palier gratuit) | Moyenne | **Accepté** | Réveil manuel ; résolu par le palier Pro en production |
| R7 | Échec de la démonstration live devant le jury | **Élevée** | **Ouvert** | Pièce 27 — dispositif, checklists et plan de repli |

Un risque « accepté » est un risque connu, chiffré dans ses conséquences, et laissé ouvert
délibérément — pas un risque oublié.

## 6. Ressources humaines

| Indicateur | Valeur |
|---|---|
| Effectif humain | 1 alternant, non dédié — projet mené hors temps d'entreprise |
| Ressources déléguées | Agents de développement, missions bornées (pièce 25) |
| Journées de production identifiées | 16, réparties sur 4 mois |
| Charge estimée *a posteriori* | 10 à 15 j/h tous postes (~9 j/h versionnés) |
| Point de rupture identifié | Ressource unique : toute indisponibilité arrête le projet. Aucune redondance, aucun transfert de compétence possible. |

## 7. Fréquence et tenue

Le tableau de bord se met à jour à chaque fin de lot : `PROGRESS.md` est complété et commité
avant la clôture de session. Les indicateurs de qualité sont recalculés par exécution avant
chaque jalon — c'est ce qui a permis, le 31/08, de découvrir l'écart de couverture signalé
au §2 plutôt que de le laisser au jury.

**Recommandation d'amélioration, pour un projet équivalent** : tenir un relevé de temps par
lot dès le premier jour. Son absence ici empêche de mesurer la productivité réelle, de
calibrer les estimations suivantes et de facturer au réel. C'est le seul indicateur du tableau
de bord qui soit reconstruit après coup au lieu d'être mesuré.
