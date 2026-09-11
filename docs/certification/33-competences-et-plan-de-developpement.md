# 33 — Évaluation des compétences et plan de développement (pièce 10, Bloc 3 — C3.3.2)

Le critère demande une grille d'évaluation des compétences actuelles **et à acquérir**,
commentée, et un plan de développement avec des formations préconisées.

## 1. Comment cette grille est construite, et pourquoi à deux colonnes

Une compétence se mesure **sur une personne**, pas sur un projet. Évaluer mon niveau en
relation client à l'aune du seul StockFlow — dont le commanditaire est un profil-type
construit — donnerait un résultat faux : il dirait « débutant » d'une compétence exercée
chaque mois en alternance, dans des ateliers de cadrage avec des clients bancaires.

La grille distingue donc deux choses :

- **Le niveau atteint** — toutes expériences confondues, alternance chez Eviden incluse.
- **L'apport de StockFlow** — ce que *ce projet précis* a fait progresser.

Un apport nul n'est pas une lacune : c'est un projet qui n'était pas le lieu de cette
progression-là. Cette distinction est ce qui rend la grille honnête, et elle fait apparaître
un résultat plus intéressant qu'une colonne unique : **StockFlow et l'alternance ont développé
des compétences quasi disjointes.**

Échelle : **0** aucune · **1** notions · **2** autonome accompagné · **3** autonome ·
**4** capable de transmettre.

## 2. Volet technique

| Compétence | Niveau | D'où vient ce niveau | Apport de StockFlow |
|---|---|---|---|
| TypeScript, architecture applicative | 4 | Angular 17 en production chez Eviden, plus StockFlow | Modéré |
| Java / Spring Boot 3, architecture hexagonale | 3 | Eviden — passerelle REST au-dessus de services historiques | Aucun |
| React et l'écosystème TanStack | 2 | **Première utilisation sur StockFlow** | **Total** |
| PostgreSQL et Row Level Security | 3 | **Première mise en œuvre sur StockFlow** — 13 policies, grants par colonnes, 15 tests d'intégration | **Total** |
| Programmation fonctionnelle typée (Effect) | 2 | **Première utilisation sur StockFlow**, périmètre volontairement restreint au domaine métier | **Total** |
| PWA offline-first (service worker, IndexedDB) | 3 | **Première réalisation sur StockFlow** | **Total** |
| Sécurité applicative (JWT, RBAC, OWASP) | 3 | StockFlow — RS256, rotation de refresh token, argon2id, audit OWASP | Majeur |
| Technologies historiques (.NET, SQL, procédures stockées) | 2 | Eviden — incursions dans le socle ancien | Aucun |
| Intervention dans un code ancien qu'on n'a pas écrit | 3 | Eviden exclusivement — vingt ans de code, connaissance non documentée | Aucun |
| CI/CD | 3 | Eviden (chaîne posée de ma propre initiative sur le projet client externe) et StockFlow | Modéré |
| Stratégie de test | 2 | Les deux — **et c'est une lacune identifiée dans les deux** (voir § 4) | Partiel |
| Accessibilité RGAA | 2 | StockFlow — audit outillé, trois violations corrigées | Total |

**Ce que la colonne de droite montre.** Quatre compétences techniques sur douze ont été
acquises *entièrement* sur StockFlow, et ce sont les quatre premières fois : React/TanStack,
RLS, Effect, PWA offline. Trois autres viennent exclusivement de l'alternance et n'ont aucun
équivalent sur StockFlow. Le projet de certification n'est pas une redite de l'expérience
professionnelle — il l'a complétée sur ce qu'elle ne couvrait pas.

## 3. Volet conduite de projet

| Compétence | Niveau | D'où vient ce niveau | Apport de StockFlow |
|---|---|---|---|
| Découpage, ordonnancement, chiffrage d'un projet | 3 | Eviden — direction technique de fait d'un projet client (découpage, chiffrage, répartition) ; StockFlow — 14 lots, rétroplanning | Majeur |
| Analyse et reformulation d'un besoin | 3 | Eviden — ateliers de cadrage avec des clients bancaires, qualification de demandes | Faible : le commanditaire de StockFlow est construit |
| Relation client directe et arbitrage contractuel | 3 | Eviden exclusivement — 20 évolutions commandées, 13 livrées et acceptées | **Aucun** |
| Leadership technique sans autorité hiérarchique | 3 | Eviden exclusivement — accompagnement d'un arrivant, désignation comme référent par le manager, direction technique d'un projet sans chef désigné | **Aucun** |
| Arbitrage sous contrainte de temps | 3 | Les deux | Majeur |
| **Pilotage d'une ressource déléguée** | 3 | **StockFlow — compétence qui n'existait pas au cadrage** | **Total** |
| Documentation pour un tiers évaluateur | 3 | Les deux | Majeur |
| Mesure de l'effet de son propre travail | **1** | **Lacune identifiée dans les deux contextes** (§ 4) | Aucun — la lacune s'y répète |
| Management hiérarchique | 1 | Jamais exercé, ni chez Eviden ni sur StockFlow | Aucun |

**Deux lignes à apport nul ne sont pas des faiblesses** : relation client et leadership
technique sont à 3, acquis en alternance. StockFlow n'était simplement pas le terrain de ces
compétences-là — un projet solo à commanditaire construit ne peut pas les exercer, et le
prétendre serait faux.

**Une ligne est une vraie lacune, à 1** : mesurer l'effet de son propre travail. C'est le
sujet du paragraphe suivant, et c'est le cœur du plan de développement.

## 4. L'axe de progression que deux contextes indépendants désignent

Le rapport d'activité professionnelle et l'audit de StockFlow ont été écrits séparément, à
trois semaines d'intervalle, sans confrontation. **Ils identifient le même défaut.**

| | Chez Eviden | Sur StockFlow |
|---|---|---|
| **Ne pas mesurer** | Campagne de performance conduite sur toute l'application — suppression de fuites mémoire, chargement différé, factorisation — **sans relever aucune mesure avant ni après**. « Je peux décrire ce que j'ai fait ; je ne peux pas démontrer que cela a servi. » | Aucun relevé de temps tenu. La charge de 10 à 15 j/h est une reconstitution *a posteriori*, pas une mesure (point V9 du registre de vigilance) |
| **Sous-investir les tests** | Contribution aux tests automatisés faible, contribution à la chaîne d'intégration **nulle** sur le produit historique | Couverture globale à 44,8 %, élevée sur le noyau critique, faible ailleurs |

Un défaut qui apparaît deux fois, dans deux contextes sans rapport, n'est pas un accident :
c'est un trait de pratique. **Le nommer comme tel, c'est ce qui transforme une liste de bonnes
intentions en plan de développement crédible.**

**Et la trajectoire de correction est déjà mesurable sur le second point.** Sur le produit
historique d'Eviden, contribution nulle à l'intégration continue. Sur le projet client externe
conduit ensuite, chaîne d'intégration posée **de ma propre initiative**. Sur StockFlow, CI
bloquante dès le premier lot, 99 tests, 36 scénarios de recette. La compétence progresse d'un
projet au suivant — ce qui reste faible, c'est la couverture, pas le dispositif.

Sur le premier point — la mesure — rien n'a encore changé, et c'est pour cela qu'il ouvre le
plan.

## 5. Ressources de montée en compétences mobilisées

| Ressource | Usage | Limite constatée |
|---|---|---|
| **Revue de code par les pairs** (Eviden) | Le principal dispositif de formation de l'alternance. Un développeur exigeant a corrigé mes propositions de manière répétée ; plusieurs de ces corrections structurent aujourd'hui ma pratique par défaut | Réciprocité insuffisante de ma part : environ 113 revues effectuées, presque toutes des approbations sans commentaire |
| **Agent de développement (Claude)** | Interlocuteur de conception plus qu'exécutant : accès immédiat à l'état de l'art, mise en contradiction des choix d'architecture, revue critique du code et des dossiers | **Ce qu'un agent affirme doit être vérifié.** Des chiffres faux ont été attrapés en exécutant réellement le code et en rasterisant les PDF. La règle « vérifier plutôt que croire un résumé » vient de là |
| Documentation officielle | PostgreSQL (RLS, `SET LOCAL`), Workbox, Effect — les trois sujets découverts sur StockFlow | — |
| Support éditeur | Ticket ouvert auprès de Supabase sur `SET LOCAL` en mode pooler transactionnel — réponse obtenue et intégrée | Délai d'une journée |
| Réseau d'ambassadeurs IA (Eviden) | Désigné ambassadeur pour mon équipe alors qu'apprenti ; points réguliers avec l'équipe pionnière | Rôle informel, sans lettre de mission |

**Sur l'agent, la formulation compte.** Il n'a pas remplacé l'apprentissage, il l'a accéléré en
supprimant le temps de recherche et en fournissant une contradiction immédiate. La compétence
acquise est double : le sujet technique lui-même, et *la manière de travailler avec un
exécutant qu'il faut spécifier et contrôler*. La seconde est transposable à une équipe humaine.

## 6. Plan de développement des compétences

Priorisé par l'écart du § 3 et aligné sur un projet professionnel déjà arrêté : embauche en CDI
chez Eviden au 5 octobre 2026, sur le même périmètre, avec l'objectif d'un rôle mêlant
conception technique et relation client.

| # | Compétence visée | Modalité | Horizon | Comment on saura que c'est acquis |
|---|---|---|---|---|
| 1 | **Mesurer l'effet de son travail** | Relever un indicateur avant / après sur chaque intervention non fonctionnelle, et tenir un relevé de temps par lot. Aucune formation requise : c'est une discipline, pas un savoir | Immédiat | Une campagne de performance ne s'ouvre plus sans mesure initiale |
| 2 | **Couverture de tests et intégration continue sur le produit historique** | Transposer la chaîne posée sur le projet client externe. C'est la priorité que j'ai moi-même inscrite dans mon rapport d'activité | 6 mois | Couverture mesurée en progression sur les modules dont j'ai la charge |
| 3 | **Rallier plutôt que convaincre** | Le désaccord de pratiques resté ouvert des mois est l'échec le plus net de l'alternance. La correction identifiée : chercher la contrainte qui produit une pratique avant de vouloir la changer, et porter la question des moyens auprès du manager | 12 mois | Le désaccord est traité, dans un sens ou dans l'autre |
| 4 | **Revue de code argumentée** | Passer d'une approbation majoritairement silencieuse à des retours motivés — rendre ce que la revue m'a apporté | 6 mois | Proportion de revues commentées |
| 5 | **Accessibilité numérique** | Formation certifiante ; la certification Opquast est la voie la plus reconnue en France sur ce périmètre | 12 mois | Certification obtenue |

Les trois premières lignes ne demandent aucun budget de formation : ce sont des changements de
pratique, mesurables, et déjà décidés. C'est délibéré — un plan de développement dont chaque
ligne suppose une formation payée est un plan qu'on n'exécute pas.

**Modalités et accessibilité.** Le critère demande que les modalités tiennent compte des
situations de handicap. Aucune ne se pose ici. Les principes qui seraient appliqués sont ceux
déjà en vigueur : supports écrits et asynchrones plutôt que transmission orale, formats à
distance, temps d'évaluation majoré sur demande. Ce point est prospectif et se dit comme tel.

## 7. Besoins en renfort si StockFlow passait à l'échelle

Le SWOT du cadrage identifiait deux faiblesses d'équipe — « équipe solo (bus factor) » et
« pas d'UX designer dédié ». Elles se sont toutes deux vérifiées.

1. **Un second développeur.** Le point de rupture (V8) : ressource unique, sans redondance ni
   transfert de compétence. J'ai vu ce risque se réaliser en entreprise — une équipe passée de
   cinq à deux contributeurs, et une connaissance métier dont un seul collègue reste
   dépositaire. Ce n'est pas un risque théorique pour moi.
2. **Un profil UX.** L'angle mort de la recette mobile est aussi un angle mort de conception :
   les parcours ont été pensés par celui qui les codait.
3. **Un profil avant-vente.** Le projet n'a jamais rencontré son marché. C'est la seule des
   trois compétences que je pratique déjà — ateliers de cadrage, qualification de demandes —
   mais sur un produit dont je n'ai pas eu à trouver les clients.
