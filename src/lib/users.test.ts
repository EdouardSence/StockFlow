import { describe, expect, it } from "vitest";
import { newUserSchema, userIdSchema } from "./users";

describe("newUserSchema (issue #12)", () => {
	it("accepts a valid payload", () => {
		const result = newUserSchema.parse({
			name: "Nouvel Utilisateur",
			email: "Nouvel.Utilisateur@Example.com",
			role: "technician",
			password: "un-mot-de-passe-solide",
		});
		expect(result.email).toBe("nouvel.utilisateur@example.com");
	});

	it("rejects a password under 8 characters", () => {
		expect(() =>
			newUserSchema.parse({
				name: "X",
				email: "x@example.com",
				role: "technician",
				password: "short",
			}),
		).toThrow();
	});

	it("rejects an invalid role", () => {
		expect(() =>
			newUserSchema.parse({
				name: "X",
				email: "x@example.com",
				role: "superadmin",
				password: "un-mot-de-passe-solide",
			}),
		).toThrow();
	});

	it("rejects an empty name", () => {
		expect(() =>
			newUserSchema.parse({
				name: "   ",
				email: "x@example.com",
				role: "admin",
				password: "un-mot-de-passe-solide",
			}),
		).toThrow();
	});

	it("rejects an invalid email", () => {
		expect(() =>
			newUserSchema.parse({
				name: "X",
				email: "not-an-email",
				role: "admin",
				password: "un-mot-de-passe-solide",
			}),
		).toThrow();
	});
});

describe("userIdSchema", () => {
	it("accepts a non-empty id", () => {
		expect(userIdSchema.parse({ id: "abc" })).toEqual({ id: "abc" });
	});

	it("rejects an empty id", () => {
		expect(() => userIdSchema.parse({ id: "" })).toThrow();
	});
});
