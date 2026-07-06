import { expect, test } from "@playwright/test";
import { E2E_ADMIN, E2E_TECH } from "./support/db";
import { login, waitHydrated } from "./support/helpers";

test("A1 — login admin réussi puis logout via la Sidebar", async ({ page }) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);

	// La déconnexion vit dans la Sidebar (desktop) — présente sur /equipment.
	await page.goto("/equipment");
	await waitHydrated(page);
	await page.click('[aria-label="Se déconnecter"]');
	await page.waitForURL("/login");
	await expect(page.locator("#login-email")).toBeVisible();
});

test("A2 — login technician réussi", async ({ page }) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await expect(page).not.toHaveURL(/\/login/);
});

test("A3 — mauvais mot de passe : erreur affichée, pas de session", async ({
	page,
}) => {
	await page.goto("/login");
	await waitHydrated(page);
	await page.fill("#login-email", E2E_ADMIN.email);
	await page.fill("#login-password", "mauvais-mot-de-passe");
	await page.click('button[type="submit"]');
	await expect(page.getByRole("alert")).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
});

test("A4 — non authentifié : /equipment redirige vers /login", async ({
	page,
}) => {
	await page.goto("/equipment");
	await page.waitForURL(/\/login/);
	await expect(page.locator("#login-email")).toBeVisible();
});
