import { expect, test } from "@playwright/test";
import { createEphemeralEquipment, E2E_PREFIX, E2E_TECH } from "./support/db";
import { login, MOBILE_VIEWPORT, waitHydrated } from "./support/helpers";

const EQ_ID = `${E2E_PREFIX}scan-eq`;
const EQ_NAME = `${E2E_PREFIX}Écran scanné`;

test.use({ viewport: MOBILE_VIEWPORT });

test.beforeAll(async () => {
	await createEphemeralEquipment({ id: EQ_ID, name: EQ_NAME });
});

/**
 * Le flux caméra (html5-qrcode) n'est pas automatisable en headless (pas de
 * flux vidéo). Le contrat testé est celui que le scan produit : le QR encode
 * l'URL /equipment/$id (cf. new.tsx, QRCodeImage) et le scanner navigue vers
 * cette URL après décodage (scan.tsx). On vérifie donc que cette URL, ouverte
 * sur mobile, affiche bien la fiche « Équipement scanné ».
 */
test("SC1 — le lien encodé dans le QR ouvre la fiche mobile de l'équipement", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto(`/equipment/${EQ_ID}`);
	await expect(page.getByText("Équipement scanné")).toBeVisible();
	await expect(page.getByText(EQ_NAME)).toBeVisible();
});

test("SC2 — la page /scan se charge et signale l'absence de caméra", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/scan");
	// Headless sans caméra : l'écran d'erreur explicite doit s'afficher
	// (pas de crash, pas de page blanche).
	await expect(
		page.getByText("Impossible d'accéder à la caméra. Vérifiez les permissions."),
	).toBeVisible({ timeout: 15_000 });
});

test("SC3 — saisie manuelle d'un code valide : navigation vers la fiche", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/scan");
	await waitHydrated(page);
	await page.getByRole("button", { name: "Saisir le code manuellement" }).click();
	await page.fill("#scan-manual-code", EQ_ID);
	await page.getByRole("button", { name: "Ouvrir la fiche" }).click();
	await page.waitForURL(`/equipment/${EQ_ID}`);
	await expect(page.getByText(EQ_NAME)).toBeVisible();
});

test("SC4 — saisie manuelle d'un code inconnu : erreur propre, pas de navigation", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/scan");
	await waitHydrated(page);
	await page.getByRole("button", { name: "Saisir le code manuellement" }).click();
	await page.fill("#scan-manual-code", `${E2E_PREFIX}code-inexistant`);
	await page.getByRole("button", { name: "Ouvrir la fiche" }).click();
	await expect(
		page.getByText("Aucun équipement ne correspond à ce code."),
	).toBeVisible();
	await expect(page).toHaveURL(/\/scan/);
});
