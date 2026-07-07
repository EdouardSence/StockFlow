import { expect, test } from "@playwright/test";
import { hashPassword } from "../src/lib/auth-core";
import { createEphemeralUser, E2E_PREFIX, queryAsAdmin } from "./support/db";
import { login, waitHydrated } from "./support/helpers";

// Utilisateurs dédiés locaux pour éviter de polluer le mot de passe de E2E_TECH partagé.
const PW_USER = {
	id: `${E2E_PREFIX}pwuser`,
	name: "E2E Ephemeral PwUser",
	email: `${E2E_PREFIX}pwuser@stockflow.test`,
	password: "e2e-ephemeral-Passw0rd!",
	role: "technician" as const,
};

const PW_USER_2 = {
	id: `${E2E_PREFIX}pwuser2`,
	name: "E2E Ephemeral PwUser 2",
	email: `${E2E_PREFIX}pwuser2@stockflow.test`,
	password: "e2e-ephemeral-Passw0rd!",
	role: "technician" as const,
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
	const hash = await hashPassword(PW_USER.password);
	await createEphemeralUser(PW_USER, hash);
	await createEphemeralUser(PW_USER_2, hash);
});

test("AC1 — changement de mot de passe réussi", async ({ page }) => {
	const NEW_PASSWORD = "e2e-ephemeral-NewPassw0rd!";
	await login(page, PW_USER.email, PW_USER.password);
	await page.goto("/account");
	await waitHydrated(page);

	await page.fill("#current-password", PW_USER.password);
	await page.fill("#new-password", NEW_PASSWORD);
	await page.fill("#confirm-password", NEW_PASSWORD);
	await page.getByRole("button", { name: "Mettre à jour" }).click();

	await expect(page.getByText("Mot de passe mis à jour.")).toBeVisible();

	await page.goto("/login");
	await waitHydrated(page);
	await login(page, PW_USER.email, NEW_PASSWORD);
});

test("AC2 — mauvais mot de passe actuel", async ({ page }) => {
	const selectHash = "SELECT auth_password_lookup($1) as hash";
	const beforeResult = await queryAsAdmin(selectHash, [PW_USER_2.id]);
	const beforeHash = beforeResult.rows[0]?.hash;

	await login(page, PW_USER_2.email, PW_USER_2.password);
	await page.goto("/account");
	await waitHydrated(page);

	await page.fill("#current-password", "totally-wrong-password");
	await page.fill("#new-password", "e2e-ephemeral-NewPassw0rd!");
	await page.fill("#confirm-password", "e2e-ephemeral-NewPassw0rd!");
	await page.getByRole("button", { name: "Mettre à jour" }).click();

	await expect(page.getByText("Mot de passe actuel incorrect.")).toBeVisible();

	const afterResult = await queryAsAdmin(selectHash, [PW_USER_2.id]);
	const afterHash = afterResult.rows[0]?.hash;
	expect(afterHash).toBe(beforeHash);
});

test("AC3 — validation client : nouveau mot de passe trop court désactive le bouton", async ({
	page,
}) => {
	await login(page, PW_USER_2.email, PW_USER_2.password);
	await page.goto("/account");
	await waitHydrated(page);

	await page.fill("#current-password", "non-empty-password");
	await page.fill("#new-password", "short");
	await expect(
		page.getByRole("button", { name: "Mettre à jour" }),
	).toBeDisabled();

	await page.fill("#new-password", "");
	await page.fill("#new-password", "valid-new-password");
	await page.fill("#confirm-password", "different-password");

	await expect(
		page.getByRole("button", { name: "Mettre à jour" }),
	).toBeDisabled();
	await expect(
		page.getByText("Les mots de passe ne correspondent pas."),
	).toBeVisible();
});
