import { describe, expect, it } from "vitest";
import {
	flushItems,
	isNetworkError,
	type QueuedIncident,
} from "./offline-queue";

function item(id: string): QueuedIncident {
	return {
		id,
		equipment_id: `eq-${id}`,
		description: null,
		queued_at: "2026-07-12T00:00:00Z",
	};
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
		const result = await flushItems(
			[item("a"), item("b"), item("c")],
			async (i) => {
				if (i.id === "b") throw new TypeError("Failed to fetch");
			},
		);
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
