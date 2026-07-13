# 08 — Historique des versions

## Tags

| Tag | Date | Contenu |
|---|---|---|
| `v0.2.0` | 2026-07-03 | Retrofit session 0 bis — CRUD équipements, scan, génération QR, sans auth ni RLS |
| `v0.3.0` | 2026-07-04 | Authentification JWT RS256 + RBAC + Row Level Security |
| `v0.4.0` | 2026-07-13 | Incidents, sécurité consolidée, accessibilité auditée, PWA offline |

## Convention de commit

Conventional Commits, message en français, type en anglais : `type(scope): description`
(`feat|fix|docs|style|refactor|perf|test|chore`), imposée par `commitlint` (hook `commit-msg`,
voir `commitlint.config.js`). Décidée pour que l'historique reste lisible en revue sans
traduction, tout en restant parsable par l'outillage standard (changelog, semver).

## Un exemple de rigueur : la correction post-revue de sécurité (session 3)

La revue adversariale du lot auth+RLS (session 2, tag `v0.3.0`) a fait remonter 7 défauts
(détail complet dans `09-securisation.md`). Plutôt que de corriger ces défauts en réécrivant
l'historique (`rebase -i` sur les commits `feat(auth)`/`feat(db)` déjà écrits, pour donner
l'illusion que le code avait toujours été correct), chaque correctif a été appliqué comme un
commit `fix:` distinct, après coup, sur une base propre :

```
5d3904a docs: consigne honnêtement la revue de sécurité adversariale
184867b fix(observability): désactive sendDefaultPii de Sentry
dc77c88 fix(auth): rate limiter clé IP+email, purge des entrées expirées
bfac229 fix(auth): durcit la rotation et la révocation du refresh token
13a40d9 fix(db): rejette le fail-open RLS si APP_POSTGRES_URL est absent
bfa8551 docs: documente l'architecture auth + RLS pour la certification
aca98be feat(db): active la Row Level Security en défense en profondeur
05b562b feat(auth): ajoute l'authentification JWT RS256 + RBAC
```

Ce choix est délibéré : ces défauts ont été trouvés en interne, avant tout déploiement public,
par une revue adversariale volontaire — ils n'ont jamais été exploités en production. Réécrire
l'historique pour les faire disparaître aurait effacé la preuve que le processus de revue
fonctionne réellement (Find → Verify → Triage, voir `14-plan-correction-bogues.md`) ; les garder
comme commits `fix:` traçables et datés documente honnêtement le cycle qualité, plutôt que de
donner l'impression trompeuse d'un code parfait dès le premier jet — ou pire, celle d'une faille
réellement vécue en prod puis corrigée dans l'urgence, ce qui n'est pas ce qui s'est produit.
