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
