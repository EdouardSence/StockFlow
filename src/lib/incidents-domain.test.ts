import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { IncidentsTable } from "../db/types";
import {
	InvalidIncidentTransitionError,
	nextIncidentStatus,
	transitionIncident,
} from "./incidents-domain";

function makeIncident(status: IncidentsTable["status"]): IncidentsTable {
	return {
		id: "inc-1",
		equipment_id: "eq-1",
		reported_by: "user-1",
		description: "Écran ne s'allume plus",
		status,
		created_at: "2026-07-01T00:00:00.000Z",
		resolved_at: null,
	};
}

describe("nextIncidentStatus", () => {
	it("open -> in_progress", () => {
		expect(nextIncidentStatus("open")).toBe("in_progress");
	});
	it("in_progress -> resolved", () => {
		expect(nextIncidentStatus("in_progress")).toBe("resolved");
	});
	it("resolved -> null (terminal)", () => {
		expect(nextIncidentStatus("resolved")).toBeNull();
	});
});

describe("transitionIncident", () => {
	const ALL: IncidentsTable["status"][] = ["open", "in_progress", "resolved"];
	const VALID: [IncidentsTable["status"], IncidentsTable["status"]][] = [
		["open", "in_progress"],
		["in_progress", "resolved"],
	];

	for (const from of ALL) {
		for (const to of ALL) {
			const isValid = VALID.some(([f, t]) => f === from && t === to);
			it(`${from} -> ${to} : ${isValid ? "accepté" : "rejeté"}`, () => {
				const result = Effect.runSync(
					Effect.either(transitionIncident(makeIncident(from), to)),
				);
				if (isValid) {
					expect(result._tag).toBe("Right");
					if (result._tag === "Right") {
						expect(result.right.status).toBe(to);
						if (to === "resolved") {
							expect(result.right.resolved_at).not.toBeNull();
						} else {
							expect(result.right.resolved_at).toBeNull();
						}
					}
				} else {
					expect(result._tag).toBe("Left");
					if (result._tag === "Left") {
						expect(result.left).toBeInstanceOf(InvalidIncidentTransitionError);
						expect(result.left.from).toBe(from);
						expect(result.left.to).toBe(to);
					}
				}
			});
		}
	}

	it("préserve resolved_at déjà posé quand la cible n'est pas resolved (cas impossible en pratique mais couvert)", () => {
		const incident = {
			...makeIncident("open"),
			resolved_at: "2026-06-01T00:00:00.000Z",
		};
		const result = Effect.runSync(
			Effect.either(transitionIncident(incident, "in_progress")),
		);
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.resolved_at).toBe("2026-06-01T00:00:00.000Z");
		}
	});
});
