import { describe, expect, it } from "vitest";
import {
	assignEquipmentSchema,
	equipmentTypeSchema,
	newEquipmentSchema,
	updateEquipmentStatusSchema,
} from "./equipment";

describe("newEquipmentSchema — validation", () => {
	it("refuse un nom vide ou blanc", () => {
		expect(newEquipmentSchema.safeParse({ name: "", type: "pc" }).success).toBe(
			false,
		);
		expect(
			newEquipmentSchema.safeParse({ name: "   ", type: "pc" }).success,
		).toBe(false);
	});

	it("refuse un nom manquant", () => {
		expect(newEquipmentSchema.safeParse({ type: "pc" }).success).toBe(false);
	});

	it("refuse un type invalide", () => {
		expect(
			newEquipmentSchema.safeParse({ name: "Test", type: "robot" }).success,
		).toBe(false);
	});

	it("accepte une entrée valide et tous les types connus", () => {
		for (const type of equipmentTypeSchema.options) {
			expect(newEquipmentSchema.safeParse({ name: "Test", type }).success).toBe(
				true,
			);
		}
	});

	it("refuse un statut inconnu", () => {
		expect(
			newEquipmentSchema.safeParse({
				name: "Test",
				type: "pc",
				status: "cassé",
			}).success,
		).toBe(false);
	});

	it("refuse une description de champ trop longue", () => {
		expect(
			newEquipmentSchema.safeParse({
				name: "Test",
				type: "pc",
				notes: "x".repeat(2001),
			}).success,
		).toBe(false);
	});
});

describe("newEquipmentSchema — défauts et normalisation", () => {
	it("statut par défaut : available", () => {
		const r = newEquipmentSchema.parse({ name: "Test", type: "pc" });
		expect(r.status).toBe("available");
	});

	it("préserve un statut explicite", () => {
		const r = newEquipmentSchema.parse({
			name: "Test",
			type: "pc",
			status: "broken",
		});
		expect(r.status).toBe("broken");
	});

	it("champs optionnels absents ou blancs normalisés à null", () => {
		const r = newEquipmentSchema.parse({
			name: "Test",
			type: "pc",
			brand: "  ",
		});
		expect(r.brand).toBeNull();
		expect(r.model).toBeNull();
		expect(r.serial_number).toBeNull();
		expect(r.notes).toBeNull();
		expect(r.assigned_to).toBeNull();
	});

	it("préserve (et trim) les champs optionnels fournis", () => {
		const r = newEquipmentSchema.parse({
			name: "Dell XPS",
			type: "pc",
			brand: " Dell ",
			model: "XPS 15",
			serial_number: "SN-1234",
		});
		expect(r.brand).toBe("Dell");
		expect(r.model).toBe("XPS 15");
		expect(r.serial_number).toBe("SN-1234");
	});
});

describe("updateEquipmentStatusSchema / assignEquipmentSchema", () => {
	it("refuse un id vide et un statut inconnu", () => {
		expect(
			updateEquipmentStatusSchema.safeParse({ id: "", status: "broken" })
				.success,
		).toBe(false);
		expect(
			updateEquipmentStatusSchema.safeParse({ id: "eq-1", status: "hs" })
				.success,
		).toBe(false);
		expect(
			updateEquipmentStatusSchema.safeParse({ id: "eq-1", status: "broken" })
				.success,
		).toBe(true);
	});

	it("assignation : userId null (désassigner) accepté, chaîne vide refusée", () => {
		expect(
			assignEquipmentSchema.safeParse({ id: "eq-1", userId: null }).success,
		).toBe(true);
		expect(
			assignEquipmentSchema.safeParse({ id: "eq-1", userId: "user-1" }).success,
		).toBe(true);
		expect(
			assignEquipmentSchema.safeParse({ id: "eq-1", userId: "" }).success,
		).toBe(false);
	});
});
