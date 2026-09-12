# 24 — Planification : méthode, phases et planning (pièce 1, Bloc 3 — C3.1)

Compétence **éliminatoire**. État établi le 2026-08-31 par relevé direct de l'historique git
(`git log`, 116 commits toutes branches confondues — 114 sur `main` —, `23d86f5`) et
confrontation au budget et au plan de charge présentés au Bloc 1 — pas une reconstruction de
mémoire.

## 1. Le planning directeur : des dates imposées, non négociables

Le projet n'a jamais eu un planning libre. Il a eu un **calendrier de certification** dont les
dates sont fixées par le certificateur et connues dès le démarrage. Ce calendrier est le
planning directeur, et tout le reste s'y est ordonnancé.

| Jalon | Date imposée | Livrable | Statut |
|---|---|---|---|
| J1 — Bloc 1, oral de cadrage | 12 juin 2026 | Support de soutenance (Digiforma) | Tenu — validé |
| J2 — Bloc 2, dossier + code | 20-24 juillet 2026 | Dossier 27 p. + dépôt du code | Tenu |
| J3 — Bloc 4, dossier monitoring | 21 août 2026 | Dossier 14 p., 8 pièces | Tenu |
| J4 — Rapport d'activité | 31 août 2026 | Rapport 30 p. (Moodle) | Tenu |
| J5 — Bloc 3, dépôt puis oral | dépôt **15 septembre**, oral **18 septembre 2026** | Support déposé sur Digiforma, puis oral + démonstration du logiciel | Dépôt tenu, oral en cours |

**Cinq jalons, aucun report demandé.** Quatre étaient tenus au 31 août ; le cinquième est le
dépôt du 15 septembre, qui précède l'oral. Le jour de la soutenance, le compte est donc de
**cinq sur cinq**, la soutenance elle-même étant la recette et non un jalon du plan. C'est
l'indicateur de délai principal du projet, et il est vérifiable par un tiers.

## 2. Méthode retenue : rétroplanning à jalons fixes, exécution en flux tiré

*Résumé — la justification complète et les alternatives écartées sont en pièce 28.*

Le choix est dicté par une asymétrie : **les dates sont rigides, le contenu est négociable.**
Deux régimes de planification cohabitent donc, et c'est délibéré.

- **En amont — rétroplanning.** Chaque jalon est daté à l'avance ; on remonte le temps pour
  déterminer la dernière date acceptable de chaque lot amont. Bénéfice attendu : une date de
  dépôt ne peut pas glisser, donc c'est le périmètre qui absorbe l'aléa, jamais l'échéance.
- **En exécution — flux tiré (Kanban), WIP de 1.** Un lot borné et finissable par session,
  commencé seulement quand le précédent est fermé. Bénéfice attendu : sur une ressource
  unique, le multitâche est le principal facteur de dérive ; le limiter à un lot en cours
  supprime le coût de reprise de contexte.
- **Outil de planification** : rétroplanning à jalons pour le cadre, **GitHub Projects** (31
  des 32 issues) pour l'exécution, **`PROGRESS.md`** pour le journal chronologique. L'outil est
  compatible avec la méthode : un tableau Kanban est l'outil natif du flux tiré, là où un
  Gantt d'enchaînement serait faux sur un projet à une seule ressource — aucune tâche n'est
  jamais parallèle.

**Ce que la méthode n'est pas.** Ce n'est pas Scrum : il n'y a ni sprint fermé, ni rétrospective
d'équipe, ni vélocité, ni product owner distinct. Le Bloc 1 annonçait « 6 sprints de 2
semaines » ; l'exécution n'a pas suivi ce rythme (§4). Revendiquer Scrum aujourd'hui serait
faux et vérifiable comme tel dans l'historique.

## 3. Découpage en phases

La grille demande de visualiser les phases d'étude, de mesure, de conception, de réalisation
et de restitution. Elles existent, mais **elles se recouvrent** — c'est la conséquence assumée
d'un cycle itératif, pas un défaut de découpage.

| Phase | Période | Contenu | Trace vérifiable |
|---|---|---|---|
| **Étude** | mai — juin | Cadrage, analyse de la demande, audit de l'existant, veille technique et réglementaire, étude comparative des solutions | Support Bloc 1 (hors dépôt) |
| **Conception** | 7-10 mai | Modèle de données, architecture logicielle, prototype initial | 18 commits, ~11 000 insertions |
| **Réalisation** | 3-15 juillet | Lots auth, RLS, revue de sécurité, pannes & assignation, tests, OWASP + RGAA, PWA offline | 90 commits, 3 tags |
| **Mesure** | continue, juillet | Harnais de tests, cahier de recettes, audits RGAA et OWASP, couverture, supervision | 99 tests, 36 e2e, Sentry, sonde uptime |
| **Restitution** | juin — septembre | Les cinq jalons de certification | 8 commits de finition dossiers |

La phase de mesure n'est pas séquentielle : elle est intégrée à la réalisation (CI rejouée à chaque push,
tests exigés avant fermeture d'issue). C'est un choix — le contrôle qualité en fin de chaîne
sur un projet solo produit une dette qu'il n'y a personne pour absorber.

## 4. Écart entre le plan initial et l'exécution

Le Bloc 1 présentait un plan de charge de **25 j/h sur 6 sprints de 2 semaines**, soit trois
mois de production régulière. L'exécution réelle est différente et il faut le dire avant que
le jury ne le relève.

| | Planifié (Bloc 1) | Réalisé (relevé git) |
|---|---|---|
| Rythme | 6 sprints de 2 semaines, réguliers | 16 journées de production, en salves |
| Répartition | étalée sur 3 mois | mai : 3 j · juillet : 11 j · août : 2 j |
| Concentration | ~2 j/semaine | 9 des 16 journées en 2 semaines de juillet |

**Cause réelle** : la disponibilité n'était pas linéaire, et les jalons de certification ont
agi comme des forces de rappel — la production s'est massée dans les fenêtres précédant J2 et
J3. **Conséquence** : les échéances ont toutes été tenues, mais la régularité annoncée au
Bloc 1 ne l'a pas été.

**Ce que j'en retire, et qui est la vraie réponse à la question.** Le plan initial calquait un
rythme d'équipe salariée sur une réalité d'alternant. Un plan de charge crédible aurait dû
partir des fenêtres de disponibilité réelles et non d'une cadence théorique de sprints. C'est
la correction que j'apporterais à un cadrage équivalent aujourd'hui : planifier à partir de la
capacité constatée, pas de la capacité souhaitée.

## 5. Points de vigilance identifiés au fil du projet

Consolidés dans la pièce 31 (registre des points de vigilance). Les quatre principaux,
tous documentés dans le dépôt au moment où ils ont été constatés :

- **CI restée rouge 9 jours sans être vue** (#26) — défaut de dispositif d'alerte, corrigé par
  un badge de statut au README et une sonde de disponibilité.
- **Angle mort de recette mobile** — 36 tests e2e verts alors que le parcours mobile réel était
  cassé, découvert sur téléphone physique le 13 juillet.
- **Base de test partagée avec la production** — dette assumée, mitigée par convention de
  préfixe et sweep, jamais résolue par une infrastructure séparée.
- **Claims JWT auto-déclarés** — la RLS protège de l'oubli de contexte et de l'accès anonyme,
  pas d'une connexion applicative compromise. Limite documentée plutôt que surclamée.

## 6. Limite de cette pièce

Le relevé git mesure **les journées où du code a été produit**, pas la charge en heures. Le
cadrage du Bloc 1, la rédaction des dossiers et la veille ne laissent aucun commit. Aucun
relevé de temps n'a été tenu en continu sur ce projet : c'est une lacune de pilotage, elle est
assumée ici, et la recommandation qui en découle figure au tableau de bord.
