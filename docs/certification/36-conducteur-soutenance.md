# 36 — Conducteur de soutenance (pièce 12, Bloc 3)

Plan slide par slide, minuté. **25 slides, 28 min 25 nominal**, compressible à 26 min 45 par les
cinq slides marquées ⤓. Le règlement accorde 30 min de présentation et 15 min d'échanges.

**Ce conducteur suit `StockFlow-Bloc3-captures.pptx`, la version à 25 slides** — celle qui porte
en position 8 les captures du board et des exécutions de la chaîne d'intégration. La version
initiale à 24 slides est conservée telle quelle ; sur celle-là, tous les numéros à partir de la
huitième sont décalés d'un cran vers le bas.

Le fil : *j'ai organisé → j'ai suivi → voici le résultat → j'ai décidé → j'ai piloté une équipe
→ j'ai rendu compte.* La démonstration est placée en position 4, à 11 minutes du début : assez
tôt pour ne pas absorber les retards accumulés, et l'infrastructure qu'elle montre amène
directement le cas d'arbitrage qui la suit.

| Bloc | Slides | Durée | Cumul |
|---|---|---|---|
| Ouverture | 1-2 | 1:30 | 1:30 |
| **C3.1** — planifier (éliminatoire) | 3-6 | 5:15 | 6:45 |
| **C3.2.1** — piloter (éliminatoire) | 7-11 | 4:30 | 11:15 |
| **C3.4.2** — démonstration (éliminatoire) | 12 | 6:00 | 17:15 |
| C3.2.2 — arbitrer | 13-15 | 3:00 | 20:15 |
| C3.3.1 — manager | 16-19 | 3:40 | 23:55 |
| C3.3.2 — compétences | 20-21 | 1:30 | 25:25 |
| C3.4.1 — rendre compte | 22-23 | 2:00 | 27:25 |
| Clôture | 24-25 | 1:00 | 28:25 |

---

## OUVERTURE

### Slide 1 — Titre · 0:15 · cumul 0:15

**Écran** : StockFlow — Pilotage d'un projet de développement logiciel · BC03 · Édouard Sence ·
18 septembre 2026.

**À dire** : se nommer, nommer le bloc, annoncer la durée et le moment de la démonstration.
« Trente minutes, avec une démonstration du logiciel en direct au bout de la première dizaine. »

---

### Slide 2 — Le projet et la règle du jeu · 1:15 · cumul 1:30

**Écran** : trois blocs — le produit en une phrase · les chiffres · le fil de la présentation.

**À dire**
- StockFlow : gestion de parc informatique pour TPE/PME de 10 à 100 postes. « Entre l'Excel et
  le GLPI » : la simplicité du premier, la structure du second.
- Le projet est **livré et déployé** : 116 commits, 14 lots, 3 versions taguées, **cinq jalons de
  certification tenus sur cinq** — le cinquième étant le dépôt de ce support, le 15 septembre.
  *Précision si la question vient : relevé du 31 août — 116 toutes branches, 114 sur `main`.
  Le compteur a avancé depuis : toujours dire « au 31 août ».*
- **La phrase de cadrage, dite une fois** : « Ce projet est mené par une seule ressource
  humaine, assistée d'agents de développement à qui je délègue des missions bornées. L'équipe
  est donc d'une nature différente d'une équipe salariée, mais les objets du pilotage sont les
  mêmes : affecter, déléguer, contrôler, arbitrer. »
- Annoncer le fil en six temps.

**Piège** : ne jamais y revenir. Reparler de la nature de l'équipe plus tard transforme un
cadrage assumé en justification.

**Ce qui a été coupé pour tenir 1:15** : le détail du relevé git (garder « 116 commits au
31 août », laisser la ventilation pour les questions) et l'énoncé du fil en six temps, réduit à
« six temps, la démonstration au quatrième ». La phrase de cadrage sur l'équipe, elle, ne se
coupe pas.

---

## C3.1 — PLANIFIER L'EXÉCUTION · ÉLIMINATOIRE

### Slide 3 — Méthodologie · 1:30 · cumul 3:00

**Écran** : deux colonnes — *Cadre : rétroplanning à jalons fixes* / *Exécution : flux tiré,
WIP 1*. En bas : les trois méthodes écartées avec une raison chacune.

**À dire**
- La contrainte qui détermine tout : **les dates sont imposées, le périmètre est négociable.**
  Cinq jalons fixés par le certificateur, connus dès mai, non déplaçables.
- Donc deux régimes : rétroplanning descendant pour le cadre, flux tiré pour l'exécution.
- **WIP de 1** : sur une ressource unique, le multitâche est le premier facteur de dérive. Un
  lot borné et finissable par session, commencé quand le précédent est fermé.
- Écarté : **Scrum** (suppose une équipe, une cadence, un engagement de contenu — aucune des
  trois n'existe ici), **cycle en V** (aurait figé des spécifications qui n'étaient pas
  décidables sur le papier), **Kanban sans jalons** (ignorerait la contrainte la plus dure).

**Piège** : ne pas revendiquer Scrum. Le support du Bloc 1 annonçait six sprints de deux
semaines ; l'historique git le démentirait en trente secondes.

---

### Slide 4 — Rétroplanning et phases · 1:45 · cumul 4:45

**Écran** : le diagramme — cinq phases, cinq jalons — les trois versions taguées repérées sur
l'axe, et en bas le bandeau « 16 journées de production, dont 9 en deux semaines de juillet ».

**À dire**
- Le planning directeur, ce sont les cinq jalons. Tout le reste s'y ordonnance.
- Les cinq phases exigées — étude, conception, réalisation, mesure, restitution — **se
  recouvrent**, et c'est assumé : la mesure est intégrée à la réalisation, pas placée en fin de
  chaîne. Sur un projet solo, un contrôle qualité en bout de chaîne produit une dette qu'il n'y
  a personne pour absorber.
- **Prendre les devants sur le bandeau du bas** : « Le cadrage annonçait un rythme régulier de
  six sprints. La réalité, ce sont seize journées de production dont neuf en deux semaines de
  juillet. Je suis alternant, mes fenêtres de disponibilité ne sont pas linéaires, et les jalons
  ont agi comme des forces de rappel. Les échéances ont toutes été tenues ; la régularité
  annoncée, non. »
- La leçon : **un plan de charge crédible part de la capacité constatée, pas de la capacité
  souhaitée.**
- *Les trois repères orange sur l'axe sont les versions taguées : v0.2.0 et v0.3.0 les 3 et
  4 juillet, v0.4.0 le 13. Ne pas les commenter — ils servent si on demande à quel rythme le
  logiciel a été livré.*

**Piège** : ne pas laisser le jury découvrir la concentration. Le dire soi-même désarme la
question.

---

### Slide 5 — Affectation des missions et RACI · 1:15 · cumul 6:00

**Écran** : la matrice RACI, 12 activités × 5 rôles (la pièce 25 en détaille 14).

**À dire**
- Cinq rôles, trois portés par la même personne. Les distinguer n'est pas un artifice : ils ont
  des responsabilités différentes et, plusieurs fois, des intérêts divergents — le responsable
  de projet a tranché contre l'envie du développeur.
- **La colonne qui porte l'argument** : l'agent est R partout où le patron est établi et le
  résultat vérifiable mécaniquement. Il n'est **jamais A** — la redevabilité ne se délègue pas à
  une ressource qui ne peut pas répondre devant un client.
- Une exception sur du code : sécurité et modèle de menace, le R reste au développeur.
- **Le client est un profil-type** : il est consulté (C) au cadrage et à la recette, jamais exécutant.
  La recette réelle — sur téléphone physique, le 13 juillet — c'est le développeur qui l'a faite.
- Handicap : rien à accommoder dans une équipe d'une personne. En revanche le **produit** est
  accessible — référentiel RGAA, audit outillé, trois violations corrigées. Et la communication
  du projet est intégralement écrite et asynchrone, ce qui est la condition qui rendrait un
  poste tenable pour plusieurs situations de handicap.

---

### Slide 6 ⤓ — Ressources et budget · 0:45 · cumul 6:45

**Écran** : humaines / matérielles / financières, et le total de 14 536 € HT.

**À dire**
- Humaines : un alternant non dédié, plus des agents. **Le point de rupture : ressource unique,
  aucune redondance.** Une indisponibilité de deux semaines en juillet faisait manquer le jalon
  du Bloc 2. Aucune mitigation n'existait.
- Matérielles : le téléphone réel n'est pas un confort — c'est son absence dans la recette qui
  a laissé passer un parcours mobile cassé.
- Financières : 14 536 € HT au budget, dont 12 500 de développement.
- **Si on demande la localisation** : données en UE (base en Irlande, erreurs en Allemagne), mais les
  fonctions Vercel tournent dans la région par défaut, aux États-Unis — écart relevé le 11/09 (V14),
  correction d'une ligne différée pour ne pas redéployer avant la démo.

**Compression** : couper le détail matériel, garder le point de rupture et le total.

---

## C3.2.1 — PILOTER L'AVANCEMENT · ÉLIMINATOIRE

### Slide 7 — L'outil de suivi · 1:00 · cumul 7:45

**Écran** : trois outils, un rôle chacun.

**À dire**
- GitHub Projects (31 des 32 issues) pour la file de travail ; `PROGRESS.md`, 510 lignes, pour le
  journal ; la CI GitHub Actions, rejouée à chaque push.
- L'outil est cohérent avec la méthode : **un tableau Kanban est l'outil natif du flux tiré.**
- Deux règles de tenue qui font la valeur du dispositif : une case n'est cochée que si la
  vérification a été **exécutée** — build vert, test passant, requête jouée ; et le journal est
  **versionné** : toute modification, même d'une entrée passée, reste visible dans git — c'est ce
  qui le rend utilisable comme preuve.
- **Ne jamais dire que la CI bloque** : `main` n'est pas protégée, la CI signale. C'est exactement la
  leçon de l'incident des neuf jours (slide 19).
- *Ne pas décrire les outils en détail : la slide suivante les montre. Garder les deux règles de
  tenue ici, la preuve arrive juste après.*
- *Le board (`projects/3`) est **public** depuis le 12/09 : l'avoir aussi ouvert dans un onglet,
  vue tableau — projeté, le détail de la capture reste petit.*

---

### Slide 8 — Ces outils, tels qu'un tiers les voit · 0:20 · cumul 8:05

**Écran** : les deux captures — le board `projects/3` en vue tableau, les runs CI filtrés du 3 au
13 juillet.

**À dire**, vingt secondes, et on enchaîne. **Cette slide se montre, elle ne se raconte pas.**
- « Les deux captures sont prises sans être connecté : la barre d'inscription de GitHub est
  visible en haut. Vous pouvez les refaire. »
- À gauche, les quatre fiches en **« Accepté (risque documenté) »** : les limites
  d'authentification, laissées ouvertes exprès pour rester visibles. **Le board et le dossier
  disent la même chose.**
- ⚠︎ **Ne pas citer « V11, V12, V13 » devant cet écran.** Le tableau de la slide 11 porte les dix
  points de pilotage, V1 à V10 ; ces trois limites-là sont au dossier, pièce 31, pas à l'écran.
  Nommer une référence que le jury ne trouve pas, c'est exactement l'incohérence transversale que
  le Bloc 1 avait sanctionnée. Si la question vient : « elles sont détaillées au registre du
  dossier, sous V11 à V13. »
- À droite, le rouge du 4 au 12 juillet et le vert qui reprend à `fix(ci)` #24 — l'incident
  repris en slide 19.

**Si on demande pourquoi 31 fiches et non 32** : l'issue #3, ouverte et fermée en trois minutes
le 2 juillet, est antérieure à la création du board. Mieux vaut le dire avant qu'on ne compte.

**Si on demande le rouge des 4 et 6 juillet** : leurs exécutions sont en page 2 de la liste,
la capture ne montre que la première. Le filtre de dates est visible, la liste est publique.

---

### Slide 9 — Tableau de bord · 1:30 · cumul 9:35

**Écran** : les cinq tuiles — 5/5 jalons, 27/32 issues fermées (14 lots · 3 versions), 99 tests,
36 e2e (36/36 au 13/07), 44,8 % de couverture.

**À dire**
- Les cinq dimensions exigées : avancement, délais, coûts, risques, ressources humaines.
- **L'indicateur de délai principal, c'est le respect des jalons : cinq sur cinq, aucun report
  demandé** — le cinquième étant le dépôt du 15 septembre, tenu avant cet oral. La slide affiche
  bien `5/5`. Ce sont les seules dates que le projet ne pouvait pas déplacer.
- Qualité en appui : 99 tests, 36 scénarios de recette, couverture globale 44,8 %.
- **Assumer la couverture** : élevée sur le noyau critique — 92 % sur l'authentification —
  faible ailleurs. C'est un choix : couvrir le domaine et la sécurité plutôt que d'atteindre un
  pourcentage.
- Ces chiffres ont été **réexécutés le 31 août**, pas recopiés d'un dossier antérieur, puis
  **revérifiés le 11 septembre**.

**Si la question vient sur les domaines Effect** : 100 %, et c'est montrable —
`bunx vitest run --coverage` affiche `equipment-domain.ts` et `incidents-domain.ts` à 100 sur
les quatre colonnes. Le dire sans en faire un argument : le choix est de couvrir le noyau, pas
d'afficher un pourcentage.

---

### Slide 10 — Coûts : l'écart et ce qu'il cache · 1:00 · cumul 10:35

**Écran** : tableau budget / dépensé, et le TCO à 45 $/mois.

**À dire**
- 140 € d'infrastructure budgétés, 0 € dépensé — paliers gratuits. Contingence non consommée.
- **« Un coût nul n'est pas une économie, c'est un report. »** Le palier gratuit met le projet
  en pause après une semaine d'inactivité. C'est arrivé, le journal en garde la trace. Chez un
  client, ça s'appelle une indisponibilité.
- Le coût de possession réel : 45 $/mois, de l'ordre de 500 $/an — environ un dixième du gain
  récurrent estimé. **Plus la maintenance, qui reste à provisionner.**
- Charge : 25 j/h budgétés, 10 à 15 réalisés à périmètre équivalent. **La conclusion n'est pas
  « j'ai fait deux fois plus vite »**, c'est que le mode de production a déplacé la charge de
  l'écriture vers la spécification et le contrôle, et que l'estimation initiale ne modélisait
  pas ce déplacement.

**Piège** : ne jamais dire « payback < 4 mois ». Brut : ≈ 3,2 ans (14 536 € / 4 500 €). Net du coût
d'infrastructure : ≈ 3,6 ans, maintenance non comptée. Donner les deux si la question vient.

---

### Slide 11 ⤓ — Points de vigilance · 0:40 · cumul 11:15

**Écran** : le registre des dix points — V5 et V10 clos, V9 seul ouvert.

**À dire**
- Un point de vigilance n'est pas un bug : c'est une limite connue, laissée en l'état
  délibérément, avec sa conséquence.
- **Sept acceptés, deux clos en septembre, un seul ouvert** — le dire dans cet ordre : c'est ce
  qui montre un registre vivant plutôt qu'un tableau décoratif. **La différence entre un risque
  accepté et un risque oublié se voit exactement à l'existence de ce tableau.**
- **Un seul** reste ouvert, le relevé de temps. Deux ont été clos en septembre : les
  dépendances non figées (9/09), et l'écart de couverture relevé le 31 août — qui s'est révélé un
  **artefact de mesure par agent** : Vitest masque les fichiers couverts à 100 % quand il tourne
  sous un agent IA ; dans un terminal humain, les domaines ont toujours affiché 100 %. « C'est
  exactement pour ça que je vérifie ce qu'un agent rapporte. »

**Si on ouvre le suivi du dépôt** — cinq issues ouvertes, et c'est voulu : deux sont au tableau
(#7, #24), les trois autres sont des limites de conception de l'authentification, arbitrées et
documentées en `09-securisation.md` (V11 à V13, pièce 31). « Je les laisse ouvertes pour que la
limite reste visible, pas archivée. Aucune anomalie fonctionnelle n'est ouverte. »

**Compression** : ne montrer que les trois ouverts et la phrase sur le risque accepté.

---

## C3.4.2 — DÉMONSTRATION · ÉLIMINATOIRE

### Slide 12 — Démonstration du logiciel · 6:00 · cumul 17:15

**Écran** : une slide d'accroche 15 s (« le cycle de vie d'un poste, de son entrée dans le parc
à sa panne sur le terrain »), puis on bascule sur l'application.

**Vocabulaire client, pas technique** : « étiquette » et non QR encodé ; « la panne part quand
le réseau revient » et non la file de synchronisation se vide ; « le technicien ne voit pas ces
boutons » et non RBAC côté serveur.

| # | Durée | Séquence | La phrase |
|---|---|---|---|
| 1 | 0:30 | Connexion admin → accueil | « Voilà ce que voit le responsable le lundi matin : tout le parc, et ce qui ne va pas. » |
| 2 | 1:00 | Créer un équipement → étiquette générée | « J'enregistre le poste une fois. L'étiquette est produite là, je l'imprime, je la colle. » |
| 3 | 1:30 | Scan de l'étiquette papier au téléphone | « Sur le terrain, je vise l'étiquette. Ni numéro de série à chercher, ni fichier à ouvrir. » |
| 4 | 1:30 | Déclarer une panne **réseau coupé** → bandeau → retour réseau → l'incident part | « Dans un local sans réseau, la panne se déclare quand même. Rien n'est perdu. » |
| 5 | 1:00 | Retour admin : incident reçu, qualifié, cycle de vie | « Le responsable décide. L'équipement ne se met pas en panne tout seul : c'est lui qui qualifie. » |
| 6 | 0:30 | Bascule compte technicien | « Même application, même adresse, mais un technicien ne voit ni la gestion des comptes ni les actions d'administration. » |

**Fermer la démonstration par une question**, c'est le critère : *« Sur ce périmètre, est-ce que
le besoin que nous avions cadré en mai est couvert ? »* C'est ce qui transforme une
démonstration en recette.

**Plan de repli** : production HS → basculer sur l'instance locale déjà ouverte, le dire
simplement, enchaîner. Deux tentatives de rechargement maximum, pas plus.

---

## C3.2.2 — ARBITRER

### Slide 13 — L'écart constaté · 0:45 · cumul 18:00

**Écran** : deux blocs face à face — *annoncé au cadrage : Scalingo* / *en production depuis
mai : Vercel + Supabase*.

**À dire** — la transition est offerte par la démo : « L'infrastructure que vous venez de voir
tourner n'est pas celle que j'avais annoncée. »
- Le cadrage promettait un hébergeur français à faible empreinte carbone, sur deux arguments :
  souveraineté et impact environnemental.
- L'écart est constaté à trois sessions de la fin. **Le problème n'est pas technique, il est de
  conformité à un engagement pris devant le commanditaire.**

---

### Slide 14 — Le logigramme · 1:15 · cumul 19:15

**Écran** : le logigramme — quatre questions, deux options éliminées, la décision.

**À dire**, en suivant les branches
- La migration apporte-t-elle une valeur fonctionnelle ? Non — même application, mêmes
  fonctions.
- Le coût est-il tenable à trois sessions de la fin ? Non : réécriture du pipeline, migration
  des données, revalidation complète. **Option A écartée.**
- L'argument de souveraineté survit-il à une migration partielle ? Non : l'application d'un
  côté, la base de l'autre, c'est presque le même coût pour vider l'argument de sa substance.
  **Option B écartée** — et c'est la plus tentante, donc celle qu'il faut exposer.
- Le code est-il verrouillé sur le fournisseur ? Non : preset `node-server`, applicatif
  inchangé. **La décision est réversible.**

---

### Slide 15 — La décision et ce qu'elle coûte · 1:00 · cumul 20:15

**Écran** : la décision, ses trois conditions, et la leçon.

**À dire**
- Rester, en qualifiant l'écart. Trois conditions l'ont rendu acceptable : réversible (annexe de
  portabilité en cinq étapes documentées), tracée (issue #21, manuel de déploiement), bornée (vaut
  pour le MVP ; si la souveraineté devient contractuelle, l'option A redevient la bonne et son
  chemin est déjà documenté).
- **L'argument environnemental n'est pas tenu**, et je ne le recycle pas en avantage.
- « C'est le propre de l'arbitrage de fin de projet : **on ne choisit pas entre une bonne et une
  mauvaise option, on choisit laquelle des deux pertes on accepte.** »
- La vraie leçon est en amont : l'infrastructure était posée en mai, le support du Bloc 1
  annonçait autre chose, et la contradiction n'a pas été relevée pendant deux mois. **Défaut de
  contrôle, pas de décision.**

---

## C3.3.1 — PILOTER L'ÉQUIPE

### Slide 16 — Affecter et déléguer · 1:00 · cumul 21:15

**Écran** : la règle d'affectation en trois principes.

**À dire**
- L'affectation suit **la maturité de la tâche, pas la commodité**. Patron établi et résultat
  vérifiable mécaniquement → délégué. Tâche exploratoire, ou dont l'échec serait silencieux →
  gardée.
- Trois catégories ne se délèguent pas, et l'agent a consigne permanente de s'arrêter et de
  demander : décisions produit, architecture nouvelle, sécurité.
- Le choix de modèle suit la même logique : modèle standard pour la configuration et la
  documentation, raisonnement étendu pour un premier usage de patron, modèle le plus capable
  pour la sécurité et l'architecture.
- Équilibrage de charge : il ne se fait pas entre personnes mais **entre le temps humain et le
  temps délégué**. Le volume produit excède ce qu'une personne seule produit en seize journées ;
  l'écart est absorbé par la délégation. Limite honnête : **constaté après coup, pas piloté.**

---

### Slide 17 — Les quatre styles · 1:00 · cumul 22:15

**Écran** : les quatre styles nommés par le référentiel, un exemple réel chacun.

**À dire** — utiliser les quatre mots du référentiel, le jury les attend
- **Directif** : migrations en production, architecture RLS, secrets. Consigne précise, aucune
  latitude, vérification en base.
- **Persuasif** : la règle « toute anomalie devient une issue qualifiée *avant* correction » —
  imposée **et** expliquée, sinon elle est contournée dès qu'elle coûte du temps. 27 issues fermées.
- **Participatif** : architecture RLS — l'exécutant produit les options et leurs limites,
  l'arbitrage reste humain.
- **Délégatif** : conformité lint 13 → 0, génération de tests sur patron, assemblage
  documentaire.
- La règle transverse : **quel que soit le style, la redevabilité reste humaine.**

**Ce qui a été coupé pour tenir 1:00** : un exemple par style, pas deux, et la justification du
persuasif ramenée à sa moitié — « imposée et expliquée, sinon contournée ». Les quatre mots du
référentiel doivent être prononcés, c'est la seule chose qui ne se coupe pas.

---

### Slide 18 ⤓ — Outils de communication · 0:40 · cumul 22:55

**Écran** : les cinq outils et leur équivalent en équipe humaine.

**À dire**
- `CLAUDE.md` = charte d'équipe. `PROGRESS.md` = compte rendu de réunion. Issues = tickets.
  Spécifications écrites avant exécution. Commits conventionnels = traçabilité.
- Deux propriétés qui portent le critère « outils collaboratifs intégrant le partage de
  ressources » : **tout vit dans le dépôt**, donc accessible à quiconque le clone ; **tout est versionné**, donc l'historique est une preuve, pas une reconstruction.

**Compression** : garder les deux propriétés, citer deux outils au lieu de cinq.

---

### Slide 19 — Analyse critique · 1:00 · cumul 23:55

**Écran** : les deux défaillances, la formule de chacune.

**À dire**
- **La CI est restée rouge neuf jours sans que personne la voie.** C'est une défaillance de
  style délégatif appliqué sans dispositif de contrôle — l'erreur du manager qui délègue et
  suppose qu'un problème remonterait tout seul. Sur une équipe, quelqu'un rompt le silence ;
  seul, rien ne le rompt.
- Le correctif qui compte n'est pas la réparation, c'est la mesure anti-récidive : badge de
  statut au README, puis sonde de disponibilité. **« Un rouge doit se voir. »**
- Même schéma pour le second : 36 scénarios au vert pendant que le parcours mobile réel était
  cassé. Le critère d'achèvement était vérifiable mécaniquement, il ne mesurait pas le bon
  usage. **« La recette doit suivre les usages réels, pas seulement les fonctionnalités à leur
  livraison. »**
- **Les deux défaillances du projet sont des défauts de contrôle, jamais d'exécution.**

---

## C3.3.2 — COMPÉTENCES

### Slide 20 — Grille de compétences · 0:40 · cumul 24:35

**Écran** : la grille à deux axes — *niveau atteint* (toutes expériences confondues) et *apport
de StockFlow*, avec la ligne rouge à 1 en évidence.

**À dire**
- **Une compétence se mesure sur une personne, pas sur un projet.** D'où deux colonnes : le
  niveau atteint, alternance comprise ; et ce que *ce projet précis* a fait progresser.
- Quatre premières fois, toutes à apport **total** : React/TanStack, RLS Postgres, Effect, PWA
  offline. Trois compétences à apport **nul** viennent exclusivement de l'entreprise : Java /
  Spring Boot, intervention dans un code ancien, relation client et leadership technique.
- **Un apport nul n'est pas une lacune** : c'est un projet qui n'était pas le lieu de cette
  progression-là. StockFlow et l'alternance ont développé des compétences **quasi disjointes** —
  le projet de certification n'est pas une redite de l'expérience professionnelle.
- Ce qui a le plus progressé n'était pas prévu : **piloter une ressource déléguée**, compétence
  qui n'existait pas au cadrage.
- **Une seule vraie lacune, à 1 sur 4 : mesurer l'effet de son propre travail.** Et deux
  contextes indépendants la désignent — c'est la slide suivante.

**Piège** : ne pas présenter les lignes à apport nul comme des faiblesses. Elles sont à 3 ;
c'est la colonne de droite qui est à zéro, pas le niveau.

**Ce qui a été coupé pour tenir 0:40** : l'énumération des quatre premières fois et des trois
apports nuls — la grille est à l'écran, le jury la lit. Garder trois choses : les deux colonnes
et pourquoi elles diffèrent, « StockFlow et l'alternance ont développé des compétences quasi
disjointes », et la lacune à 1 sur 4 qui amène la slide suivante.

---

### Slide 21 ⤓ — Plan de développement et renforts · 0:50 · cumul 25:25

**Écran** : l'encadré rouge du défaut commun, le plan en cinq lignes, les trois renforts.

**À dire**
- **Le défaut que deux contextes désignent** : en entreprise, une campagne de performance
  conduite sans relever aucune mesure avant ni après ; sur StockFlow, aucun relevé de charge et
  une estimation reconstruite après coup. Le rapport d'activité et l'audit du projet ont été
  écrits séparément, à trois semaines d'intervalle, sans confrontation. **Un défaut qui apparaît
  deux fois dans deux contextes sans rapport n'est pas un accident : c'est un trait de pratique.**
- Le plan, cinq lignes : **1 — mesurer l'effet de son travail** (indicateur avant/après, relevé
  de temps par lot ; immédiat) · **2 — couverture de tests et CI** sur le produit historique
  (6 mois) · **3 — rallier plutôt que convaincre** (12 mois) · **4 — revue de code argumentée**
  (6 mois) · **5 — accessibilité, certification Opquast** (12 mois).
- **Les trois premières ne demandent aucun budget de formation** — ce sont des changements de
  pratique. C'est délibéré : un plan dont chaque ligne suppose une formation payée est un plan
  qu'on n'exécute pas.
- Renforts si le projet passait à l'échelle : **un second développeur** (le point de rupture),
  **un profil UX** (l'angle mort de la recette mobile est aussi un angle mort de conception),
  **un profil avant-vente**.
- **Boucle à faire remarquer** : ce sont exactement les deux faiblesses que le SWOT du cadrage
  annonçait — « équipe solo » et « pas d'UX designer dédié ». Elles se sont vérifiées.

**Compression** : garder l'encadré rouge, les trois renforts et la boucle avec le SWOT.

---

## C3.4.1 — RENDRE COMPTE

### Slide 22 — Points de validation et retour obtenu · 1:15 · cumul 26:40

**Écran** : les cinq points de validation, et les quatre remarques du retour PV1 avec leur suite.

**À dire**
- Cinq points de validation fixés à l'avance : quatre tenus, le cinquième est aujourd'hui. **Seul
  PV1 a produit un retour** — le dire, plutôt que de présenter les suivants comme des validations.
- **Dire le cadre une seule fois, sans détour** : « Le commanditaire de StockFlow est un
  profil-type construit au cadrage, pas une entreprise cliente — c'est la modalité que le
  règlement prévoit pour un projet de formation. Ce qui a réellement tenu ce rôle, c'est le jury
  du Bloc 1, qui m'a fait un retour critique que j'ai traité comme un retour client. »
- Les quatre remarques et leurs suites : le TCO manquant → chiffré et sourcé ; structurer par
  nature → ce support l'est ; une incohérence transversale relevée → un audit de cohérence
  s'exécute désormais avant chaque dépôt, et il a produit des corrections réelles ; sourcer
  plutôt qu'affirmer → **les priorisations de ce projet sont des décisions de porteur de projet
  appliquées à un profil-type, défendables par le raisonnement, pas par une source client.**
- Le format des comptes rendus : cinq rubriques, et la plus utile est celle qu'on est le plus
  tenté d'omettre — **« ce qui a changé par rapport à l'annoncé ».**

**Si on relève le RBAC passé de trois rôles à deux** — c'est l'incohérence que le jury du Bloc 1
avait signalée, elle peut revenir. La réponse est une décision de périmètre, pas un oubli :
« Le cadrage prévoyait un troisième profil, en consultation seule. Aucun usage ne le justifiait
dans un parc de dix à cent postes, et chaque profil supplémentaire ajoute une surface à tester
et à sécuriser. Je l'ai retiré, c'est écrit au compte rendu de livraison, et il est
réintroductible sans refonte. » **Ne pas dire « c'est resté à deux » comme un constat** : c'est
un arbitrage, il se présente comme tel.

---

### Slide 23 ⤓ — Indicateurs de satisfaction · 0:45 · cumul 27:25

**Écran** : les quatre indicateurs, tous marqués « cible, non mesuré ».

**À dire**
- Définis au cadrage : SUS ≥ 80, time-to-value < 1 jour, taux d'activation du parc, −50 % de
  temps d'inventaire.
- **Aucun n'a été mesuré, et la raison se dit sans détour : mesurer une satisfaction suppose des
  utilisateurs, et le projet n'a pas eu de pilote client.**
- Ce qui a été mesuré relève de la conformité, pas de la satisfaction : 36 recettes sur 36 au
  13 juillet, 99 tests verts, l'audit RGAA outillé — trois violations corrigées — et la revue
  OWASP Top 10. **Confondre les deux serait exactement l'affirmation surclamée que le retour du
  Bloc 1 sanctionnait.**

**Compression** : citer deux indicateurs au lieu de quatre.

---

## CLÔTURE

### Slide 24 — Synthèse · 1:00 · cumul 28:25

**Écran** : six affirmations, une par compétence, chacune adossée à une preuve.

**À dire** — ne pas résumer le contenu, énoncer ce que le projet démontre
1. Un calendrier imposé tenu : cinq jalons sur cinq, aucun report.
2. Un pilotage instrumenté : trois outils, cinq dimensions au tableau de bord, chiffres
   réexécutés avant restitution.
3. Un logiciel qui tourne, que vous venez de voir.
4. Des arbitrages tracés, y compris celui qui coûte un argument de cadrage.
5. Un management adossé à quatre styles et à deux autocritiques documentées.
6. Une compétence acquise qui n'était pas prévue, et deux qui manquent, nommées.

Fermer sur : **« Les deux défaillances de ce projet sont des défauts de contrôle, pas
d'exécution. C'est ce que j'en retiens comme chef de projet. »**

---

### Slide 25 — Questions · cumul 28:25 → 15 min d'échanges

**Écran** : Q&R, coordonnées du dépôt et de la production, cinq points clés.

**Posture Q/R** : reformuler la question → donner le choix fait → pourquoi il colle à la
contrainte du projet → reconnaître honnêtement l'alternative. Un « je n'ai pas tranché ce
point » assumé vaut mieux qu'une réponse inventée.

### La question qu'il faut attendre : « région US » et le RGPD

La slide 6 affiche **« Supabase · Sentry en UE · Vercel : région US »**. C'est honnête, et ça
ouvre une porte que le jury peut pousser — le Bloc 1 annonçait l'hébergement UE comme mitigation
RGPD, et l'assignation d'un équipement à une personne est une donnée nominative.

**Ne pas répondre « la base est en Europe ».** C'est vrai et c'est une esquive : les données
seraient au repos en Irlande, mais les fonctions applicatives les traitent à Washington, donc
elles traversent l'Atlantique **à chaque requête**. Dire l'un sans l'autre, c'est se faire
reprendre sur le second.

**La réponse, en trois temps :**
1. **Le fait, entier.** « Les données au repos sont en Irlande, chez Supabase. Mais le rendu
   serveur et les fonctions applicatives tournent dans la région Vercel par défaut, aux
   États-Unis. Les données nominatives — nom, courriel, qui détient quel poste — y transitent et
   y sont traitées à chaque requête. C'est un transfert hors UE, au sens du chapitre V. »
2. **Ce que ça vaut aujourd'hui.** Le transfert repose sur les clauses contractuelles types du
   fournisseur, pas sur un choix d'architecture : personne ne l'a décidé, c'est la valeur par
   défaut qui s'est appliquée. **C'est un défaut de contrôle, le même que les deux autres du
   projet** — et c'est pour ça qu'il est au registre plutôt que caché.
3. **Le correctif, chiffré.** Une ligne dans `vercel.json` — `"regions": ["dub1"]`, Dublin — et
   un redéploiement. Différé volontairement : on ne touche pas à la production dans la semaine
   d'une démonstration. Prévu juste après cet oral.

**Si on demande pourquoi ce n'est pas corrigé si c'est une ligne** : « Parce qu'une ligne qui
redéploie la production reste un changement de production. La règle du projet est de ne pas en
faire à la veille d'une échéance ferme. C'est le même arbitrage que pour l'hébergeur, et il est
tracé au même endroit. »

---

## Les interdits, reconduits du Bloc 1

- Jamais « payback < 4 mois » → brut ≈ 3,2 ans, net d'infrastructure ≈ 3,6 ans, puis gain récurrent.
- Jamais « COCOMO » → décomposition fonctionnelle pondérée.
- Jamais SUS ou OWASP présentés comme **prouvés** → visés, mesurés à M+3.
- Jamais une fausse équipe, ni un client rencontré qui ne l'a pas été.
- Jamais `equipment.type` avec `laptop` ou `phone` → quatre valeurs : `pc`, `screen`,
  `printer`, `other`.
- « 100 % sur les domaines Effect » : **exact et montrable depuis le 11/09** — mais jamais en
  argument de tête. La couverture qui se défend, c'est 44,8 % global, noyau critique couvert.
- Ne pas ressortir les chiffres non sourcés du cadrage (~5 j/an de saisie, 70 % de
  sous-utilisation). Le Bloc 3 n'en a pas besoin. Si on les demande : **hypothèses de
  dimensionnement, pas des mesures.**

## Calibrage

28 min 25 nominal à 135 mots/minute ≈ **3 800 mots de script**. Les cinq slides ⤓ libèrent
1 min 40 si la démonstration déborde — et elle débordera. Répéter **deux fois à voix haute,
chronomètre en main, dont au moins une fois avec la démonstration réelle sur le téléphone**, pas
en la mimant.
