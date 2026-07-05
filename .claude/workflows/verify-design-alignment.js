export const meta = {
  name: 'verify-design-alignment',
  description: 'Vérification adversariale de l\'alignement design (dark Geist theme) sur les écrans existants de StockFlow',
  phases: [{ title: 'Verify', detail: '5 dimensions indépendantes' }],
}

// Chemin du repo : passer { repo: "/chemin/absolu" } via args ; sinon les agents
// travaillent dans le cwd de la session (racine du dépôt).
const REPO = (args && args.repo) || '.'

const CONTEXT = `
Repo: ${REPO} — StockFlow, TanStack Start (React 19).
Une session vient d'aligner visuellement des écrans EXISTANTS sur un nouveau design system
(thème sombre, hex/rgba, Geist + Geist Mono) importé depuis design-reference/StockFlow.dc.html
(Claude Design). Palette source de vérité (extraite du script DCLogic de ce fichier) :
STATUS map equipment.status: available #34d399/#10b981/rgba(16,185,129,.1)/rgba(16,185,129,.28),
assigned #a5b4fc/#6366f1/rgba(99,102,241,.1)/rgba(99,102,241,.28),
broken #fda4af/#f43f5e/rgba(244,63,94,.1)/rgba(244,63,94,.28),
maintenance #fcd34d/#f59e0b/rgba(245,158,11,.1)/rgba(245,158,11,.28).
Fond page #09090b, cartes #18181b, bordures #27272a/#3f3f46, texte #fafafa/#e4e4e7/#a1a1aa/#71717a.
Périmètre STRICT : src/routes/login.tsx, src/routes/scan.tsx, src/routes/index.tsx,
src/routes/equipment/{index,new,\\$id}.tsx, src/components/{Sidebar,StatusBadge,MobileLayout,FakeQR}.tsx,
src/styles.css, src/routes/__root.tsx (police uniquement).
NE PAS signaler : design-reference/ dans le repo (sera supprimé après cette vérification),
FakeQR.tsx toujours en oklch clair (mort/non utilisé, décision explicite de ne pas y toucher),
absence de lien cliquable liste→détail équipement (bug pré-existant hors scope visuel).
`

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'severity', 'summary', 'evidence'],
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { type: 'string', enum: ['blocker', 'high', 'medium', 'low'] },
          summary: { type: 'string' },
          evidence: { type: 'string', description: 'citation exacte du code fautif' },
        },
      },
    },
  },
}

const DIMENSIONS = [
  {
    key: 'a11y-regression',
    prompt: `${CONTEXT}
Audite UNIQUEMENT src/routes/equipment/new.tsx. Le pattern d'accessibilité déjà tranché pour le
sélecteur de type d'équipement est : un <fieldset> (pas de role="group" custom nécessaire,
le fieldset natif suffit) avec un <legend> visuellement masqué (clip-path/position absolute,
PAS display:none ni aria-hidden), et chaque input nommé a un <label htmlFor> correspondant
(sauf le groupe de boutons de type, qui utilise fieldset/legend au lieu d'un label direct).
Vérifie ligne par ligne que ce pattern est INTACT après les retouches visuelles de cette
session : le fieldset et son legend existent toujours, le legend est toujours visuellement
masqué correctement (pas juste supprimé), chaque input a toujours son label associé par id/
htmlFor, aucun aria-* n'a été perdu. Signale UNIQUEMENT une régression réelle et démontrable
(citation du code), pas une suggestion d'amélioration au-delà de ce qui existait avant.`,
  },
  {
    key: 'typography-audit',
    prompt: `${CONTEXT}
Audite la cohérence typographique sur TOUS les fichiers du périmètre listé. Règle : le texte
courant utilise --sf-sans (Geist), et les VALEURS TECHNIQUES (qr_code, serial_number, id
d'équipement/utilisateur, tout identifiant tronqué type "8599f4f1") utilisent --sf-mono
(Geist Mono) via fontFamily: "var(--sf-mono)". Cherche des endroits où une valeur technique
(id, qr_code, serial_number affiché à l'utilisateur) est rendue SANS var(--sf-mono) — c'est
une incohérence à signaler. Cherche aussi l'inverse : du texte non-technique qui utiliserait
--sf-mono par erreur. Vérifie aussi que src/routes/__root.tsx charge bien Geist ET Geist Mono
(pas seulement l'un des deux) depuis Google Fonts. Cite le fichier:ligne et le texte exact.`,
  },
  {
    key: 'token-compliance',
    prompt: `${CONTEXT}
Cherche dans TOUS les fichiers du périmètre toute couleur codée en dur qui NE correspond PAS
au nouveau vocabulaire (var(--sf-*) ou les valeurs hex/rgba listées dans le CONTEXTE ci-dessus
pour primary/success/danger/warning). Concrètement : grep mental pour "oklch(" restants (sauf
FakeQR.tsx, exclu), pour des couleurs hex/rgb qui ressemblent à des vestiges de l'ancien thème
clair (ex: blancs purs #fff en dehors d'un contexte QR code légitime, gris clairs), ou des
couleurs one-off inventées qui ne correspondent à aucun rôle sémantique du design (primary/
success/danger/warning/neutre). Pour chaque trouvaille, cite le fichier:ligne et la valeur
exacte, et explique en une phrase pourquoi elle est incohérente avec le reste de la palette.`,
  },
  {
    key: 'scope-compliance',
    prompt: `${CONTEXT}
Vérifie qu'AUCUN nouvel écran hors périmètre n'a été construit pendant cette session. Cherche
spécifiquement : un tableau de bord administrateur (KPI grid, tableau du parc informatique
avec colonnes ID/Équipement/Type/Assigné/Statut/Actions), un panneau "Incidents ouverts", une
vue "Technicien Terrain" complète avec réassignation d'appareil, une file de synchronisation
hors-ligne / bandeau "mode hors-ligne". Si tu trouves la moindre trace de code implémentant
un de ces écrans (nouveau fichier route, nouveau composant, nouvelle section substantielle
dans un fichier existant), signale-le en 'blocker' — c'est un dépassement de périmètre. Si
rien de tel n'existe (juste du restyle sur les écrans déjà présents), retourne findings: [].`,
  },
  {
    key: 'visual-fidelity',
    prompt: `${CONTEXT}
Lis design-reference/StockFlow.dc.html (le design de référence complet, avec la palette et le
script DCLogic) ET les fichiers réels du périmètre (au moins src/styles.css,
src/components/StatusBadge.tsx, src/routes/login.tsx, src/routes/equipment/index.tsx). Évalue
la fidélité du portage : rayons de bordure (design : 10-14px boutons/inputs, 16-18px cartes,
999px pills, 20px modales), l'esthétique générale des cartes (fond #18181b, bordure #27272a,
padding généreux ~18-22px), le bouton primaire (gradient indigo #6366f1→#4f46e5 avec ombre
glow, pas un aplat plat). Signale tout écart NOTABLE de fidélité (pas des micro-différences
de 1-2px) avec citation précise fichier:ligne des deux côtés (référence vs réel).`,
  },
]

phase('Verify')
const results = await parallel(
  DIMENSIONS.map((d) => () =>
    agent(d.prompt, { label: `verify:${d.key}`, phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' })
      .then((r) => ({ dimension: d.key, findings: r?.findings ?? [] })),
  ),
)

const all = results.filter(Boolean)
const totalFindings = all.reduce((n, r) => n + r.findings.length, 0)
log(`${totalFindings} findings bruts sur ${all.length} dimensions`)
return all
