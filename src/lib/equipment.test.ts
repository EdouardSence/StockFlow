import { describe, expect, it } from "vitest";
import {
	applyEquipmentDefaults,
	type NewEquipmentInput,
	validateNewEquipmentInput,
} from "./equipment";

describe("validateNewEquipmentInput", () => {
	it("returns error for empty name", () => {
		expect(validateNewEquipmentInput({ name: "", type: "pc" })).toBe(
			"Le nom est requis",
		);
	});

	it("returns error for whitespace-only name", () => {
		expect(validateNewEquipmentInput({ name: "   ", type: "pc" })).toBe(
			"Le nom est requis",
		);
	});

	it("returns error when name is missing", () => {
		expect(validateNewEquipmentInput({ type: "pc" })).toBe("Le nom est requis");
	});

	it("returns error for invalid type", () => {
		expect(
			validateNewEquipmentInput({ name: "Test", type: "robot" as never }),
		).toBe("Type invalide: robot");
	});

	it("returns null for valid input", () => {
		expect(
			validateNewEquipmentInput({ name: "MacBook", type: "pc" }),
		).toBeNull();
	});

	it("accepts all valid types", () => {
		const types: NewEquipmentInput["type"][] = ["pc", "screen", "printer", "other"];
		for (const type of types) {
			expect(validateNewEquipmentInput({ name: "Test", type })).toBeNull();
		}
	});
});

describe("applyEquipmentDefaults", () => {
	it("defaults status to available when not provided", () => {
		const result = applyEquipmentDefaults({ name: "Test", type: "pc" });
		expect(result.status).toBe("available");
	});

	it("preserves an explicit status", () => {
		const result = applyEquipmentDefaults({
			name: "Test",
			type: "pc",
			status: "broken",
		});
		expect(result.status).toBe("broken");
	});

	it("defaults nullable fields to null", () => {
		const result = applyEquipmentDefaults({ name: "Test", type: "pc" });
		expect(result.brand).toBeNull();
		expect(result.model).toBeNull();
		expect(result.serial_number).toBeNull();
		expect(result.notes).toBeNull();
		expect(result.assigned_to).toBeNull();
	});

	it("preserves provided optional fields", () => {
		const result = applyEquipmentDefaults({
			name: "Dell XPS",
			type: "pc",
			brand: "Dell",
			model: "XPS 15",
			serial_number: "SN-1234",
		});
		expect(result.brand).toBe("Dell");
		expect(result.model).toBe("XPS 15");
		expect(result.serial_number).toBe("SN-1234");
	});
});
