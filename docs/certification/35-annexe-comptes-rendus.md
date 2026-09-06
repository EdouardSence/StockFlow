# 35 — Annexe : comptes rendus d'avancement (pièce 11 bis, Bloc 3 — C3.4.1)

Trois comptes rendus au format défini en pièce 34, correspondant aux points de validation PV1
à PV3. **Destinataire : le responsable informatique du profil-type de TPE/PME retenu au
cadrage** — décideur et sponsor du projet dans la cartographie des parties prenantes. Le
caractère construit de ce destinataire est explicité en pièce 34 § 1.

**Ces trois comptes rendus ont été rédigés en septembre 2026**, au format défini en pièce 34,
reconstruits depuis `PROGRESS.md`, les issues et les livrables aux dates concernées. Ils
restituent l'état du projet à chaque point de validation ; ils n'ont pas été adressés à un
destinataire à ces dates-là — il n'y en avait pas. Le dire vaut mieux que de laisser une date
d'en-tête suggérer une correspondance qui n'a pas eu lieu, et c'est la même règle que le reste
du dossier applique : ne rien affirmer qui ne soit vérifiable.

---

## CR1 — Validation du cadrage · 12 juin 2026

**Où en est le projet.** Phase d'étude terminée. Le périmètre du MVP est arrêté, la faisabilité
est établie sur les trois plans technique, économique et organisationnel, et un prototype
initial existe déjà — le modèle de données et l'ossature applicative ont été posés en mai.

**Ce qui a été produit depuis le lancement.** L'analyse de votre situation : ce que coûte
aujourd'hui un inventaire tenu sur tableur, et pourquoi les outils existants du marché ne
conviennent pas à un parc de 10 à 100 postes — trop lourds à mettre en œuvre pour le bénéfice
attendu. Le périmètre proposé tient en cinq fonctions : enregistrer un équipement, produire son
étiquette, la scanner sur le terrain, déclarer une panne, et savoir qui détient quoi.

**Ce qui change par rapport à l'annoncé.** Rien à ce stade — c'est le premier point.

**Ce qui est à décider.** Trois éléments soumis à votre validation : le périmètre du MVP à cinq
fonctions, le budget de 14 536 € HT avec un retour sur investissement estimé à 3,2 ans puis un
gain récurrent d'environ 4 500 € par an, et le principe d'une application web installable
plutôt que d'une application à télécharger sur un magasin — ce qui évite les frais et les
délais de publication, et permet le fonctionnement sans réseau dans un local technique.

**Prochaine échéance.** Livraison du MVP fonctionnel, fin juillet.

---

## CR2 — Livraison du MVP · 22 juillet 2026

**Où en est le projet.** Les cinq fonctions du périmètre validé sont livrées et déployées. Le
logiciel est utilisable de bout en bout, en autonomie, sur poste et sur téléphone.

**Ce qui a été livré.** L'enregistrement d'un équipement avec production automatique de son
étiquette ; le scan de cette étiquette au téléphone, qui ouvre directement la fiche ; la
déclaration d'une panne depuis le terrain, **y compris sans réseau** — la déclaration part
toute seule au retour de la connexion, rien n'est perdu ; l'assignation d'un équipement à une
personne ; et le suivi des pannes de leur signalement à leur résolution. Deux niveaux d'accès
distincts : administrateur et technicien.

Contrôles effectués avant livraison : 36 scénarios de recette exécutés, tous conformes ;
99 tests automatisés sur le cœur du logiciel, tous verts.

**Ce qui change par rapport à l'annoncé.** Trois écarts, tous assumés.

- **Deux niveaux d'accès au lieu de trois.** Le cadrage prévoyait un troisième profil en
  consultation seule. Il a été retiré : aucun usage identifié dans un parc de cette taille ne
  le justifiait, et chaque profil supplémentaire ajoute une surface à tester et à sécuriser.
  Réintroductible sans refonte si le besoin apparaît.
- **Un défaut découvert tard sur le parcours mobile.** La recette automatisée était intégralement
  au vert alors que l'usage réel sur téléphone était dégradé. Le défaut a été trouvé en testant
  sur un appareil physique, qualifié, et corrigé avant la livraison. La procédure de recette
  intègre désormais un passage obligatoire sur matériel réel.
- **Un incident de chaîne de contrôle.** Le dispositif de vérification automatique est resté en
  échec neuf jours sans être détecté. Corrigé, et assorti d'un indicateur visible pour que le
  cas ne se reproduise pas.

**Ce qui est à décider.** Rien de bloquant. Un point d'attention à porter à votre connaissance :
les données de test et les données réelles cohabitent aujourd'hui sur la même base, protégées
par une convention de nommage. C'est acceptable en phase de MVP, ce ne le serait pas en
exploitation — la séparation est chiffrée et à prévoir avant toute mise en service.

**Prochaine échéance.** Mise en condition opérationnelle : supervision, traitement des
anomalies, procédure de mise à jour. Fin août.

---

## CR3 — Mise en condition opérationnelle · 21 août 2026

**Où en est le projet.** Le logiciel est supervisé en production. Le dispositif de détection,
de consignation et de correction des anomalies est en place et a été éprouvé sur des cas réels.

**Ce qui a été livré depuis juillet.** Une surveillance des erreurs en production, qui signale
un dysfonctionnement subi par un utilisateur sans qu'il ait à le rapporter. Une sonde de
disponibilité, qui vérifie toutes les quinze minutes que le service répond et alerte sinon —
elle couvre le cas qu'aucune surveillance d'erreur ne peut voir : celui où plus rien ne se
charge du tout. Un processus de consignation des anomalies, avec pour règle qu'aucune
correction n'est engagée avant que le problème ait été reproduit et qualifié. Et un journal des
versions documentant ce que chaque mise à jour apporte.

**Ce qui change par rapport à l'annoncé.** Un écart, sur l'hébergement.

Le cadrage annonçait un hébergeur français à faible empreinte carbone. La solution retenue en
production est différente, et il a été décidé de ne pas migrer. Le raisonnement, en trois
points : la migration n'apportait aucune fonctionnalité supplémentaire ; elle imposait de
refaire la chaîne de déploiement et de revalider l'ensemble à trois semaines d'une échéance
ferme ; et une migration partielle — l'application d'un côté, la base de l'autre — aurait
coûté presque autant tout en vidant de son sens l'argument qui la motivait.

**Cet écart n'est pas tenu pour un détail.** L'engagement environnemental du cadrage n'est pas
honoré, et il n'est pas transformé ici en avantage. La décision est réversible : le retour à
l'hébergeur initialement prévu est documenté étape par étape, et le code ne dépend pas du
fournisseur actuel. Si la souveraineté de l'hébergement devient une exigence de votre côté, le
chemin de retour est chiffré et disponible.

**Ce qui est à décider.** Le passage en exploitation réelle suppose deux décisions de votre
part : le passage aux offres payantes des services d'hébergement, de l'ordre de 45 $ par mois —
l'offre gratuite actuelle met le service en veille après une semaine sans usage, ce qui s'est
déjà produit et se traduirait chez vous par une indisponibilité ; et la séparation des données
de test et de production signalée au précédent point.

**Prochaine échéance.** Démonstration et recette fonctionnelle en votre présence, 18 septembre.
