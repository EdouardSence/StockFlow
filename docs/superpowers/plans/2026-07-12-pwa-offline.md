# PWA Offline (#9) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** StockFlow installable en PWA, consultation offline des pages/données visitées, création d'incident hors-ligne avec file de synchronisation visible.

**Architecture:** `vite-plugin-pwa` en mode `generateSW` — le service worker ne fait que du cache (précache app shell + `NetworkFirst` sur navigations et server functions GET). La file d'incidents offline vit dans le code applicatif : logique pure testée en Vitest + wrapper IndexedDB natif + bandeau React global. Spec : `docs/superpowers/specs/2026-07-12-pwa-offline-design.md`.

**Tech Stack:** Bun, TanStack Start (SSR), vite-plugin-pwa 1.3.0 (déjà en devDependencies), IndexedDB natif (zéro nouvelle dépendance), Vitest, Playwright.

## Global Constraints

- Aucune nouvelle dépendance (`vite-plugin-pwa` est déjà installé).
- Biome doit rester vert (`bun run lint`), y compris règles `lint/a11y/*`. Indentation tabs, double quotes, commentaires en français.
- Commits : Conventional Commits, type anglais, description française (commitlint vérifie).
- La barrière de sécurité serveur (authMiddleware + RLS) ne change PAS. L'identité mise en cache côté client n'ouvre aucun droit.
- Ne jamais mettre en cache SW une réponse de server function POST.
- Données e2e : préfixe strict `e2e-ephemeral-` (constante `E2E_PREFIX`), suite e2e locale uniquement.
- Base path des server functions TanStack Start : `/_serverFn/` (vérifié dans `@tanstack/start-plugin-core`).

---

### Task 1 : Manifest — nettoyage et liaison dans le head

**Files:**
- Delete: `public/manifest.json` (reliquat TanStack « Create TanStack App Sample », périmé)
- Modify: `src/routes/__root.tsx:31-50` (fonction `head()`)

**Interfaces:**
- Produces: manifest lié — aucune API consommée par les tâches suivantes.

- [ ] **Step 1 : Supprimer le manifest périmé**

```bash
git rm public/manifest.json
```

`public/manifest.webmanifest` (déjà brandé StockFlow, icons icon-192/icon-512) est conservé tel quel.

- [ ] **Step 2 : Lier manifest + theme-color + apple-touch-icon dans `head()`**

Dans `src/routes/__root.tsx`, remplacer le bloc `head: () => ({ ... })` par :

```tsx
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#0f172a" },
			{ title: "StockFlow" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.webmanifest" },
			{ rel: "apple-touch-icon", href: "/icon-192.png" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
			},
		],
	}),
```

- [ ] **Step 3 : Vérifier**

Run: `bun run lint && bunx tsc --noEmit`
Expected: 0 erreur. Puis `bun run dev` (arrière-plan), `curl -s localhost:3000 | grep -o 'manifest.webmanifest\|theme-color'` → les deux présents. Arrêter le dev server.

- [ ] **Step 4 : Commit**

```bash
git add -A && git commit -m "fix(pwa): manifest StockFlow lié dans le head, suppression du manifest TanStack périmé (#9)"
```

---

### Task 2 : Service worker — câblage vite-plugin-pwa + enregistrement

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/routes/__root.tsx` (composant `RootDocument`, ligne ~54)

**Interfaces:**
- Produces: SW `/sw.js` généré au build, précache app shell, runtime cache `NetworkFirst` sur navigations (`sf-pages`) et server fns GET (`sf-data`).

- [ ] **Step 1 : Câbler VitePWA dans `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import { VitePWA } from 'vite-plugin-pwa';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enregistrement manuel dans __root.tsx (SSR : pas de virtual module côté serveur).
      injectRegister: null,
      // Le manifest existe déjà dans public/, le plugin ne doit pas en générer un.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,woff2,png,svg,ico}'],
        // App SSR : pas de index.html précaché, le fallback classique est inapplicable.
        navigateFallback: null,
        runtimeCaching: [
          {
            // Pages visitées, consultables hors-ligne (HTML rendu par le serveur).
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'sf-pages', networkTimeoutSeconds: 3 },
          },
          {
            // Lectures server functions uniquement — jamais les POST (mutations).
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/_serverFn/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: { cacheName: 'sf-data', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
});

export default config;
```

- [ ] **Step 2 : Enregistrer le SW côté client dans `RootDocument`**

Dans `src/routes/__root.tsx` : ajouter `useEffect` à l'import React existant (ou `import { useEffect } from "react";` s'il n'y en a pas), puis en tête de `RootDocument` :

```tsx
	// Enregistrement du service worker (prod uniquement : pas de SW généré en dev).
	useEffect(() => {
		if (import.meta.env.PROD && "serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js");
		}
	}, []);
```

- [ ] **Step 3 : Vérifier que le build produit le SW**

Run: `bun run build && find .output dist -name "sw.js" 2>/dev/null`
Expected: build vert, au moins un `sw.js` dans la sortie client servie (si `sw.js` est dans `dist/client` mais pas `.output/public`, ajuster : le vérifier AVANT de conclure — c'est le point d'intégration Nitro/vite-plugin-pwa le plus fragile du plan).

- [ ] **Step 4 : Lint + typecheck + commit**

Run: `bun run lint && bunx tsc --noEmit`

```bash
git add vite.config.ts src/routes/__root.tsx
git commit -m "feat(pwa): service worker Workbox câblé — précache app shell + NetworkFirst pages/server fns GET (#9)"
```

---

### Task 3 : Garde auth tolérante au hors-ligne

**Files:**
- Modify: `src/routes/__root.tsx:22-30` (`beforeLoad`)
- Modify: fichier appelant `logoutFn` (localiser : `grep -rn "logoutFn" src/routes src/components`)

**Interfaces:**
- Produces: clé localStorage `sf-offline-user` (JSON `{id,name,email,role}` — champs non sensibles uniquement). Consommée nulle part ailleurs.

- [ ] **Step 1 : Réécrire `beforeLoad`**

```tsx
	// Garde UX : redirige vers /login sans session. La vraie barrière de
	// sécurité reste côté serveur (authMiddleware sur les server functions).
	// Hors-ligne, getSessionFn échoue en erreur réseau : on retombe sur la
	// dernière identité connue (champs non sensibles) pour servir le shell —
	// les données affichées viennent du cache SW déjà autorisé, et toute
	// mutation repassera par le serveur (401 possible au flush).
	beforeLoad: async ({ location }) => {
		if (location.pathname === "/login") return {};
		let user: Awaited<ReturnType<typeof getSessionFn>>;
		try {
			user = await getSessionFn();
		} catch {
			if (typeof window !== "undefined") {
				const cached = window.localStorage.getItem("sf-offline-user");
				if (cached) return { user: JSON.parse(cached) };
			}
			throw redirect({ to: "/login" });
		}
		if (!user) throw redirect({ to: "/login" });
		if (typeof window !== "undefined") {
			window.localStorage.setItem("sf-offline-user", JSON.stringify(user));
		}
		return { user };
	},
```

Note : un 401/session absente ne lève pas — `getSessionFn` retourne `null` → redirect inchangé. Seul l'échec de transport (offline) entre dans le `catch`.

- [ ] **Step 2 : Purger l'identité cachée au logout**

Localiser l'appel à `logoutFn` (`grep -rn "logoutFn" src/`), et juste après l'appel réussi ajouter :

```tsx
			window.localStorage.removeItem("sf-offline-user");
```

- [ ] **Step 3 : Vérifier + commit**

Run: `bun run lint && bunx tsc --noEmit && bun run test` (les 94 tests existants restent verts)

```bash
git add -A && git commit -m "feat(pwa): garde auth tolérante au hors-ligne via identité en cache non sensible (#9)"
```

---

### Task 4 : File offline — logique pure (TDD)

**Files:**
- Create: `src/lib/offline-queue.ts`
- Test: `src/lib/offline-queue.test.ts`

**Interfaces:**
- Produces:
  - `type QueuedIncident = { id: string; equipment_id: string; description: string | null; queued_at: string }`
  - `flushItems(items: QueuedIncident[], send: (i: QueuedIncident) => Promise<void>): Promise<{ sent: QueuedIncident[]; remaining: QueuedIncident[]; aborted: boolean }>`
  - `isNetworkError(err: unknown): boolean`

- [ ] **Step 1 : Écrire les tests (échec attendu)**

`src/lib/offline-queue.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { flushItems, isNetworkError, type QueuedIncident } from "./offline-queue";

function item(id: string): QueuedIncident {
	return { id, equipment_id: `eq-${id}`, description: null, queued_at: "2026-07-12T00:00:00Z" };
}

describe("flushItems", () => {
	it("envoie tout dans l'ordre quand send réussit", async () => {
		const sentIds: string[] = [];
		const result = await flushItems([item("a"), item("b")], async (i) => {
			sentIds.push(i.id);
		});
		expect(sentIds).toEqual(["a", "b"]);
		expect(result.sent.map((i) => i.id)).toEqual(["a", "b"]);
		expect(result.remaining).toEqual([]);
		expect(result.aborted).toBe(false);
	});

	it("s'arrête au premier échec et conserve l'élément échoué + la suite", async () => {
		const result = await flushItems([item("a"), item("b"), item("c")], async (i) => {
			if (i.id === "b") throw new TypeError("Failed to fetch");
		});
		expect(result.sent.map((i) => i.id)).toEqual(["a"]);
		expect(result.remaining.map((i) => i.id)).toEqual(["b", "c"]);
		expect(result.aborted).toBe(true);
	});

	it("liste vide : rien envoyé, pas d'abort", async () => {
		const result = await flushItems([], async () => {});
		expect(result).toEqual({ sent: [], remaining: [], aborted: false });
	});
});

describe("isNetworkError", () => {
	it("TypeError (fetch qui échoue) = erreur réseau", () => {
		expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
	});
	it("Error serveur ordinaire ≠ erreur réseau", () => {
		expect(isNetworkError(new Error("validation"))).toBe(false);
		expect(isNetworkError("boom")).toBe(false);
	});
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `bun run test src/lib/offline-queue.test.ts`
Expected: FAIL — module `./offline-queue` introuvable.

- [ ] **Step 3 : Implémenter la logique pure**

`src/lib/offline-queue.ts` :

```ts
/**
 * File de synchronisation des incidents créés hors-ligne (#9).
 * Logique pure ici (testée en Vitest) ; persistance IndexedDB plus bas
 * (couverte par l'e2e — jsdom n'a pas d'IndexedDB).
 */

export type QueuedIncident = {
	id: string;
	equipment_id: string;
	description: string | null;
	queued_at: string;
};

export type FlushResult = {
	sent: QueuedIncident[];
	remaining: QueuedIncident[];
	aborted: boolean;
};

/** Un fetch qui échoue (offline, DNS…) lève TypeError — un rejet serveur, non. */
export function isNetworkError(err: unknown): boolean {
	return err instanceof TypeError;
}

/**
 * Envoie les éléments dans l'ordre. Au premier échec (réseau retombé ou rejet
 * serveur), s'arrête : l'élément en échec et la suite restent en file — pas de
 * perte, pas de doublon (les envoyés sont retirés par l'appelant).
 */
export async function flushItems(
	items: QueuedIncident[],
	send: (item: QueuedIncident) => Promise<void>,
): Promise<FlushResult> {
	const sent: QueuedIncident[] = [];
	for (let i = 0; i < items.length; i++) {
		try {
			await send(items[i]);
			sent.push(items[i]);
		} catch {
			return { sent, remaining: items.slice(i), aborted: true };
		}
	}
	return { sent, remaining: [], aborted: false };
}
```

- [ ] **Step 4 : Vérifier le vert**

Run: `bun run test src/lib/offline-queue.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/offline-queue.ts src/lib/offline-queue.test.ts
git commit -m "feat(pwa): logique pure de la file d'incidents offline, testée (#9)"
```

---

### Task 5 : File offline — persistance IndexedDB

**Files:**
- Modify: `src/lib/offline-queue.ts` (ajouter en fin de fichier)

**Interfaces:**
- Produces:
  - `enqueueIncident(input: { equipment_id: string; description: string | null }): Promise<void>`
  - `listQueued(): Promise<QueuedIncident[]>`
  - `removeQueued(id: string): Promise<void>`
  - Événement `window` : `"sf-queue-changed"` émis après enqueue/remove.

- [ ] **Step 1 : Ajouter le wrapper IndexedDB**

À la fin de `src/lib/offline-queue.ts` :

```ts
// ---------------------------------------------------------------------------
// Persistance IndexedDB (API native, pas de dépendance). Non testée en jsdom
// (pas d'IndexedDB) : couverte par le scénario e2e offline.
// ---------------------------------------------------------------------------

const DB_NAME = "stockflow-offline";
const STORE = "incident-queue";

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(STORE, { keyPath: "id" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function withStore<T>(
	mode: IDBTransactionMode,
	fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	const db = await openDb();
	try {
		return await requestToPromise(fn(db.transaction(STORE, mode).objectStore(STORE)));
	} finally {
		db.close();
	}
}

function notifyQueueChanged(): void {
	window.dispatchEvent(new CustomEvent("sf-queue-changed"));
}

export async function enqueueIncident(input: {
	equipment_id: string;
	description: string | null;
}): Promise<void> {
	const item: QueuedIncident = {
		id: crypto.randomUUID(),
		equipment_id: input.equipment_id,
		description: input.description,
		queued_at: new Date().toISOString(),
	};
	await withStore("readwrite", (s) => s.add(item));
	notifyQueueChanged();
}

export async function listQueued(): Promise<QueuedIncident[]> {
	const items = await withStore("readonly", (s) => s.getAll());
	// Ordre chronologique de saisie garanti à l'affichage comme au flush.
	return (items as QueuedIncident[]).sort((a, b) => a.queued_at.localeCompare(b.queued_at));
}

export async function removeQueued(id: string): Promise<void> {
	await withStore("readwrite", (s) => s.delete(id));
	notifyQueueChanged();
}
```

- [ ] **Step 2 : Vérifier + commit**

Run: `bun run lint && bunx tsc --noEmit && bun run test src/lib/offline-queue.test.ts`
Expected: vert (les tests purs ne touchent pas IndexedDB).

```bash
git add src/lib/offline-queue.ts
git commit -m "feat(pwa): persistance IndexedDB de la file d'incidents offline (#9)"
```

---

### Task 6 : Bandeau de synchronisation + intégration fiche équipement

**Files:**
- Create: `src/components/OfflineSyncBanner.tsx`
- Modify: `src/routes/__root.tsx` (`RootDocument`)
- Modify: `src/routes/equipment/$id.tsx:141-156` (`handleReportIncident`) + affichage du message dans les deux composants détail (même fichier)

**Interfaces:**
- Consumes: `enqueueIncident`, `listQueued`, `removeQueued`, `flushItems`, `isNetworkError` (Task 4/5) ; `createIncidentFn` (`src/lib/incidents.ts`).
- Produces: composant `<OfflineSyncBanner />` monté globalement.

- [ ] **Step 1 : Créer le bandeau**

`src/components/OfflineSyncBanner.tsx` :

```tsx
import { useCallback, useEffect, useState } from "react";
import { createIncidentFn } from "../lib/incidents";
import { flushItems, listQueued, removeQueued } from "../lib/offline-queue";

/**
 * Bandeau global : « N incident(s) en attente de synchronisation ».
 * Flush automatique au retour du réseau (event online) + bouton manuel.
 * Rendu nul quand la file est vide (donc aussi au SSR : état initial 0).
 */
export function OfflineSyncBanner() {
	const [count, setCount] = useState(0);
	const [syncing, setSyncing] = useState(false);

	const refresh = useCallback(async () => {
		try {
			setCount((await listQueued()).length);
		} catch {
			// IndexedDB indisponible (navigation privée stricte…) : pas de bandeau.
		}
	}, []);

	const sync = useCallback(async () => {
		setSyncing(true);
		try {
			const items = await listQueued();
			const result = await flushItems(items, async (item) => {
				await createIncidentFn({
					data: { equipment_id: item.equipment_id, description: item.description },
				});
			});
			// Retire uniquement les envoyés : un échec (réseau retombé, 401 après
			// expiration de session…) laisse le reste en file, rien n'est perdu.
			for (const item of result.sent) {
				await removeQueued(item.id);
			}
		} finally {
			setSyncing(false);
			await refresh();
		}
	}, [refresh]);

	useEffect(() => {
		refresh();
		const onChange = () => {
			refresh();
		};
		const onOnline = () => {
			sync();
		};
		window.addEventListener("sf-queue-changed", onChange);
		window.addEventListener("online", onOnline);
		return () => {
			window.removeEventListener("sf-queue-changed", onChange);
			window.removeEventListener("online", onOnline);
		};
	}, [refresh, sync]);

	if (count === 0) return null;
	return (
		<div
			role="status"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: 12,
				padding: "8px 16px",
				background: "var(--sf-bg-subtle, #1c1c22)",
				borderBottom: "1px solid var(--sf-border, #2e2e35)",
				color: "var(--sf-fg, #ededef)",
				fontSize: 13,
			}}
		>
			{count} incident{count > 1 ? "s" : ""} en attente de synchronisation
			<button
				type="button"
				onClick={sync}
				disabled={syncing}
				style={{
					padding: "4px 12px",
					borderRadius: 6,
					border: "1px solid var(--sf-border, #2e2e35)",
					background: "transparent",
					color: "inherit",
					cursor: syncing ? "wait" : "pointer",
					font: "inherit",
				}}
			>
				{syncing ? "Synchronisation…" : "Synchroniser"}
			</button>
		</div>
	);
}
```

Avant d'écrire les fallbacks de tokens, vérifier les noms réels dans `src/styles.css` (`grep -o '\-\-sf-[a-z-]*' src/styles.css | sort -u`) et utiliser les tokens existants.

- [ ] **Step 2 : Monter le bandeau dans `RootDocument`**

Dans `src/routes/__root.tsx`, dans le `<body>` juste avant `{children}` :

```tsx
				<OfflineSyncBanner />
```

avec l'import `import { OfflineSyncBanner } from "../components/OfflineSyncBanner";`.

- [ ] **Step 3 : Basculer la création d'incident sur la file en cas d'échec réseau**

Dans `src/routes/equipment/$id.tsx`, ajouter un état à côté des états existants (`reporting`, `reportError`, `incidentReported`) :

```tsx
	const [reportedOffline, setReportedOffline] = useState(false);
```

et remplacer `handleReportIncident` (lignes ~141-156) par :

```tsx
	// Ne touche pas equipment.status : c'est l'admin qui qualifie ensuite
	// l'incident depuis l'écran /incidents (choix « manuel » assumé).
	async function handleReportIncident(description: string | null) {
		if (!equipment) return;
		setReporting(true);
		setReportError(null);
		try {
			await createIncidentFn({
				data: { equipment_id: equipment.id, description },
			});
			setIncidentReported(true);
			await router.invalidate();
		} catch (err) {
			if (isNetworkError(err)) {
				// Hors-ligne : on met en file locale, la sync se fera au retour réseau.
				await enqueueIncident({ equipment_id: equipment.id, description });
				setReportedOffline(true);
			} else {
				setReportError(err instanceof Error ? err.message : "Erreur inconnue");
			}
		} finally {
			setReporting(false);
		}
	}
```

avec l'import `import { enqueueIncident, isNetworkError } from "../../lib/offline-queue";`.

- [ ] **Step 4 : Afficher le message offline dans les deux composants détail**

Toujours dans `src/routes/equipment/$id.tsx` : passer `reportedOffline={reportedOffline}` à `<MobileEquipmentDetail>` et `<DesktopEquipmentDetail>` (props typées `reportedOffline: boolean`), et dans chacun, à l'endroit exact où le message de succès existant « Panne signalée · un administrateur qualifiera l'incident » est rendu (le localiser : `grep -n "Panne signalée" src/routes/equipment/$id.tsx`), ajouter le rendu jumeau :

```tsx
			{reportedOffline && (
				<p role="status" style={{ /* mêmes styles que le message de succès voisin */ }}>
					Incident enregistré hors-ligne · il sera synchronisé au retour du réseau
				</p>
			)}
```

Reprendre à l'identique les styles du message voisin (ne pas inventer de nouveaux styles).

- [ ] **Step 5 : Vérifier + commit**

Run: `bun run lint && bunx tsc --noEmit && bun run test`
Expected: tout vert.

```bash
git add src/components/OfflineSyncBanner.tsx src/routes/__root.tsx "src/routes/equipment/\$id.tsx"
git commit -m "feat(pwa): création d'incident hors-ligne avec file visible et sync au retour réseau (#9)"
```

---

### Task 7 : Scénario e2e offline

**Files:**
- Create: `e2e/offline.spec.ts`

**Interfaces:**
- Consumes: `login`, `MOBILE_VIEWPORT`, `waitHydrated` (`e2e/support/helpers.ts`) ; `createEphemeralEquipment`, `queryAsAdmin`, `E2E_PREFIX`, `E2E_TECH` (`e2e/support/db.ts`).

Limite assumée : la suite tourne contre le serveur dev (pas de SW en dev) — ce scénario couvre la **file de sync** (code applicatif). La consultation offline via SW est vérifiée manuellement sur build de prod (Task 8).

- [ ] **Step 1 : Écrire le scénario**

`e2e/offline.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { createEphemeralEquipment, E2E_PREFIX, E2E_TECH, queryAsAdmin } from "./support/db";
import { login, MOBILE_VIEWPORT, waitHydrated } from "./support/helpers";

const EQ_ID = `${E2E_PREFIX}offline-eq`;
const EQ_NAME = `${E2E_PREFIX}PC cave sans réseau`;
const DESCRIPTION = `${E2E_PREFIX}incident saisi hors-ligne`;

test.beforeAll(async () => {
	await createEphemeralEquipment({ id: EQ_ID, name: EQ_NAME });
});

test("OF1 — incident créé hors-ligne : mis en file, puis synchronisé au retour réseau", async ({
	browser,
}) => {
	const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
	const page = await context.newPage();
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto(`/equipment/${EQ_ID}`);
	await waitHydrated(page);

	// Coupure réseau APRÈS chargement de la fiche (cas terrain : cave).
	await context.setOffline(true);
	await page.getByRole("button", { name: "Signaler panne" }).click();
	await page.fill("#incident-description", DESCRIPTION);
	await page.getByRole("button", { name: "Envoyer le signalement" }).click();

	// Mis en file localement, pas en base.
	await expect(
		page.getByText("Incident enregistré hors-ligne · il sera synchronisé au retour du réseau"),
	).toBeVisible();
	await expect(
		page.getByText("1 incident en attente de synchronisation"),
	).toBeVisible();
	const before = await queryAsAdmin("SELECT 1 FROM incidents WHERE description = $1", [
		DESCRIPTION,
	]);
	expect(before.rowCount).toBe(0);

	// Retour réseau : flush automatique (event online).
	await context.setOffline(false);
	await expect(
		page.getByText("en attente de synchronisation"),
	).toBeHidden({ timeout: 15_000 });

	const after = await queryAsAdmin(
		"SELECT status, reported_by FROM incidents WHERE description = $1",
		[DESCRIPTION],
	);
	expect(after.rowCount).toBe(1);
	expect(after.rows[0].status).toBe("open");
	expect(after.rows[0].reported_by).toBe(E2E_TECH.id);
	await context.close();
});
```

- [ ] **Step 2 : Lancer la suite e2e complète (local, base partagée — supervision)**

Run: `bun run test:e2e`
Expected: 32 scénarios verts (31 existants + OF1). Si le flush automatique est flaky (timing de l'event online), remplacer l'attente par un clic explicite sur le bouton « Synchroniser » — le flush manuel fait partie du contrat.

- [ ] **Step 3 : Commit**

```bash
git add e2e/offline.spec.ts
git commit -m "test(pwa): scénario e2e création d'incident hors-ligne et synchronisation (#9)"
```

---

### Task 8 : Vérification prod, documentation, fermeture #9

**Files:**
- Modify: `docs/certification/18-architecture.md` (nouvelle section)
- Modify: `PROGRESS.md`
- Modify: `docs/certification/11-harnais-de-tests.md` (compteurs : +5 vitest, +1 e2e)

- [ ] **Step 1 : Vérification manuelle du SW sur build de prod**

```bash
bun run build && bun run start   # ou la commande preview du repo (voir package.json)
```

Dans Chromium : DevTools → Application → Service Workers (SW actif), puis Network → Offline → naviguer vers une fiche équipement déjà visitée → elle s'affiche depuis le cache `sf-pages`/`sf-data`. Noter le résultat (captures éventuelles dans `docs/certification/captures/`).

- [ ] **Step 2 : Documenter**

Dans `18-architecture.md`, ajouter une section « Fonctionnement hors-ligne (PWA) » : mode generateSW, stratégie NetworkFirst (pages + server fns GET, jamais les POST), file IndexedDB applicative avec flush visible, garde auth dégradée (identité non sensible en cache, barrière serveur inchangée), limite assumée (seule la création d'incident est offline). Mettre à jour `PROGRESS.md` (session 2026-07-12) et les compteurs de `11-harnais-de-tests.md`.

- [ ] **Step 3 : Vérification finale complète**

Run: `bun run lint && bunx tsc --noEmit && bun run test && bun run build`
Expected: tout vert.

- [ ] **Step 4 : Commit + fermeture**

```bash
git add -A && git commit -m "docs(pwa): section offline dans l'architecture, PROGRESS et compteurs de tests (#9)" && git push
gh issue close 9 --comment "PWA offline livrée : vite-plugin-pwa câblé (generateSW, précache app shell, NetworkFirst pages + server fns GET), manifest StockFlow lié dans le head, garde auth tolérante au hors-ligne (identité non sensible en cache, barrière serveur inchangée), création d'incident hors-ligne via file IndexedDB avec bandeau de synchronisation visible (flush auto au retour réseau + bouton manuel). Tests : 5 unitaires (logique de file), scénario e2e OF1 (offline → file → sync → ligne en base). Vérification manuelle SW sur build de prod documentée dans 18-architecture.md."
```

Puis déplacer la carte #9 en « Fait » sur le Kanban (projet 3).
