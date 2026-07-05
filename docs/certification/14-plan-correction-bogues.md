# 14 — Plan de correction des bogues

## Modèle (issue #3)

Chaque bug/dette découvert(e) donne lieu à une issue GitHub qualifiée avant correction :
inventaire par catégorie, cause, plan d'action. L'issue est fermée avec un commentaire résumant
les correctifs réellement appliqués — pas fermée silencieusement.

Voir issue [#3](https://github.com/EdouardSence/StockFlow/issues/3) — dette lint (13 erreurs de
build, a11y notamment), ouverte puis fermée avec résumé des correctifs le 2026-07-02.

## Synthèse du suivi qualité et plan de correction

### Méthodologie
Le suivi qualité et la gestion de la dette technique de StockFlow sont structurés selon une méthodologie rigoureuse en trois phases :
1. **Find (Détection) / Revue Adversariale** : Audit de sécurité multi-agents avec validation et réfutation indépendante (scénarios d'attaque concrets requis), revues d'accessibilité RGAA/Biome, et analyse continue de la dette d'implémentation.
2. **Verify (Qualification & Dédoublonnage)** : Analyse de la pertinence des défauts signalés et filtrage des doublons (par exemple, l'issue [#3](https://github.com/EdouardSence/StockFlow/issues/3) résolvant la dette lint Biome).
3. **Triage & Suivi** : Catégorisation des anomalies par périmètre (*Sécurité*, *Accessibilité*, *Fonctionnel*, *Dette technique*), assignation d'une sévérité (*Critical* à *Low*, ou *N/A* pour les limitations de conception), et planification par session de développement (sessions 2, 6, 7, 9, 10, 11).

Le suivi opérationnel de ce plan est centralisé sur le Kanban du projet :
👉 **[StockFlow — Suivi qualité & certification](https://github.com/users/EdouardSence/projects/3)**

### Constat transversal sur l'architecture Row Level Security (RLS)
L'analyse de sécurité a mis en évidence une limitation intrinsèque à notre implémentation de la RLS : les claims JWT étant propagés manuellement via une transaction `SET LOCAL app.role` (car `auth.uid()` natif est indisponible hors Supabase Auth), la RLS protège efficacement contre l'omission accidentelle du contexte d'authentification (`withAuthContext` agissant en fail-closed) et contre l'accès direct via l'API PostgREST anonyme (`anon`). Cependant, sous l'hypothèse d'une compromission totale de la connexion applicative (permettant l'exécution de SQL arbitraire), un attaquant peut manuellement forger son rôle et s'auto-promouvoir admin. La RLS doit donc être défendue devant le jury comme un outil robuste de prévention des bugs de requêtes et de protection de la surface publique, mais non comme une garantie absolue contre une fuite ou compromission de la connexion serveur elle-même.

