# 27 — Dispositif de démonstration (pièce 4, Bloc 3 — C3.4.2)

Compétence **éliminatoire**. La grille attend un logiciel *utilisable*, une démonstration
*reprenant les fonctionnalités attendues*, un *vocabulaire adapté à une présentation client*,
et une démonstration qui *aboutit à une validation*. Six minutes sont budgétées dans les
trente de l'oral.

Le logiciel est prêt — v0.4.0, déployé, 36 scénarios e2e verts. Ce qui pouvait manquer, c'est
le dispositif. Il est ici.

## 1. Le scénario, en six minutes

Le fil conducteur est **le cycle de vie d'un poste de travail dans une TPE**, du jour où il
entre dans le parc au jour où il tombe en panne sur le terrain. Chaque séquence répond à une
question que le commanditaire se pose, pas à une fonctionnalité que le développeur a écrite.

| # | Durée | Séquence | Ce que ça prouve | Ce qu'on dit |
|---|---|---|---|---|
| 1 | 0:30 | Connexion administrateur → accueil | Le parc tient sur un écran | « Voilà ce que voit le responsable le lundi matin : tout le parc, et ce qui ne va pas. » |
| 2 | 1:00 | Créer un équipement → QR généré automatiquement | Le geste d'entrée dans le parc, sans double saisie | « J'enregistre le poste une fois. L'étiquette est produite là, je l'imprime, je la colle. » |
| 3 | 1:30 | Scan de l'étiquette au téléphone → fiche de l'équipement | **Le différenciateur face à Excel** | « Sur le terrain, je vise l'étiquette. Je n'ai ni à chercher un numéro de série, ni à ouvrir un fichier. » |
| 4 | 1:30 | Déclarer une panne depuis le mobile, **en coupant le réseau** → bandeau de synchronisation en attente → retour du réseau → l'incident part | La promesse offline, vérifiable en direct | « Dans un local technique sans réseau, la panne se déclare quand même. Rien n'est perdu. » |
| 5 | 1:00 | Retour administrateur : l'incident est arrivé, on le qualifie, on avance son cycle de vie | La boucle se referme | « Le responsable reçoit le signalement, il décide. L'équipement ne se met pas en panne tout seul : c'est lui qui qualifie. » |
| 6 | 0:30 | Bascule sur un compte technicien : ce qui disparaît de l'écran | Le contrôle d'accès est réel, pas déclaratif | « Même application, même URL, mais un technicien ne voit ni la gestion des comptes, ni les actions d'administration. » |

**Six minutes, six fonctionnalités, une seule histoire.** Le parcours couvre l'inventaire, la
génération de QR, le scan mobile, le mode hors-ligne, la gestion d'incidents et le contrôle
d'accès par rôle — c'est-à-dire l'intégralité du périmètre MVP annoncé au Bloc 1.

**Registre de langue.** Le critère est explicite sur le vocabulaire. Pendant la démonstration :
« étiquette », pas « QR encodé » ; « la panne part quand le réseau revient », pas « la file de
synchronisation se vide » ; « le technicien ne voit pas ces boutons », pas « RBAC côté
serveur ». Le vocabulaire technique revient après, si le jury le demande — et il le demandera.

## 2. Jeu de données de démonstration

**C'est le point le plus exposé du dispositif**, et il tient à une dette connue : la base de
test est partagée avec la production (risque R3 du tableau de bord). Un reliquat de test
préfixé `e2e-ephemeral-` visible à l'écran devant le jury, c'est un incident de démonstration *et* une
question désagréable sur la séparation des environnements.

À préparer :

- **Un parc crédible** : une dizaine d'équipements aux noms d'entreprise réalistes, répartis
  sur les quatre types (`pc`, `screen`, `printer`, `other` — jamais `laptop` ni `phone`, la
  contrainte en base les refuse), avec des statuts variés et deux ou trois assignations.
- **Un équipement dédié à la séquence 2**, dont l'étiquette QR est **déjà imprimée sur papier**
  et posée sur la table. Scanner une étiquette physique produit un effet tout autre que
  scanner un écran — et évite le reflet.
- **Deux comptes prêts** : un administrateur, un technicien, mots de passe **écrits sur la
  fiche papier** et non dans un gestionnaire à déverrouiller devant le jury.
- **Sweep exécuté et vérifié la veille**, puis contrôle visuel de la liste le matin même.

## 3. Les six risques et leurs parades

| Risque | Probabilité | Parade |
|---|---|---|
| **Données de test visibles** | Moyenne | Sweep J−1, contrôle visuel J−0. Si un reliquat apparaît malgré tout : le nommer, expliquer la convention de préfixe, enchaîner. Une dette assumée à voix haute coûte moins cher qu'une dette découverte par le jury. |
| **Démarrage à froid des fonctions** | Élevée | Réveiller l'application et parcourir **tout** le scénario 10 minutes avant d'entrer. Le palier gratuit Supabase met le projet en pause après une semaine d'inactivité : il doit avoir été réveillé la veille **et** le matin. |
| **Réseau de la salle** | Moyenne | Partage de connexion depuis le téléphone, testé sur place. Application lancée en local sur un second onglet, prête. |
| **Affichage du mobile au jury** | ~~Élevée~~ **couvert** | Recopie d'écran téléphone → portable **testée** (confirmé le 31/08). À rejouer une fois en répétition J−1. |
| **Parcours mobile régressé** | Faible | C'est le parcours qui était cassé en juillet et corrigé depuis (#28-#32). À rejouer **sur l'appareil réel** dans les 48 h avant l'oral, pas sur émulateur — c'est précisément l'erreur qui l'avait laissé passer. |
| **Rechargement hors ligne** | Moyenne | Aucun précache (`globPatterns: []`, `navigateFallback: null`) : une page rechargée, ou une route jamais visitée, ne s'affiche pas hors ligne. Ouvrir la fiche **en ligne**, couper le réseau, **ne jamais recharger**. |
| **Caméra sur le repli local** | Moyenne | Une URL `http` locale n'est pas un contexte sécurisé : le téléphone n'y a pas accès à la caméra. Sur le repli, passer par la **saisie manuelle** du code (`scan.tsx`). |
| **Panne de production** | Faible | Voir §5. |

## 4. Checklists

**J−1 (17 septembre)**

- [ ] Réveiller le projet Supabase, vérifier qu'il répond
- [ ] Sweep des données de test, puis injection du jeu de démonstration
- [ ] Imprimer l'étiquette QR de l'équipement de démonstration
- [ ] Vérifier les deux comptes (connexion réelle, pas seulement leur existence)
- [ ] Rejouer le scénario complet de bout en bout, chronomètre en main, sur téléphone réel
- [ ] Rejouer la suite e2e une fois (`bun run test:e2e`, base partagée : sous supervision) — dernier run : 13/07
- [x] ~~Tester la recopie d'écran téléphone → portable~~ — testé, à rejouer une fois
- [ ] Enregistrer la capture vidéo de secours, la stocker **en local**
- [ ] Imprimer la fiche papier : identifiants, URL, ordre des séquences

**J−0 (18 septembre, avant 11h30)**

- [ ] Convocation et pièce d'identité — sans elles, la soutenance n'a pas lieu
- [ ] Adaptateur vidéo dans le sac (présence confirmée le 31/08, reste à ne pas l'oublier)
- [ ] Réveiller l'application, parcourir tout le scénario
- [ ] Contrôle visuel de la liste des équipements
- [ ] Partage de connexion activé et testé
- [ ] Batterie du téléphone, batterie du portable, chargeurs
- [ ] Notifications coupées sur les deux appareils

## 5. Plan de repli

**Si la production tombe** : basculer sur l'instance locale, déjà lancée sur le second onglet.
Le dire simplement — « la production ne répond pas, je continue sur l'environnement local,
c'est le même code au même commit » — et enchaîner. Ce repli couvre une panne Vercel, **pas une panne ni une
pause Supabase** : la base est la même. Un incident géré calmement devant un jury
de professionnels n'est pas une faute.

**Si les deux tombent** : la capture vidéo. Elle ne satisfait pas le critère à elle seule — la
grille demande une démonstration *par le candidat devant le jury* — mais elle permet de montrer
les fonctionnalités et de commenter en direct, ce qui vaut infiniment mieux qu'un écran noir.
Le dire franchement, proposer de refaire la manipulation en fin de soutenance si le service
revient.

**Ce qu'il ne faut pas faire** : s'acharner sur un rechargement. Deux tentatives, puis on
bascule. Le temps perdu à réessayer se prend sur les cinq autres compétences du bloc.

## 6. Le mot de la fin de démonstration

Le critère demande que la démonstration « aboutisse à une validation du commanditaire ». Elle
doit donc se **fermer explicitement**, par une question posée au jury dans son rôle de
commanditaire — quelque chose comme : *« Sur ce périmètre, est-ce que le besoin que nous
avions cadré en mai est couvert ? »* C'est ce qui transforme une démonstration en recette, et
c'est exactement ce que le critère attend.
