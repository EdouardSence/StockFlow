# 25 — Affectation des missions et matrice RACI (pièce 2, Bloc 3 — C3.1, C3.3.1)

Le critère « les tâches sont assignées aux différents membres de l'équipe selon leurs
compétences (matrice RACI) » relève d'une compétence **éliminatoire**. Cette pièce y répond
sans inventer d'équipe.

## 1. Cadrage : de quoi cette équipe est faite

Le projet est mené par **une seule ressource humaine**, assistée d'**agents de développement**
(Claude Code) auxquels des missions bornées sont déléguées. L'équipe est donc de nature
différente d'une équipe salariée, mais les objets du pilotage restent identiques : affecter,
déléguer, contrôler, arbitrer. Cette phrase est posée une fois ; le reste du dossier ne
revient pas dessus et ne fait pas semblant.

Cinq rôles distincts interviennent, dont trois portés par la même personne. Les distinguer
n'est pas un artifice : ils ont des responsabilités différentes et, à plusieurs reprises, des
intérêts divergents — le responsable de projet a tranché contre l'envie du développeur.

| Rôle | Porté par | Compétences mobilisées |
|---|---|---|
| **Commanditaire** | Profil-type TPE/PME construit au Bloc 1 — une référence, pas une personne | Besoins et critères d'acceptation, consultés au cadrage et à la recette |
| **Responsable de projet** | Édouard Sence | Planification, arbitrage, contrôle qualité, redevabilité |
| **Développeur** | Édouard Sence | Architecture, code, tests, sécurité |
| **Agent d'exécution** | Claude Code (Sonnet / Opus selon la tâche) | Production sur spécification bornée, audit, assemblage documentaire |
| **Instance pédagogique** | Tuteur et jury YNOV | Consultation aux jalons, validation |

## 2. Matrice RACI

**R** exécute · **A** est redevable · **C** est consulté · **I** est informé.

| Activité | Commanditaire | Resp. projet | Développeur | Agent | Pédagogique |
|---|---|---|---|---|---|
| Cadrage du besoin et périmètre | C | **A/R** | C | — | I |
| Choix d'architecture technique | C | A | R | C | I |
| Planification et jalons | I | **A/R** | C | — | C |
| Spécification d'un lot | C | A | R | C | — |
| Écriture du code applicatif | — | A | C | R | — |
| Décision de sécurité et modèle de menace | I | A | **R** | C | — |
| Migration de schéma en production | I | **A/R** | R | — | — |
| Rédaction des tests | — | A | C | R | — |
| Qualification d'une anomalie (issue) | C | A | R | C | — |
| Revue de code et validation de correctif | — | **A/R** | R | — | — |
| Documentation technique et pièces | — | A | C | R | I |
| Arbitrage sur écart ou dérive | C | **A/R** | C | — | I |
| Recette fonctionnelle | C | A | **R** | — | — |
| Dépôt des livrables de certification | — | **A/R** | — | — | R |

## 3. La règle d'affectation, et pourquoi elle tient

Trois principes ont gouverné toute délégation, et ils sont vérifiables dans `CLAUDE.md` et
dans l'historique des commits.

**L'agent n'est jamais A.** Il est R sur une mission bornée, jamais redevable du résultat. La
redevabilité ne se délègue pas à une ressource qui ne peut ni être tenue pour responsable, ni
répondre devant un client. Concrètement : le contrôle passe par l'exécution, pas par une relecture ligne à ligne — une case de
`PROGRESS.md` n'est cochée que si la vérification a été exécutée — build vert, test passant —
jamais sur déclaration de l'agent.

**Trois catégories ne se délèguent pas du tout**, et l'agent a pour consigne permanente de
s'arrêter et de demander dès qu'il en croise une : les décisions produit (périmètre,
priorisation), les décisions d'architecture nouvelle, et les décisions de sécurité. Le
développeur reste R sur le modèle de menace — c'est la seule ligne du tableau où le R ne va
pas à l'agent alors qu'il s'agit de code.

**L'affectation suit la maturité de la tâche, pas la commodité.** Une tâche dont le patron est
établi et le résultat vérifiable mécaniquement part à l'agent. Une tâche exploratoire, ou dont
l'échec serait silencieux, reste avec le développeur. Le choix de modèle suit la même logique :
modèle standard pour la configuration, la documentation et l'assemblage ; raisonnement étendu
pour un premier usage de patron ou un audit large ; modèle le plus capable pour la sécurité,
l'état distribué et l'architecture nouvelle.

## 4. Répartition de la charge

Le critère demande une charge répartie de manière équilibrée. Sur une ressource humaine
unique, l'équilibrage ne se fait pas entre personnes mais **entre le temps humain et le temps
délégué**, et c'est là qu'il a un sens réel.

- Le volume produit (11 647 lignes de source, 99 tests, 36 scénarios e2e, 23 pièces
  documentaires) excède ce qu'une personne seule produit en 16 journées. L'écart est absorbé
  par la délégation.
- Le temps humain s'est concentré sur ce qui ne se délègue pas : spécification, arbitrage,
  relecture, vérification. C'est l'inversion de charge que la méthode cherchait.
- **Limite honnête** : cet équilibrage n'a pas été mesuré. Il est constaté après coup, pas
  piloté par un relevé.

## 5. Prise en compte du handicap

Le critère l'exige explicitement, et la réponse honnête tient en deux temps.

**Dans l'équipe** : aucune situation de handicap n'est à accommoder — l'équipe est d'une
personne, qui n'en déclare pas. Prétendre le contraire serait inventer.

**Dans le produit, et c'est réel** : l'accessibilité a été traitée comme une exigence de
livraison, pas comme une option. Référentiel RGAA retenu et justifié, audit outillé conduit le
7 juillet, trois violations corrigées — focus clavier visible, contrastes portés au niveau AA,
en-tête manquant (#19, #25). Un utilisateur malvoyant ou naviguant au clavier est un
utilisateur cible de StockFlow, pas un cas limite.

**Ce qui serait mis en place si l'équipe s'étoffait** — et c'est prospectif, ce qui est dit
comme tel : la pratique déjà en vigueur y prépare mieux qu'une politique écrite. La
communication du projet est intégralement **écrite et asynchrone** (spécifications, issues
qualifiées, journal, messages de commit) ; aucune information critique ne transite par de
l'oral ou de l'implicite. C'est la condition qui rend un poste tenable pour une personne
sourde ou malentendante, pour quelqu'un dont le rythme de travail est aménagé, ou pour un
collaborateur en télétravail contraint. S'y ajouteraient un poste adaptable et des délais
d'évaluation aménagés — mais ces deux-là relèveraient d'une politique d'employeur, pas d'un
choix de développeur.
