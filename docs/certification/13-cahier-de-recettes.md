# 13 — Cahier de recettes

Pièce officielle Bloc 2 « Cahier de recettes » (C2.3.1). Chaque scénario ci-dessous
correspond à un test Playwright réel (`e2e/`, `bun run test:e2e`) — aucun scénario « sur le
papier ». **Dernière exécution : 2026-07-06, 19/19 scénarios passés en 35,9 s** (Chromium
headless, serveur dev local, base réelle). Les assertions ne se limitent pas à l'UI : les
scénarios marqués `[DB]` vérifient aussi la ligne Postgres réellement écrite/lue.

## Stratégie base de données (à lire avant tout scénario)

**Constat (2026-07-05)** : un seul projet Supabase existe (`npdfobiadwtxbvpyxydr`). Le dev
local, la suite de tests (`bun run test`, tests d'intégration RLS inclus) et le déploiement
Vercel public pointent tous sur la **même base Postgres**. Dette connue et assumée pour
cette session ; la vraie solution — base de test séparée (branche Supabase ou second
projet) — reste la cible à terme, hors périmètre faute de temps/quota.

Mesures de confinement :

1. **Convention de nommage stricte** : toute donnée créée par la suite e2e porte le préfixe
   `e2e-ephemeral-` (ids, emails, noms, numéros de série, descriptions — constante
   `E2E_PREFIX`, `e2e/support/db.ts`). Les lignes créées via l'UI ont un id uuid : le
   préfixe vit alors dans les champs saisis, tous matchés par le sweep. Jamais un simple
   `test-`, qui pourrait matcher des données réelles ou les fixtures RLS (`rls-test-`).
2. **Sweep systématique** (`sweepEphemeralData`) : suppression de toute ligne
   `incidents`/`equipment`/`users` matchant le préfixe (FK `refresh_tokens` en cascade),
   **avant** la suite (globalSetup — restes d'un run interrompu) **et après**
   (globalTeardown — best-effort, jamais bloquant). Dernier run : 1 incident,
   7 équipements, 2 users supprimés post-suite, 0 résidu au run suivant.
3. **Jamais en CI** : exécution locale, à la demande, sous supervision (`workers: 1`,
   `retries: 0`).

## Scénarios — résultats de l'exécution du 2026-07-06

Acteurs : **admin** / **tech** (technicien) = comptes éphémères créés par globalSetup ;
**anonyme** = aucun cookie de session.

### Authentification (`e2e/auth.spec.ts`)

| ID | Acteur | Prérequis | Étapes | Résultat attendu | Obtenu |
|----|--------|-----------|--------|------------------|--------|
| A1 | admin | compte admin en base | `/login` → email + mot de passe → soumettre ; puis « Se déconnecter » (Sidebar) | Session ouverte, redirection `/` ; logout → retour `/login` | ✅ passé |
| A2 | tech | compte technicien en base | `/login` → identifiants technicien | Session ouverte, quitte `/login` | ✅ passé |
| A3 | anonyme | — | `/login` avec mot de passe erroné | Message d'erreur (`role="alert"`), reste sur `/login`, pas de session | ✅ passé |
| A4 | anonyme | — | Accès direct `/equipment` sans session | Redirection `/login` | ✅ passé |

### RBAC (`e2e/rbac.spec.ts`)

| ID | Acteur | Prérequis | Étapes | Résultat attendu | Obtenu |
|----|--------|-----------|--------|------------------|--------|
| R1 | tech | — | Accès direct `/incidents` (admin-only) | Redirection hors de la page, écran Incidents jamais rendu | ✅ passé |
| R2 | tech | équipement seedé | Fiche équipement desktop | Picker d'assignation admin absent ; bouton « M'attribuer » présent (UI masque les actions admin) | ✅ passé |
| R3 | tech | session admin pour capturer l'appel | Replay de l'appel réseau réel de `listIncidentsFn` (admin-only) avec les cookies du technicien | Refus serveur : erreur `FORBIDDEN` sérialisée, aucune donnée (`reported_by_name` absent). Contrôle positif : le même appel en admin passe | ✅ passé |

Note transport : TanStack Start renvoie les erreurs de server function en HTTP 200 avec
l'erreur sérialisée dans l'enveloppe (`$TSR/Error`, re-levée côté client) — le refus
s'observe dans le corps, pas dans le code HTTP. Défense en profondeur : la couche Postgres
(RLS) est testée séparément par `src/db/rls.integration.test.ts` (9 tests, connexion brute).

### CRUD équipement (`e2e/equipment.spec.ts`)

| ID | Acteur | Prérequis | Étapes | Résultat attendu | Obtenu |
|----|--------|-----------|--------|------------------|--------|
| E1 | admin | — | `/equipment/new` : nom, marque, modèle, n° série → « Enregistrer & générer QR » | Aperçu étiquette avec QR (image data-url) ; `[DB]` ligne créée, `qr_code` non vide, statut `available` | ✅ passé |
| E2 | admin | E1 | Liste `/equipment`, recherche par nom ; puis recherche sans correspondance | Ligne trouvée (nom + n° série) ; état vide « Aucun équipement trouvé. » | ✅ passé |
| E3 | admin | E1 | Fiche `/equipment/$id` | Nom (titre), n° série, marque affichés | ✅ passé |
| E4 | admin | E1 | Fiche : « Déclarer en panne » puis « Marquer disponible » | Badge « En panne » puis « Disponible » ; `[DB]` statut final `available` | ✅ passé |

L'« édition » livrée à ce jour est le changement de statut depuis la fiche — il n'existe pas
de formulaire d'édition générale des champs (voir § Hors périmètre).

### Scan QR mobile (`e2e/scan.spec.ts`, viewport 390×844)

| ID | Acteur | Prérequis | Étapes | Résultat attendu | Obtenu |
|----|--------|-----------|--------|------------------|--------|
| SC1 | tech | équipement seedé | Ouvrir l'URL que le QR encode (`/equipment/$id`, cf. `new.tsx`) sur mobile | Fiche mobile « Équipement scanné » avec le nom de l'équipement | ✅ passé |
| SC2 | tech | — | Ouvrir `/scan` sans caméra | Écran d'erreur explicite « Impossible d'accéder à la caméra… », pas de crash | ✅ passé |

Limite assumée : le décodage caméra (`html5-qrcode`) n'est pas automatisable en headless
(pas de flux vidéo). Le contrat testé est celui que le scan produit : QR = URL
`/equipment/$id` (génération, E1/SC1) et l'écran scanner navigue vers cette URL après
décodage (`scan.tsx`). Le décodage lui-même relève d'un test manuel sur appareil réel.

### Incidents (`e2e/incidents.spec.ts`)

| ID | Acteur | Prérequis | Étapes | Résultat attendu | Obtenu |
|----|--------|-----------|--------|------------------|--------|
| I1 | tech (mobile) | équipement seedé | Fiche mobile → tuile « Signaler panne » → description → « Envoyer le signalement » | Confirmation « un administrateur qualifiera l'incident » ; `[DB]` ligne `incidents` : `status=open`, `reported_by=` technicien ; `equipment.status` **inchangé** (qualification manuelle) | ✅ passé |
| I2 | admin | I1 | Liste équipements + fiche | Badge « incidents ouverts » = 1 sur la ligne et sur la fiche | ✅ passé |
| I3 | admin | I1 | `/incidents` : « Prendre en charge » puis « Marquer résolu » | Badge Ouvert → En cours ; puis bascule en section « Résolus récemment » ; `[DB]` `status=resolved`, `resolved_at` non nul | ✅ passé |

### Assignation (`e2e/assignment.spec.ts`)

| ID | Acteur | Prérequis | Étapes | Résultat attendu | Obtenu |
|----|--------|-----------|--------|------------------|--------|
| AS1 | tech | équipement `available` | « M'attribuer » puis « Retirer mon attribution » | Affiche « Vous » ; `[DB]` `assigned`/`assigned_to=tech` puis retour `available`/`null` | ✅ passé |
| AS2 | admin | équipement `available` | Picker complet → sélectionner le technicien → « Assigner » ; puis « Retirer l'attribution » | Nom du technicien affiché ; `[DB]` `assigned_to` correct ; retour « Non attribué » | ✅ passé |
| AS3 | admin | équipement `broken` | Ouvrir la fiche | Picker désactivé + message « Assignation impossible : équipement en panne. » ; `[DB]` `assigned_to` reste nul. Règle serveur verrouillée par les tests de domaine (`equipment-domain.test.ts`, 10 cas) | ✅ passé |

## Anomalies détectées

| ID | Détection | Anomalie | Sévérité | Suivi |
|----|-----------|----------|----------|-------|
| AN-1 | Rédaction de SC2 (session 10) | Bouton « Saisir le code manuellement » (`scan.tsx`) sans handler — purement décoratif ; aucune voie de repli sans caméra | Low (fonctionnel) | [Issue #22](https://github.com/EdouardSence/StockFlow/issues/22), Kanban — correction planifiée, pas de fix silencieux dans cette session |

Fausse piste écartée pendant la rédaction (pas une anomalie) : le premier jet de R3
attendait un refus HTTP ≥ 400 ; l'enquête a montré que TanStack Start sérialise les erreurs
en HTTP 200 (voir note RBAC) — le serveur refuse bien, l'assertion a été corrigée.

## Hors périmètre livré (documenté, pas omis)

Vérifié dans le code au 2026-07-06 — aucune de ces fonctions n'existe, aucun scénario ne
peut donc les recetter :

- **PWA / synchronisation hors-ligne** : session 7 planifiée, non livrée (`vite-plugin-pwa`
  non câblé, issue #9).
- **Export CSV/PDF** : jamais planifié dans une session dédiée ; le bouton « Imprimer
  étiquettes » de la liste est un stub assumé (envoie une erreur de démonstration à Sentry).
- **Notifications** : inexistantes.
- **Journal d'audit** : inexistant.
- **Suppression d'équipement / suppression d'incident / gestion des comptes via UI** :
  aucune UI ni server function de suppression n'est livrée (la policy RLS `equipment_delete`
  réservée admin est testée par `rls.integration.test.ts` ; gestion des comptes = issue #12).
- **Décodage QR par caméra réelle** : voir § Scan — test manuel sur appareil.

## Rejouer la recette

```bash
bun run test:e2e   # local uniquement, jamais en CI — voir stratégie DB ci-dessus
```
