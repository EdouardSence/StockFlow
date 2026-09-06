# 30 — Management : styles, communication et analyse critique (pièce 9, Bloc 3 — C3.3.1)

Le référentiel nomme quatre styles managériaux — **directif, persuasif, participatif,
délégatif** — et demande qu'ils soient identifiés et décrits, que les outils de communication
soient présentés, et qu'une **analyse critique d'une posture managériale** soit conduite avec
des recommandations réalistes.

Cadrage rappelé une fois (pièce 25) : une ressource humaine unique, assistée d'agents de
développement auxquels des missions bornées sont déléguées. Les quatre styles ci-dessous
décrivent des postures réellement adoptées, chacune adossée à une trace vérifiable.

## 1. Les quatre styles, et où chacun s'applique

Le style n'a pas été choisi par tempérament mais **par maturité de la tâche** : plus le patron
d'exécution est établi et le résultat vérifiable mécaniquement, plus la latitude est grande.
C'est un leadership situationnel appliqué à une équipe d'un type nouveau.

| Style | Quand | Exemple réel | Trace |
|---|---|---|---|
| **Directif** | Enjeu de sécurité, effet irréversible, ou échec silencieux possible | Migrations de schéma en production, architecture RLS, gestion des secrets. Consigne précise, aucune latitude, vérification systématique en base | `CLAUDE.md` (règles permanentes), migrations 004-006 |
| **Persuasif** | La décision est prise, mais son exécution correcte suppose d'en comprendre la raison | La règle « toute anomalie devient une issue qualifiée **avant** correction » : imposée *et* expliquée, sinon elle est contournée dès qu'elle coûte du temps | 31 issues qualifiées avant correction |
| **Participatif** | Plusieurs options défendables, décision non délégable | Architecture RLS : `SET LOCAL` avec claims, Supabase Auth, ou rôle Postgres par connexion. Les options et leurs limites ont été produites par l'agent, l'arbitrage est resté humain | `09-securisation.md` |
| **Délégatif** | Patron établi, résultat vérifiable mécaniquement | Mise en conformité lint (13 → 0), génération de tests sur patron existant, assemblage documentaire | Lot Init, harnais de tests |

**La règle qui traverse les quatre** : quel que soit le style, la redevabilité reste humaine.
Une case de `PROGRESS.md` n'est cochée que si la vérification a été exécutée — build vert,
test passant, requête jouée — jamais sur déclaration de l'exécutant.

## 2. Outils de communication, et pourquoi ceux-là

Tous écrits, tous asynchrones, tous versionnés. Ce n'est pas une contrainte subie : c'est ce
qui rend le pilotage vérifiable par un tiers.

| Outil | Fonction | Équivalent en équipe humaine |
|---|---|---|
| `CLAUDE.md` | Règles permanentes du projet, lues à chaque session | Charte d'équipe / conventions |
| `PROGRESS.md` | Journal chronologique, **jamais réécrit** | Compte rendu de réunion |
| Issues GitHub | Qualification avant correction, fermeture avec résumé vérifié | Tickets |
| Spécifications `docs/superpowers/` | Le lot est écrit avant d'être exécuté | Spécification fonctionnelle |
| Commits conventionnels en français | Historique lisible et parsable, jamais réécrit | Traçabilité |

Deux propriétés méritent d'être soulignées à l'oral, parce qu'elles portent le critère
« outils collaboratifs intégrant le partage de ressources » : **tout vit dans le dépôt**, donc
tout est accessible à quiconque le clone ; et **rien n'est jamais réécrit**, donc l'historique
est une preuve et pas une reconstruction.

## 3. Analyse critique : l'incident CI de neuf jours

**La situation.** La chaîne d'intégration continue est restée en échec du 3 au 12 juillet sans
que personne s'en aperçoive. Les hooks locaux passaient, le développement continuait, les
lots se fermaient. Le contrôle existait ; le signal, non.

**Ce que ça dit de la posture.** C'est une défaillance de **style délégatif appliqué sans
dispositif de contrôle**. La CI avait été mise en place puis considérée comme acquise — c'est
exactement l'erreur du manager qui délègue une mission et suppose qu'un problème remonterait
tout seul. Sur une équipe, ce silence aurait été rompu par quelqu'un ; seul, rien ne le rompt.

**Le correctif, et ce qui compte dedans.** L'issue #26 a été qualifiée avant correction, la CI
réparée sans affaiblir la garde *fail-closed* — l'option facile aurait été de rendre l'étape
non bloquante. Mais la vraie mesure est **anti-récidive** : un badge de statut au README, puis
une sonde de disponibilité planifiée. Le principe tient en une phrase, et c'est la formule à
retenir pour l'oral : **un rouge doit se voir.**

## 4. Analyse critique : l'angle mort de la recette mobile

**La situation.** Trente-six scénarios de recette automatisés étaient au vert pendant que le
parcours mobile réel était inutilisable. Découvert le 13 juillet en ouvrant l'application sur
un téléphone physique — pas par un test.

**Ce que ça dit de la posture.** La recette avait été déléguée à l'outillage, et le critère
d'achèvement mesurait *l'exécution des fonctionnalités*, pas *l'usage réel*. Un critère
vérifiable mécaniquement peut être intégralement satisfait tout en étant à côté du sujet.

**Le correctif.** Passe de vérification consignée sur appareil réel, anomalies AN-3 à AN-6
qualifiées et corrigées (#28 à #32). La formule : **la recette doit suivre les usages réels,
pas seulement les fonctionnalités à leur livraison.**

## 5. Recommandations

Réalistes, réalisables, et déjà partiellement mises en œuvre :

1. **Tout contrôle automatique doit produire un signal visible.** Mis en œuvre — badge CI,
   sonde de disponibilité. C'est la correction la moins coûteuse et la plus rentable du projet.
2. **Le style délégatif exige une définition of done vérifiable mécaniquement.** Sans elle,
   revenir au persuasif : expliquer le critère avant de déléguer. Applicable tel quel à une
   équipe humaine junior.
3. **Adosser la recette à des parcours d'usage, pas à des listes de fonctionnalités.** Au
   moins un passage sur matériel réel avant chaque jalon.
4. **Tenir un relevé de temps par lot** (point V9, pièce 31). C'est ce qui
   manque pour piloter la charge autrement qu'au jugé.

## 6. Ce que ce mode de management a réellement changé

Le point à faire passer, si un seul devait rester : **la charge s'est déplacée de l'écriture
vers la spécification et le contrôle.** Écrire du code a cessé d'être le goulot ; définir
précisément ce qui doit être fait, puis vérifier que ça l'a été, est devenu le travail
principal.

C'est une compétence de management, pas de développement — et c'est la raison pour laquelle
cette expérience, malgré une équipe d'une personne, relève bien du Bloc 3. Les deux
défaillances analysées ci-dessus sont d'ailleurs toutes deux des défauts de **contrôle**,
jamais des défauts d'exécution.
