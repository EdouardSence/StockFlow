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
					data: {
						equipment_id: item.equipment_id,
						description: item.description,
					},
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
		<output
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
				background: "var(--sf-surface)",
				borderBottom: "1px solid var(--sf-border)",
				color: "var(--sf-fg)",
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
					border: "1px solid var(--sf-border)",
					background: "transparent",
					color: "inherit",
					cursor: syncing ? "wait" : "pointer",
					font: "inherit",
				}}
			>
				{syncing ? "Synchronisation…" : "Synchroniser"}
			</button>
		</output>
	);
}
