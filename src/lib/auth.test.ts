import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema } from "./auth";

describe("loginSchema", () => {
	it("accepts a valid payload and normalizes the email", () => {
		const result = loginSchema.parse({
			email: "  User@Example.com  ",
			password: "un-mot-de-passe",
		});
		expect(result.email).toBe("user@example.com");
	});

	it("rejects an invalid email", () => {
		expect(() =>
			loginSchema.parse({ email: "not-an-email", password: "x" }),
		).toThrow();
	});

	it("rejects an empty password", () => {
		expect(() =>
			loginSchema.parse({ email: "user@example.com", password: "" }),
		).toThrow();
	});

	it("rejects a missing field", () => {
		expect(() => loginSchema.parse({ email: "user@example.com" })).toThrow();
	});
});

describe("changePasswordSchema (issue #13)", () => {
	it("accepts a valid payload", () => {
		const result = changePasswordSchema.parse({
			currentPassword: "old-secret",
			newPassword: "new-secret-123",
		});
		expect(result.newPassword).toBe("new-secret-123");
	});

	it("rejects a new password under 8 characters", () => {
		expect(() =>
			changePasswordSchema.parse({
				currentPassword: "old-secret",
				newPassword: "short",
			}),
		).toThrow();
	});

	it("rejects an empty current password", () => {
		expect(() =>
			changePasswordSchema.parse({
				currentPassword: "",
				newPassword: "new-secret-123",
			}),
		).toThrow();
	});

	it("rejects a missing field", () => {
		expect(() =>
			changePasswordSchema.parse({ newPassword: "new-secret-123" }),
		).toThrow();
	});
});
