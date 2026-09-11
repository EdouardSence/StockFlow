# 34 — Comptes rendus, points de validation et satisfaction (pièce 11, Bloc 3 — C3.4.1)

Le critère attend des comptes rendus d'avancement au client, des points de validation
planifiés, et des indicateurs de satisfaction définis.

## 1. Le cadre, posé une fois

**Le commanditaire de StockFlow est un profil-type de TPE/PME construit au cadrage, pas une
entreprise cliente.** Le règlement spécial prévoit explicitement cette modalité pour un projet
de formation. Le dire clairement vaut mieux que de laisser croire à une relation client qui
n'a pas eu lieu — et cela n'enlève rien aux objets du critère, qui portent sur la *méthode* de
restitution : structurer une information d'avancement, planifier des moments de validation,
définir ce qu'on mesurera.

Ce qui, dans ce projet, a réellement joué le rôle du commanditaire, ce sont **les jurys de
certification** : le règlement leur donne ce rôle, et le jury du Bloc 1 l'a effectivement tenu
en produisant un retour critique qui a modifié la suite du projet. C'est le matériau réel de
cette pièce.

## 2. Points de validation planifiés

Cinq points fixés à l'avance : quatre tenus, le cinquième est la soutenance.

| Point | Date | Objet soumis à validation | Retour obtenu |
|---|---|---|---|
| PV1 — Cadrage | 12 juin | Périmètre, faisabilité, budget, architecture cible | **Oui** — retour circonstancié du jury, § 3 |
| PV2 — Livraison du MVP | 20-24 juillet | Code, dossier de conception, cahier de recettes | Pas de retour reçu à ce jour |
| PV3 — Mise en condition opérationnelle | 21 août | Supervision, traitement d'anomalies, journal de versions | Pas de retour reçu à ce jour |
| PV4 — Bilan d'activité | 31 août | Rapport d'activité | Pas de retour reçu à ce jour |
| PV5 — Recette fonctionnelle | 18 septembre | Démonstration du logiciel, validation avant livraison | À venir |

L'espacement suit les phases du projet, pas un calendrier arbitraire : chaque point soumet un
état livrable. Seul PV1 a produit un retour : après PV2, PV3 et PV4, le développement s'est
poursuivi sans validation explicite, sur le périmètre validé en PV1 — c'est une limite du
dispositif, pas une validation tacite.

## 3. Le retour de PV1, et ce qui en a été fait

C'est le seul retour réellement obtenu, et il a été traité comme un retour client : analysé,
converti en actions, vérifié. Quatre remarques, quatre suites.

| Remarque du commanditaire | Nature | Ce qui a été fait |
|---|---|---|
| **Le coût de possession manquait dans le ROI** — le coût de construction n'est pas le coût de détention | Économique | TCO chiffré et sourcé : 45 $/mois d'infrastructure au tarif public, ligne de maintenance identifiée comme restant à provisionner (pièce 29) |
| **Structurer la restitution par nature** — économique, management, technique séparés, le technique en appui | Forme | Le support du Bloc 3 est construit ainsi ; la technique n'y intervient qu'en preuve d'une affirmation de gestion |
| **Incohérence transversale relevée** — le RBAC annoncé à 3 rôles, décrit à 2 ailleurs | Rigueur | Un audit de cohérence transversal est désormais exécuté avant chaque dépôt. Il a produit des corrections réelles : couverture remesurée à 44,8 %, nombre de tests RLS corrigé de 13 à 15. **Le RBAC est aujourd'hui à 2 rôles partout** — `admin` et `technician` ; le troisième rôle annoncé au cadrage a été abandonné, et c'est dit plutôt que masqué |
| **Sourcer plutôt qu'affirmer** — une priorisation doit venir du client, pas de la préférence du développeur | Méthode | C'est la remarque la plus exigeante, et la réponse honnête est celle du § 1 : les priorisations de ce projet sont des **décisions de porteur de projet appliquées à un profil-type**, pas des demandes recueillies. Elles sont défendables par le raisonnement, pas par une source client |

**Ce que ce retour a changé au-delà des quatre points.** Il a installé la pratique qui structure
tout le reste du projet : ne rien affirmer qui ne soit vérifiable, et vérifier soi-même avant
qu'un tiers ne le fasse. Les écarts trouvés le 31 août — couverture des domaines Effect non
reproductible, dépendances non figées — ont été trouvés par cette pratique-là.

## 4. Format des comptes rendus

Un compte rendu par point de validation, une page, cinq rubriques fixes. Le format est conçu
pour **faciliter une décision**, pas pour raconter le travail accompli.

1. **Où en est le projet** — état d'avancement rapporté au périmètre validé
2. **Ce qui a été livré depuis le dernier point** — fonctionnalités, en langage d'usage
3. **Ce qui a changé par rapport à l'annoncé** — les écarts, avec leur cause et l'arbitrage retenu
4. **Ce qui est à décider** — les points bloquants, avec les options et une recommandation
5. **Prochaine échéance** — date et objet

La rubrique 3 est celle qui a le plus de valeur, et c'est celle qu'on est le plus tenté
d'omettre : un compte rendu qui ne dit que ce qui va bien n'aide personne à décider. L'écart
d'hébergement (pièce 32) et l'écart de rythme de production y figureraient tous les deux.

Trois comptes rendus rédigés selon ce format, correspondant à PV1, PV2 et PV3, accompagnent
cette pièce en annexe.

## 5. Indicateurs de satisfaction

Ils ont été définis au cadrage et **aucun n'a été mesuré**. La raison est simple et se dit
sans détour : mesurer une satisfaction suppose des utilisateurs, et le projet n'a pas eu de
pilote client.

| Indicateur | Cible | Quand il serait mesuré | État |
|---|---|---|---|
| Score SUS (utilisabilité perçue) | ≥ 80 / 100 | M+3 après mise en service, sur le pilote | **Cible, non mesuré** |
| Time-to-value à la prise en main | < 1 jour | Au déploiement chez le premier client | **Cible, non mesuré** |
| Taux d'activation du parc | 100 % du parc scanné à 6 mois | M+6 | **Cible, non mesuré** |
| Temps d'inventaire annuel | −50 % | Comparaison avant/après sur un exercice | **Cible, non mesuré** |

**Ce qui a été mesuré, en revanche**, relève de la conformité et non de la satisfaction :
36 scénarios de recette exécutés sur 36 au vert au dernier passage (13/07), 99 tests unitaires et d'intégration verts,
aucune anomalie fonctionnelle ouverte. Les cinq issues encore ouvertes dans le suivi ne sont
pas des anomalies : ce sont des limites de conception arbitrées et documentées, consignées au
registre de vigilance (pièce 31, V2, V6, V11 à V13). Ce sont des indicateurs de qualité
livrée, pas des indicateurs de satisfaction — confondre les deux serait exactement le genre d'affirmation
surclamée que le retour de PV1 sanctionnait.

**Le dispositif prévu**, si le projet trouvait un pilote : questionnaire SUS à M+3 sur
l'ensemble des utilisateurs, relevé du taux d'activation depuis la base, et un entretien
qualitatif avec l'administrateur du parc — la mesure quantitative ne dit pas *pourquoi* un
outil est adopté ou contourné.
