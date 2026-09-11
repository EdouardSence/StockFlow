# 29 — Ressources du projet (pièce 6, Bloc 3 — C3.1)

Compétence **éliminatoire**. Le référentiel demande l'identification des ressources
« humaines, financières et matérielles ».

## 1. Ressources humaines

| Ressource | Nature | Disponibilité |
|---|---|---|
| Porteur de projet | 1 alternant, cinq rôles cumulés (pièce 25) | Non dédié — projet mené hors temps d'entreprise, fenêtres irrégulières |
| Agents de développement | Claude Code, missions bornées | À la demande, sans contrainte de planning |
| Instance pédagogique | Tuteur et jurys YNOV | Aux jalons uniquement |

**Charge consommée** : 10 à 15 j/h tous postes confondus, contre 25 j/h estimés au Bloc 1
(détail et précautions au §4 de la pièce 26, « Coûts »). Répartie sur **16 journées de production**
identifiées par l'historique git, dont neuf concentrées sur deux semaines de juillet.

**Le point de rupture, et il faut le nommer** : la ressource est unique et sans redondance.
Une indisponibilité de deux semaines en juillet aurait fait manquer le jalon du Bloc 2, sans
qu'aucun transfert de compétence soit possible. Aucune mitigation n'existait — c'est un risque
structurel accepté, pas traité.

## 2. Ressources matérielles

| Ressource | Rôle | Note |
|---|---|---|
| Poste de développement | Environnement local, exécution des tests | — |
| Téléphone mobile réel | Recette du parcours terrain, scan de QR par la caméra | **Indispensable, et pas un confort** : c'est l'absence de recette sur appareil réel qui a laissé passer le parcours mobile cassé en juillet |
| Imprimante | Étiquettes QR à coller sur les équipements | Nécessaire à la démonstration du 18 septembre |
| Dépôt GitHub + Actions | Code, issues, CI, sonde de disponibilité | Palier gratuit |
| Vercel | Hébergement applicatif, previews par PR | Hobby |
| Supabase | PostgreSQL managé, RLS, pooler `eu-west-1` | Free |
| Sentry | Erreurs runtime, région UE | Developer |

Les **données** sont hébergées dans l'Union européenne : base Supabase en Irlande (`eu-west-1`),
erreurs Sentry en Allemagne. L'assignation équipement→utilisateur est nominative, le RGPD
s'applique, et la localisation était une exigence de cadrage. **Écart relevé le 11/09 (V14)** :
les fonctions Vercel s'exécutent dans la région par défaut, `iad1` (Washington) — les données
personnelles y transitent à chaque requête. La correction tient en une ligne (`regions` →
`dub1`, Dublin, à côté de la base), mais suppose un redéploiement de la production : elle est
différée pour ne pas toucher la production à une semaine de la démonstration.

## 3. Ressources financières

### Budget présenté au commanditaire (Bloc 1)

| Poste | Montant HT |
|---|---|
| Développement — 25 j/h × 500 €/j | 12 500 € |
| Hébergement Scalingo, 3 mois | 90 € |
| Domaine + SSL | 20 € |
| Outils (GitHub, Sentry, CI) | 30 € |
| Contingence projet (aléas) | 1 896 € |
| **Total MVP phase 1** | **14 536 €** |

La contingence de 1 896 € couvre les aléas externes ; elle est distincte de la réserve de 15 %
déjà incluse dans les 25 j/h, qui couvre l'incertitude d'estimation. Deux réserves de nature
différente — la confusion entre les deux est une objection classique, autant la désamorcer.

### Dépense réelle

**0 € de coût direct.** Toutes les briques tournent sur des paliers gratuits, et la
contingence n'a pas été consommée. Charge réelle : 10 à 15 j/h, soit de l'ordre de 5 000 à
7 500 € valorisés au taux du Bloc 1.

### Coût de possession en production — ce que le Bloc 1 ne chiffrait pas

Le jury du Bloc 1 avait relevé l'absence de TCO. Voici la réponse, aux tarifs publics relevés
le 31 août 2026 :

| Poste | Palier requis chez un client | Coût |
|---|---|---|
| Hébergement applicatif | Vercel Pro, 1 siège | 20 $/mois |
| Base de données | Supabase Pro — **ne se met jamais en pause**, sauvegardes quotidiennes 7 jours | 25 $/mois |
| Supervision | Sentry, palier gratuit suffisant à ce volume | 0 € |
| **Infrastructure** | | **≈ 45 $/mois, de l'ordre de 500 $/an** |
| Maintenance corrective et évolutive | à provisionner, non chiffré à ce stade | — |

**Le palier gratuit n'est pas gratuit, il est reporté.** Supabase met un projet Free en pause
après une semaine d'inactivité — c'est arrivé sur ce projet, `PROGRESS.md` en garde la trace.
Chez un client, ce comportement porte un autre nom : indisponibilité. Le passage au palier Pro
n'est donc pas un confort, c'est la condition d'une mise en service.

Rapporté au gain récurrent estimé à ~4 500 €/an, l'infrastructure absorbe environ un dixième
du bénéfice annuel. L'ordre de grandeur annoncé au Bloc 1 (30 €/mois) était juste — ce qui
manquait, c'était la ligne de maintenance, et elle reste à provisionner.
Effet sur le payback : ≈ 3,2 ans brut, **≈ 3,6 ans net** du coût d'infrastructure, maintenance
non comptée.
