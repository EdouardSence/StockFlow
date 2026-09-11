# 28 — Méthodologie de conduite de projet (pièce 5, Bloc 3 — C3.1)

Compétence **éliminatoire**. Le critère demande un choix de méthodologie « justifié avec les
bénéfices attendus » et un outil de planification « compatible avec la méthodologie choisie ».
La pièce 24 en donne le résumé ; celle-ci justifie le choix et expose les alternatives
écartées.

## 1. La contrainte qui détermine tout

Trois faits de contexte, et il faut les poser avant de parler de méthode, sinon le choix
paraît arbitraire :

- **Les dates sont imposées.** Cinq jalons de certification, fixés par le certificateur,
  connus dès mai, non négociables. Un livrable remis en retard est déclaré non recevable.
- **La ressource est unique et non dédiée.** Un alternant, projet mené en dehors du temps
  d'entreprise, avec des fenêtres de disponibilité irrégulières.
- **Le périmètre est négociable.** C'est la seule variable d'ajustement disponible.

Une méthode qui suppose une équipe, une cadence régulière et un engagement de contenu par
itération est donc structurellement inadaptée. C'est le raisonnement qui a écarté Scrum.

## 2. Le choix : rétroplanning à jalons fixes + flux tiré

**Deux régimes qui cohabitent**, et c'est délibéré : la planification est descendante, l'exécution
est tirée.

| | Régime | Bénéfice attendu |
|---|---|---|
| **Cadre** | Rétroplanning à jalons fixes — on part de chaque date de jury et on remonte le temps | La date ne peut pas glisser ; c'est le périmètre qui absorbe l'aléa |
| **Exécution** | Flux tiré (Kanban), **WIP limité à 1** | Sur une ressource unique, le multitâche est le premier facteur de dérive |

**Pourquoi le WIP de 1 plutôt qu'un engagement d'itération.** Avec des fenêtres de
disponibilité irrégulières, s'engager sur un contenu à deux semaines produit soit un
engagement systématiquement raté, soit un engagement si prudent qu'il ne pilote rien. Tirer un
lot quand le précédent est fermé supprime le problème : il n'y a jamais de reste-à-faire d'une
itération à reporter sur la suivante, et jamais de coût de reprise de contexte sur un lot
laissé à moitié.

**Un lot = borné et finissable en une session.** C'est la règle qui rend le flux tiré
opérationnel : « Lot Auth », « Lot RLS », « Lot PWA offline ». La session commence par la
lecture du journal, se termine par sa mise à jour et un commit. Quatorze lots sont tracés
selon cette règle dans `PROGRESS.md`.

## 3. Définition of done

Une méthode sans critère d'achèvement vérifiable ne pilote rien — c'est particulièrement vrai
quand une partie de l'exécution est déléguée. Un lot est fermé quand :

1. `lint`, `typecheck`, `test` et `build` passent — vérifié par exécution, pas par supposition ;
2. la case correspondante de `PROGRESS.md` est cochée **avec le moyen de vérification indiqué** ;
3. l'issue GitHub associée est fermée avec un résumé du correctif vérifié ;
4. la documentation touchée est à jour dans le même commit.

Le point 1 n'est qu'en partie mécanique : le hook local (Husky) bloque le commit si lint ou
typecheck échoue ; la CI rejoue les quatre à chaque push mais **signale sans bloquer** — `main`
n'est pas protégée. Le reste relève de la discipline, et c'est faillible — c'est précisément ce
qu'a montré l'incident CI de neuf jours (pièce 30).

## 4. Alternatives écartées

| Méthode | Pourquoi écartée |
|---|---|
| **Scrum** | Suppose une équipe, des rôles distincts, une cadence régulière et un engagement de contenu par sprint. Aucune des quatre conditions n'est réunie. Le Bloc 1 annonçait « 6 sprints de 2 semaines » — l'exécution ne l'a pas suivi, et revendiquer Scrum aujourd'hui serait démenti par l'historique git. |
| **Cycle en V** | Aurait imposé de figer les spécifications avant de coder. Or plusieurs décisions structurantes — le périmètre d'Effect, l'architecture RLS, le comportement offline — n'étaient pas décidables sur le papier : elles se sont tranchées en essayant. |
| **XP** | Le pair programming et l'appropriation collective du code supposent au moins deux personnes. Deux pratiques ont malgré tout été retenues isolément : l'intégration continue et le refactoring outillé. |
| **Kanban « pur », sans jalons** | Aurait ignoré la contrainte la plus dure du projet. Le flux tiré organise l'exécution, il ne remplace pas un rétroplanning quand les dates sont imposées. |

## 5. Compatibilité entre l'outil et la méthode

Le critère l'exige explicitement, et c'est ce qui explique l'absence de diagramme de Gantt
d'enchaînement dans ce dossier.

- **Un tableau Kanban** est l'outil natif du flux tiré : il montre l'état, pas la date.
  GitHub Projects, avec les 32 issues du projet, remplit ce rôle.
- **Un rétroplanning à jalons** est l'outil natif d'un calendrier imposé : il montre les dates
  butoirs et ce qui doit être prêt avant.
- **Un Gantt d'enchaînement de tâches serait faux ici.** Il représente des dépendances entre
  tâches parallèles conduites par des ressources différentes. Sur une ressource unique, aucune
  tâche n'est jamais parallèle : toutes les barres seraient en série et le diagramme
  n'apporterait aucune information que la liste ordonnée ne donne déjà. Le diagramme de la
  pièce 24 est un rétroplanning de **phases**, pas un Gantt de tâches — la distinction est
  volontaire et se dit à l'oral.

## 6. Ce que la méthode n'a pas empêché

Deux défaillances, exposées en détail dans la pièce 30, et qui touchent toutes deux la même
zone : ce que la méthode ne rendait pas **visible**.

- La CI est restée en échec neuf jours sans que personne ne le voie. Le contrôle était
  automatique, le signal ne l'était pas.
- Trente-six scénarios de recette étaient verts pendant que le parcours mobile réel était
  cassé. Le critère d'achèvement était vérifiable mécaniquement, mais il ne mesurait pas le
  bon usage.

Une méthode se juge autant sur ce qu'elle laisse passer que sur ce qu'elle produit. Les deux
corrections apportées — un signal visible pour tout contrôle automatique, une recette adossée
aux usages réels — sont les deux vraies améliorations méthodologiques du projet.
