import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./auth";

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
