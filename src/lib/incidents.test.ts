import { describe, expect, it } from "vitest";
import {
	normalizeIncidentDescription,
	validateNewIncidentInput,
} from "./incidents";

describe("validateNewIncidentInput", () => {
	it("accepte un signalement valide avec description", () => {
		expect(
			validateNewIncidentInput({
				equipment_id: "eq-1",
				description: "Écran noir au démarrage",
			}),
		).toBeNull();
	});

	it("accepte un signalement sans description (optionnelle)", () => {
		expect(validateNewIncidentInput({ equipment_id: "eq-1" })).toBeNull();
		expect(
			validateNewIncidentInput({ equipment_id: "eq-1", description: null }),
		).toBeNull();
	});

	it("refuse un equipment_id manquant", () => {
		expect(validateNewIncidentInput({})).toBe("L'équipement est requis");
	});

	it("refuse un equipment_id vide ou blanc", () => {
		expect(validateNewIncidentInput({ equipment_id: "" })).toBe(
			"L'équipement est requis",
		);
		expect(validateNewIncidentInput({ equipment_id: "   " })).toBe(
			"L'équipement est requis",
		);
	});

	it("refuse une description de plus de 2000 caractères", () => {
		expect(
			validateNewIncidentInput({
				equipment_id: "eq-1",
				description: "x".repeat(2001),
			}),
		).toBe("Description trop longue (2000 caractères max)");
		expect(
			validateNewIncidentInput({
				equipment_id: "eq-1",
				description: "x".repeat(2000),
			}),
		).toBeNull();
	});
});

describe("normalizeIncidentDescription", () => {
	it("conserve une description non vide, en la trimant", () => {
		expect(normalizeIncidentDescription("  écran noir  ")).toBe("écran noir");
	});

	it("normalise vide, blanc, null et undefined à null", () => {
		expect(normalizeIncidentDescription("")).toBeNull();
		expect(normalizeIncidentDescription("   ")).toBeNull();
		expect(normalizeIncidentDescription(null)).toBeNull();
		expect(normalizeIncidentDescription(undefined)).toBeNull();
	});
});
