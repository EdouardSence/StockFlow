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
		return await requestToPromise(
			fn(db.transaction(STORE, mode).objectStore(STORE)),
		);
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
	return (items as QueuedIncident[]).sort((a, b) =>
		a.queued_at.localeCompare(b.queued_at),
	);
}

export async function removeQueued(id: string): Promise<void> {
	await withStore("readwrite", (s) => s.delete(id));
	notifyQueueChanged();
}
