import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./support/db";

/**
 * Smoke unique : valide que la convention `e2e-ephemeral-` et le sweep
 * fonctionnent réellement (le compte est créé en globalSetup, utilisé ici,
 * supprimé en globalTeardown). Les scénarios complets du cahier de recettes
 * viendront dans une session dédiée — ne pas les ajouter ici au fil de l'eau.
 */
test("login admin puis logout", async ({ page }) => {
	await page.goto("/login");
	// Attend l'hydratation React : sans ça le clic part en submit natif (GET)
	// avant que le onSubmit soit attaché. Le bouton devtools n'est rendu que
	// côté client (serveur dev uniquement, ce que webServer lance).
	await page.getByRole("button", { name: "Open TanStack Devtools" }).waitFor();
	await page.fill("#login-email", E2E_ADMIN.email);
	await page.fill("#login-password", E2E_ADMIN.password);
	await page.click('button[type="submit"]');
	await page.waitForURL("/");

	// La déconnexion vit dans la Sidebar (desktop) — présente sur /equipment.
	await page.goto("/equipment");
	await page.getByRole("button", { name: "Open TanStack Devtools" }).waitFor();
	await page.click('[aria-label="Se déconnecter"]');
	await page.waitForURL("/login");
	await expect(page.locator("#login-email")).toBeVisible();
});
