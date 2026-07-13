import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { EquipmentTable } from "../db/types";
import {
	assignEquipment,
	EquipmentNotFoundError,
	EquipmentUnavailableError,
} from "./equipment-domain";

function makeEquipment(
	status: EquipmentTable["status"],
	assigned_to: string | null = null,
): EquipmentTable {
	return {
		id: "eq-1",
		name: "Dell XPS",
		type: "pc",
		brand: "Dell",
		model: "XPS 15",
		serial_number: "SN-1",
		qr_code: "qr-1",
		status,
		assigned_to,
		notes: null,
		created_at: "2026-07-01T00:00:00.000Z",
		updated_at: "2026-07-01T00:00:00.000Z",
	};
}

function runEither<A, E>(effect: Effect.Effect<A, E>) {
	return Effect.runSync(Effect.either(effect));
}

describe("assignEquipment — introuvable", () => {
	it("échoue avec EquipmentNotFoundError si l'équipement est null", () => {
		const result = runEither(assignEquipment("eq-404", null, "user-1"));
		expect(result._tag).toBe("Left");
		if (result._tag === "Left") {
			expect(result.left).toBeInstanceOf(EquipmentNotFoundError);
			expect(result.left.id).toBe("eq-404");
		}
	});
});

describe("assignEquipment — assignation (userId non-null)", () => {
	it("depuis available : réussit, statut -> assigned", () => {
		const eq = makeEquipment("available");
		const result = runEither(assignEquipment(eq.id, eq, "user-1"));
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.status).toBe("assigned");
			expect(result.right.assigned_to).toBe("user-1");
		}
	});

	it("depuis assigned (réassignation à un autre utilisateur) : réussit", () => {
		const eq = makeEquipment("assigned", "user-1");
		const result = runEither(assignEquipment(eq.id, eq, "user-2"));
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.status).toBe("assigned");
			expect(result.right.assigned_to).toBe("user-2");
		}
	});

	it("depuis broken : échoue avec EquipmentUnavailableError", () => {
		const eq = makeEquipment("broken");
		const result = runEither(assignEquipment(eq.id, eq, "user-1"));
		expect(result._tag).toBe("Left");
		if (result._tag === "Left") {
			expect(result.left).toBeInstanceOf(EquipmentUnavailableError);
			if (result.left instanceof EquipmentUnavailableError) {
				expect(result.left.status).toBe("broken");
			}
		}
	});

	it("depuis maintenance : échoue avec EquipmentUnavailableError", () => {
		const eq = makeEquipment("maintenance");
		const result = runEither(assignEquipment(eq.id, eq, "user-1"));
		expect(result._tag).toBe("Left");
		if (result._tag === "Left") {
			expect(result.left).toBeInstanceOf(EquipmentUnavailableError);
			if (result.left instanceof EquipmentUnavailableError) {
				expect(result.left.status).toBe("maintenance");
			}
		}
	});
});

describe("assignEquipment — désassignation (userId null)", () => {
	it("depuis available : réussit, reste available", () => {
		const eq = makeEquipment("available");
		const result = runEither(assignEquipment(eq.id, eq, null));
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.status).toBe("available");
			expect(result.right.assigned_to).toBeNull();
		}
	});

	it("depuis assigned : réussit, repasse à available", () => {
		const eq = makeEquipment("assigned", "user-1");
		const result = runEither(assignEquipment(eq.id, eq, null));
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.status).toBe("available");
			expect(result.right.assigned_to).toBeNull();
		}
	});

	it("depuis broken : réussit, statut broken préservé (pas écrasé à available)", () => {
		const eq = makeEquipment("broken", "user-1");
		const result = runEither(assignEquipment(eq.id, eq, null));
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.status).toBe("broken");
			expect(result.right.assigned_to).toBeNull();
		}
	});

	it("depuis maintenance : réussit, statut maintenance préservé", () => {
		const eq = makeEquipment("maintenance", "user-1");
		const result = runEither(assignEquipment(eq.id, eq, null));
		expect(result._tag).toBe("Right");
		if (result._tag === "Right") {
			expect(result.right.status).toBe("maintenance");
			expect(result.right.assigned_to).toBeNull();
		}
	});
});
