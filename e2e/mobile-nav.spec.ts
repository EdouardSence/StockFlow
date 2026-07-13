import { expect, test } from "@playwright/test";
import { E2E_ADMIN, E2E_TECH } from "./support/db";
import { login, MOBILE_VIEWPORT, waitHydrated } from "./support/helpers";

/**
 * Recette des correctifs mobile/sidebar (issues #27–#33, 2026-07-13) :
 * layout mobile sur les routes hors accueil, onglet Profil relié,
 * identité réelle et filtrage par rôle dans la sidebar desktop.
 */

test("MN1 — mobile : l'onglet Stock affiche la liste mobile (cartes cliquables, pas de sidebar)", async ({
	page,
}) => {
	await page.setViewportSize(MOBILE_VIEWPORT);
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/equipment");
	await waitHydrated(page);

	// Pas de sidebar desktop (identifiée par sa section « Pilotage »).
	await expect(page.locator("aside", { hasText: "Pilotage" })).toHaveCount(0);
	// Bottom nav présente, onglet Stock actif.
	await expect(
		page.locator("nav", { hasText: "Accueil" }).getByText("Stock"),
	).toBeVisible();
	// Les cartes de la liste mènent à la fiche.
	await expect(
		page.locator('a[href^="/equipment/"]:not([href="/equipment/new"])').first(),
	).toBeVisible();
});

test("MN2 — mobile : l'onglet Profil mène à /account avec déconnexion disponible", async ({
	page,
}) => {
	await page.setViewportSize(MOBILE_VIEWPORT);
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await waitHydrated(page);

	// L'onglet Profil est un vrai lien vers /account (le bouton flottant des
	// devtools recouvre l'onglet en dev : on navigue via l'événement).
	const profil = page.locator('nav a[href="/account"]');
	await expect(profil).toBeVisible();
	await profil.dispatchEvent("click");
	await page.waitForURL("**/account");

	await expect(
		page.getByRole("heading", { name: "Changer le mot de passe" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Se déconnecter" }),
	).toBeVisible();
});

test("MN3 — desktop : la sidebar affiche l'identité réelle et masque les entrées admin au technicien", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/equipment");
	await waitHydrated(page);

	const aside = page.locator("aside", { hasText: "Pilotage" });
	await expect(aside).toContainText(E2E_TECH.name);
	await expect(aside).toContainText("Technicien");
	await expect(aside.getByText("Utilisateurs")).toHaveCount(0);
});

test("MN4 — desktop : la sidebar admin garde Utilisateurs/Incidents et le clic sur un nom ouvre la fiche", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/equipment");
	await waitHydrated(page);

	const aside = page.locator("aside", { hasText: "Pilotage" });
	await expect(aside).toContainText(E2E_ADMIN.name);
	await expect(aside.getByText("Utilisateurs")).toBeVisible();
	await expect(aside.getByText("Incidents")).toBeVisible();

	const firstRowLink = page
		.locator('main a[href^="/equipment/"]:not([href="/equipment/new"])')
		.first();
	await expect(firstRowLink).toBeVisible();
	await firstRowLink.dispatchEvent("click");
	await page.waitForURL(/\/equipment\/[^/]+$/);
});
