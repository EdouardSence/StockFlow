# 32 — Cas d'arbitrage : l'hébergement (pièce 8, Bloc 3 — C3.2.2)

Le critère demande une problématique exposée avec ses conséquences, des options détaillées,
une décision argumentée, et l'usage d'un outil d'aide à la décision. Un seul cas est déroulé
ici, du constat de l'écart à la décision et à ses suites.

**Décision prise le 13 juillet 2026, tracée dans l'issue #21 et dans
`docs/certification/15-manuel-deploiement.md`.**

## 1. La problématique

Le cadrage présenté au commanditaire au Bloc 1 annonçait un hébergement sur **Scalingo** —
PaaS français, datacenters à faible empreinte carbone, 90 € pour trois mois au budget
prévisionnel. Deux arguments portaient ce choix : la souveraineté et l'impact
environnemental.

La production, elle, tourne sur **Vercel + Supabase depuis mai 2026**. L'infrastructure de
développement, mise en place avant l'oral de cadrage, n'a jamais été migrée.

**L'écart est constaté à trois sessions de la fin du projet.** Le problème n'est donc pas
technique, il est de conformité au cadrage : le commanditaire a validé une solution, une
autre a été livrée. Deux conséquences si rien n'est fait — un engagement non tenu vis-à-vis
du commanditaire, et un dossier de certification qui se contredit d'un bloc à l'autre.

## 2. Le logigramme de décision

```
                  Écart constaté : Scalingo annoncé / Vercel+Supabase en production
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
        La migration apporte-t-elle                          La production actuelle
        une valeur fonctionnelle ?                           est-elle éprouvée ?
                    │                                                   │
                   NON                                                 OUI
        (même appli, mêmes                              (variables posées #20, RLS sur
         fonctionnalités)                                pooler, en-têtes vérifiés #17,
                    │                                    build PWA compatible)
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
                              Le coût de migration est-il tenable
                              à 3 sessions de la fin ?
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                   NON                                                 OUI
                    │                                                   │
                    ▼                                                   ▼
        Réécriture du pipeline CD                            → Migrer avant le Bloc 2
        + migration Postgres
        + perte des previews par PR
        + re-validation complète
        (e2e, en-têtes, PWA)
                    │
                    ▼
        L'argument d'origine survit-il
        à une migration partielle ?
                    │
                   NON  ── Scalingo + Supabase = infra hybride,
                    │      l'argument souveraineté/green perd sa substance
                    ▼
        Le code est-il verrouillé
        sur Vercel ?
                    │
                   NON  ── Nitro preset `node-server`, code applicatif inchangé
                    │
                    ▼
        ╔═══════════════════════════════════════════════════════════╗
        ║  DÉCISION : rester sur Vercel + Supabase                  ║
        ║  Écart de cadrage ASSUMÉ, argumenté et documenté,         ║
        ║  avec annexe de portabilité vers Scalingo                 ║
        ╚═══════════════════════════════════════════════════════════╝
```

## 3. Les options, détaillées

| | **A — Migrer vers Scalingo** | **B — Infra hybride Scalingo + Supabase** | **C — Rester sur Vercel + Supabase** |
|---|---|---|---|
| Conformité au cadrage | Totale | Partielle | Nulle — écart assumé |
| Coût | Réécriture du pipeline CD, migration Postgres (`pg_dump`/`pg_restore`), recréation du rôle `stockflow_app`, portage des en-têtes de sécurité dans Nitro, re-validation e2e + PWA complète | Idem pour l'applicatif, sans la migration de données | Nul |
| Valeur fonctionnelle apportée | **Aucune** | Aucune | Aucune |
| Risque | Élevé — une régression non détectée à trois sessions du dépôt du Bloc 2 | Élevé | Nul |
| Ce qu'on perd | — | La base reste hors Scalingo : l'argument souveraineté ne tient plus qu'à moitié | Previews par PR conservées ; l'argument green du cadrage n'est pas tenu |
| Argument d'origine préservé | Oui | **Non** — c'est ce qui disqualifie cette option | Non |

L'option B mérite d'être exposée à l'oral précisément parce qu'elle est la plus tentante et la
plus mauvaise : elle coûte presque autant que A tout en vidant de sa substance la raison même
de la migration.

## 4. La décision et ses conditions

**Rester sur Vercel + Supabase**, en qualifiant l'écart comme tel plutôt qu'en le passant sous
silence. Trois conditions ont rendu cette décision acceptable :

1. **Elle est réversible.** Le code n'est pas verrouillé sur Vercel — le build Nitro accepte le
   preset `node-server`, l'applicatif est inchangé. Une annexe « Portabilité Scalingo »
   documente les cinq étapes du retour arrière, une à une : runtime, base, variables, en-têtes
   de sécurité, et ce qui serait perdu.
2. **Elle est tracée.** Issue #21, manuel de déploiement, journal. Le commanditaire n'aurait
   pas à la découvrir.
3. **Elle est bornée.** Elle vaut pour le MVP. Si le client fait de la souveraineté une
   exigence contractuelle, l'option A redevient la bonne — et son chemin est déjà documenté.

## 5. Ce que la décision coûte, et qu'il faut dire

L'argument environnemental du cadrage n'est **pas** tenu, et l'honnêteté impose de ne pas le
recycler en avantage. L'argument de souveraineté non plus, et moins encore qu'on ne le croyait
en juillet : relevé le 11/09, les fonctions Vercel s'exécutent dans la région par défaut, aux
États-Unis (V14, pièce 31). Ce qui a été privilégié, c'est la fiabilité du livrable à trois sessions
d'une échéance non négociable, contre un bénéfice réel mais non fonctionnel.

C'est le type même de l'arbitrage de fin de projet : **on ne choisit pas entre une bonne et une
mauvaise option, on choisit laquelle des deux pertes on accepte.** Ici, perdre un argument de
cadrage a été jugé moins grave que risquer un dépôt.

## 6. La leçon de pilotage

L'écart n'aurait pas dû être découvert en juillet. L'infrastructure de développement a été
posée en mai, avant l'oral de cadrage, et le support du Bloc 1 a annoncé autre chose sans que
la contradiction soit relevée. **Un cadrage doit être confronté à l'existant au moment où il
est rédigé, pas deux mois plus tard.** C'est une défaillance de contrôle, pas de décision — et
la décision de juillet n'a fait que gérer au mieux ses conséquences.
