import type { Page } from "@playwright/test";

export const MOBILE_VIEWPORT = { width: 390, height: 844 };

/**
 * Attend l'hydratation React après un chargement complet de page : sans ça,
 * un clic peut partir avant que les handlers soient attachés (submit natif
 * GET sur le login, clic sans effet ailleurs). Le bouton devtools n'est rendu
 * que côté client — la suite tourne contre le serveur dev (webServer).
 */
export async function waitHydrated(page: Page): Promise<void> {
	await page
		.getByRole("button", { name: "Open TanStack Devtools" })
		.waitFor({ timeout: 15_000 });
}

export async function login(
	page: Page,
	email: string,
	password: string,
): Promise<void> {
	await page.goto("/login");
	await waitHydrated(page);
	await page.fill("#login-email", email);
	await page.fill("#login-password", password);
	await page.click('button[type="submit"]');
	// La racine "/" redirige vers /equipment sur desktop — accepter les deux.
	await page.waitForURL((url) =>
		["/", "/equipment"].includes(new URL(url).pathname),
	);
}
