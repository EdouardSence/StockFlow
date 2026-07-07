import { expect, test } from "@playwright/test";
import { hashPassword } from "../src/lib/auth-core";
import {
	createEphemeralUser,
	E2E_ADMIN,
	E2E_PREFIX,
	E2E_TECH,
} from "./support/db";
import { login, waitHydrated } from "./support/helpers";

const NEW_USER_EMAIL = `${E2E_PREFIX}newuser@stockflow.test`;
const NEW_USER_PASSWORD = "e2e-ephemeral-Passw0rd!";

const DEACTIVATE_USER = {
	id: `${E2E_PREFIX}deactivateme`,
	name: "E2E Ephemeral Deactivate Me",
	email: `${E2E_PREFIX}deactivateme@stockflow.test`,
	password: "e2e-ephemeral-Passw0rd!",
	role: "technician" as const,
};

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
	const hash = await hashPassword(DEACTIVATE_USER.password);
	await createEphemeralUser(DEACTIVATE_USER, hash);
});

test("AU1 — admin : crée un utilisateur, connexion réussie avec le nouveau compte", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/admin/users");
	await waitHydrated(page);

	await page.fill("#new-user-name", "E2E Ephemeral NewUser");
	await page.fill("#new-user-email", NEW_USER_EMAIL);
	await page.fill("#new-user-password", NEW_USER_PASSWORD);
	await page.getByRole("button", { name: "Créer le compte" }).click();

	await expect(page.getByText(NEW_USER_EMAIL)).toBeVisible();

	await page.goto("/login");
	await waitHydrated(page);
	await login(page, NEW_USER_EMAIL, NEW_USER_PASSWORD);
});

test("AU2 — admin : email déjà utilisé refusé proprement", async ({ page }) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/admin/users");
	await waitHydrated(page);

	await page.fill("#new-user-name", "E2E Ephemeral Dup");
	await page.fill("#new-user-email", NEW_USER_EMAIL);
	await page.fill("#new-user-password", NEW_USER_PASSWORD);
	await page.getByRole("button", { name: "Créer le compte" }).click();

	await expect(page.getByText("Cet email est déjà utilisé.")).toBeVisible();
});

test("AU3 — admin : désactivation d'un compte empêche la connexion", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/admin/users");
	await waitHydrated(page);

	const row = page.getByRole("row", {
		name: new RegExp(DEACTIVATE_USER.email),
	});
	await row.getByRole("button", { name: "Désactiver" }).click();
	await expect(row.getByText("Désactivé")).toBeVisible();

	await page.goto("/login");
	await waitHydrated(page);
	await page.fill("#login-email", DEACTIVATE_USER.email);
	await page.fill("#login-password", DEACTIVATE_USER.password);
	await page.click('button[type="submit"]');

	await expect(
		page.getByText("Email ou mot de passe incorrect."),
	).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
});

test("AU4 — technicien : accès direct à /admin/users refusé", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/admin/users");
	await waitHydrated(page);

	await expect(page).not.toHaveURL(/\/admin\/users/);
	await expect(
		page.getByRole("heading", { name: "Nouvel utilisateur" }),
	).not.toBeVisible();
});
