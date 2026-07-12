# 21 — Manuel d'utilisation

Pièce officielle Bloc 2 « Manuel d'utilisation ». Numérotée 21 (suite de la numérotation
locale, 15/16 étant les manuels de déploiement et de mise à jour). Décrit l'application
telle que livrée — deux rôles : **administrateur** et **technicien**.

## Connexion

1. Ouvrir l'application (URL de production Vercel, ou `http://localhost:3000` en local).
2. Saisir email + mot de passe sur `/login`. Session : 15 minutes, renouvelée
   automatiquement tant que le navigateur est actif (cookies httpOnly).
3. Déconnexion : bouton en bas de la barre latérale (desktop).

En cas d'échecs répétés, le compte et l'adresse IP sont temporairement bloqués
(rate limiting) — attendre avant de réessayer.

## Parcours communs (admin + technicien)

### Consulter le parc (`/equipment`, desktop — accueil `/` sur mobile)

- Liste des équipements avec type, statut, personne assignée, badge « incidents
  ouverts » le cas échéant.
- Recherche par nom, numéro de série ou utilisateur (champ « Nom, n° série,
  utilisateur »).
- Clic sur une ligne → fiche équipement.

### Fiche équipement (`/equipment/{id}`)

- Détail complet : type, marque, modèle, n° série, QR code, statut, assignation, notes.
- **Changer le statut** : disponible / assigné / en panne / maintenance.
- **Signaler une panne** (mobile) : tuile « Signaler panne » → description facultative
  → « Envoyer le signalement ». L'incident est créé en statut « ouvert » ; le statut de
  l'équipement n'est pas modifié automatiquement (c'est l'admin qui qualifie).

### Scanner un QR code (`/scan`, pensé pour mobile)

1. Autoriser la caméra ; viser l'étiquette QR de l'équipement → navigation automatique
   vers sa fiche.
2. Sans caméra (ou étiquette abîmée) : « Saisir le code manuellement » — accepte
   l'identifiant brut ou l'URL complète du QR. Code inconnu → message d'erreur, pas de
   navigation.

### Mode hors-ligne (PWA)

L'application est installable (« Ajouter à l'écran d'accueil »). Sans réseau :

- Toute page **déjà visitée** reste consultable (cache local).
- **Signaler une panne fonctionne hors-ligne** : l'incident est enregistré localement,
  un bandeau « N incident(s) en attente de synchronisation » s'affiche, et l'envoi se
  fait automatiquement au retour du réseau (ou via le bouton « Synchroniser »).
  Rien n'est perdu ni envoyé en double.
- Les autres écritures (créer/modifier un équipement, assigner…) nécessitent le réseau.

### Mon compte (`/account`)

Changement de mot de passe : mot de passe actuel + nouveau (8 caractères minimum).

## Parcours administrateur

### Créer un équipement (`/equipment/new`)

Nom, type (fixe/écran/imprimante/autre), marque, modèle, n° série, notes → le QR code
est généré automatiquement à la création (à imprimer et coller sur l'équipement).

### Assigner un équipement (fiche équipement)

Sélecteur d'utilisateur (liste complète pour l'admin) ; un technicien ne peut
s'assigner/désassigner que lui-même. Un équipement en panne ou en maintenance ne peut
pas être assigné.

### Suivre les incidents (`/incidents`)

File des incidents avec description, équipement, rapporteur, date. Cycle de vie :
**Ouvert → En cours → Résolu** (boutons d'avancement ; les transitions invalides sont
refusées). La date de résolution est posée automatiquement.

### Gérer les utilisateurs (`/admin/users`)

Créer un compte (nom, email, rôle admin/technicien, mot de passe initial ≥ 8 caractères),
voir l'état d'activation des comptes existants.

## Messages d'erreur courants

| Message | Cause | Quoi faire |
|---|---|---|
| « Identifiants invalides » | Email ou mot de passe erroné | Réessayer ; au-delà de plusieurs échecs, attendre (rate limiting) |
| « Aucun équipement ne correspond à ce code. » | QR/code saisi inconnu | Vérifier l'étiquette, réessayer |
| « Incident enregistré hors-ligne… » | Pas de réseau au moment du signalement | Rien : synchronisation automatique au retour du réseau |
| Erreur générique serveur | Incident technique (détail masqué volontairement) | Réessayer ; l'erreur est remontée à l'équipe via Sentry |
