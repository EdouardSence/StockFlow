# 10 — Accessibilité

> **Document vivant.** Audit RGAA réalisé le 2026-07-07 (issue #19) en conditions aussi
> réelles que le permet l'environnement (Chromium headless, arbre d'accessibilité réel,
> navigation clavier scriptée, calcul de contraste WCAG). Pas de test avec un lecteur
> d'écran audio (NVDA/VoiceOver) — limitation d'environnement, voir § Hors périmètre.

## Socle mécanique (acquis avant cet audit)

Règles Biome `lint/a11y/*` au vert sur tout le repo (voir issue #3) : titres SVG,
`aria-hidden` sur les icônes décoratives, `aria-label` sur les boutons icône seuls,
`fieldset`/`legend` pour les groupes de contrôles. Ce socle est nécessaire mais pas
suffisant — c'est ce que cet audit vérifie en conditions d'usage réelles.

## Méthode

Script Playwright (`chromium`, headless) contre le serveur dev réel, comptes éphémères
(`e2e-ephemeral-`, nettoyés après coup) :

1. **Arbre d'accessibilité** (`locator("body").ariaSnapshot()`) sur les écrans principaux
   — c'est le même arbre que consulte un lecteur d'écran réel (noms accessibles calculés
   par Chromium, pas une approximation).
2. **Navigation clavier scriptée** (`Tab` répété + lecture de `document.activeElement` et
   de son `outline` calculé) sur les formulaires principaux et le flux non authentifié.
3. **Contraste WCAG** calculé formellement (luminance relative, formule officielle) sur
   toutes les paires texte/fond des tokens `--sf-*` de `styles.css`, seuils AA (4.5:1 texte
   normal, 3:1 composants UI/texte large).

## Écrans couverts

Dashboard (admin), liste équipements, création équipement, incidents (admin), compte
(self-service mot de passe), gestion des utilisateurs (admin), fiche équipement mobile
(technicien), scan mobile, login (non authentifié).

## Constat par arbre d'accessibilité

Aucun bouton, lien ou champ sans nom accessible sur les 9 écrans audités. Chaque champ de
formulaire a un `<label htmlFor>` associé ou un `aria-label` (radiogroup type
d'équipement, issue #11). Tableaux avec `columnheader` nommés — **une exception trouvée et
corrigée pendant cet audit** : la colonne d'actions de `/admin/users` avait un `<th>` vide
(aucun nom pour un lecteur d'écran naviguant par en-têtes de colonne) ; corrigé avec un
libellé visuellement masqué (« Actions »), même patron que le `legend` du radiogroup.

## Constat par navigation clavier — anomalie trouvée et corrigée (issue #25)

`styles.css` définit une règle globale `input:focus-visible { outline: 2px solid
rgba(99,102,241,.5) }`, mais elle n'avait **jamais d'effet réel** : un `outline: "none"`
inline était présent dans les objets de style (`fieldStyle`) de 5 fichiers
(`login.tsx`, `equipment/new.tsx`, `equipment/index.tsx`, `account.tsx`,
`admin/users.tsx`). Un style inline React a une spécificité CSS supérieure à toute règle
externe : le style global ne s'appliquait donc jamais, et **aucun champ texte de
l'application n'affichait d'indicateur de focus visible au clavier** — violation directe
de WCAG 2.4.7 / RGAA critère 12.

Vérifié empiriquement avant/après :

| Élément | Avant | Après |
|---|---|---|
| `#login-email`, `#login-password` | `outline-style: none` | `outline: 2px solid rgba(99,102,241,.5)` |
| `#equipment-name`, `#equipment-brand`, `#equipment-model`, `#equipment-serial` | `outline-style: none` | idem |
| Recherche équipement, `/account`, `/admin/users` | `outline-style: none` | idem |
| Boutons (`Se connecter`, `Retour`, …) | déjà correct (`outline: solid 2px`) | inchangé |

Correctif : suppression des 5 `outline: "none"` inline — la règle globale déjà correcte
prend le relai automatiquement, aucune nouvelle règle CSS nécessaire.

Ordre de tabulation vérifié sur `/equipment/new` (12 arrêts) et `/login` (4 arrêts) :
séquentiel, logique (sidebar → contenu → formulaire dans l'ordre visuel), pas de piège
clavier, la tabulation quitte proprement le formulaire de login vers `document.body`
après le bouton de soumission.

## Constat par contraste (WCAG, calculé formellement)

18 paires vérifiées contre les tokens de `styles.css`. Deux échecs trouvés et corrigés :

| Paire | Ratio avant | Seuil | Verdict |
|---|---|---|---|
| `--sf-fg-faint` (texte métadonnées, 10–11px) / fond carte | 3.67:1 | 4.5:1 | ❌ → corrigé |
| Texte blanc / bouton dégradé (pire pixel, coin `primary`) | 4.47:1 | 4.5:1 | 🟡 évalué, sans impact pratique |

`--sf-fg-faint` était utilisé pour du texte réel (pas décoratif) sur `login.tsx`,
`incidents.tsx`, `index.tsx` (dashboard) : identifiants tronqués, dates, libellé
« Non attribué ». Corrigé : `#71717a` → `#84848d` (même famille zinc, +0,9:1 de marge,
4,78:1 mesuré).

Le bouton dégradé (`linear-gradient(135deg, primary, primary-strong)`) n'atteint 4,47:1
qu'au pixel exact du coin où domine `--sf-primary` seul ; le texte du bouton est centré et
recouvre donc le point médian du dégradé, mesuré à 5,31:1 — au-dessus du seuil en
pratique. Pas de correctif appliqué, mais résiduel documenté plutôt que passé sous
silence.

Toutes les autres paires (texte principal, texte doux, texte atténué sur fond carte et
sur surfaces, badges de statut succès/danger/warning, focus clavier, badge « sélectionné »
du radiogroup) passent avec une marge confortable (≥ 5,8:1 partout ailleurs).

## Anomalies trouvées pendant cet audit

| ID | Anomalie | Sévérité | Suivi |
|----|----------|----------|-------|
| — | `outline: "none"` inline annule le focus clavier visible sur tous les champs texte (5 fichiers) | High (bloquant clavier) | [Issue #25](https://github.com/EdouardSence/StockFlow/issues/25) — **corrigée** le jour même |
| — | `<th>` vide (colonne Actions) sur `/admin/users`, sans nom pour lecteur d'écran | Low | Corrigée dans le même commit que #25 (pas d'issue séparée, périmètre de cet audit) |
| — | `--sf-fg-faint` sous le seuil AA (3,67:1) pour du texte réel ≤ 11px | Medium | Corrigée dans le même commit (token `styles.css`) |

## Hors périmètre de cet audit

- **Lecteur d'écran audio réel** (NVDA, JAWS, VoiceOver) : non testé — environnement
  headless Linux sans sortie audio. L'arbre d'accessibilité Chromium (§ Méthode) est la
  meilleure proxy disponible ; il reflète les mêmes noms/rôles/valeurs qu'un lecteur
  d'écran consommerait, mais ne vérifie pas le phrasé ou l'ordre de lecture réel annoncé.
- **Zoom / reflow à 400 %** (RGAA 10.7) : non vérifié formellement.
- **Contraste du texte sur images** (aucune image de contenu textuel dans l'app —
  non applicable).
- **Navigation clavier exhaustive de chaque écran** : vérifiée sur `/login` et
  `/equipment/new` (formulaires les plus denses) comme échantillon représentatif, pas
  rejouée sur les 9 écrans un par un.

## Synthèse

Aucune anomalie bloquante résiduelle après corrections. Le socle mécanique (Biome) plus
cet audit couvrent noms accessibles, structure de formulaire, focus clavier visible et
contraste — les quatre axes RGAA les plus fréquemment cassés dans une SPA React. Les
limitations documentées ci-dessus (lecteur d'écran audio, reflow 400 %) sont des tests
manuels sur poste réel, pas automatisables dans cet environnement — à date pour une
prochaine session si le jury de certification l'exige.
