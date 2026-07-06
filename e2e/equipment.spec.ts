import { expect, test } from "@playwright/test";
import { E2E_ADMIN, E2E_PREFIX, queryAsAdmin } from "./support/db";
import { login, waitHydrated } from "./support/helpers";

const EQ_NAME = `${E2E_PREFIX}PC de recette`;
const EQ_SERIAL = `${E2E_PREFIX}SN-001`;

test.describe.configure({ mode: "serial" });

test("E1 — création d'un équipement avec génération de QR code", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/equipment/new");
	await waitHydrated(page);

	await page.fill("#equipment-name", EQ_NAME);
	await page.fill("#equipment-brand", "Dell");
	await page.fill("#equipment-model", "Latitude 5440");
	await page.fill("#equipment-serial", EQ_SERIAL);
	await page.getByRole("button", { name: "Enregistrer & générer QR" }).click();

	// L'aperçu étiquette affiche le QR généré (image data-url).
	await expect(page.locator('img[src^="data:image"]').first()).toBeVisible();

	// La ligne existe réellement en base, avec un qr_code non vide.
	const rows = await queryAsAdmin(
		"SELECT id, qr_code, status FROM equipment WHERE name = $1",
		[EQ_NAME],
	);
	expect(rows.rowCount).toBe(1);
	expect(rows.rows[0].qr_code).toBeTruthy();
	expect(rows.rows[0].status).toBe("available");
});

test("E2 — liste : recherche par nom retrouve l'équipement créé", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/equipment");
	await waitHydrated(page);

	await page.getByPlaceholder("Nom, n° série, utilisateur").fill(EQ_NAME);
	const row = page.getByRole("row", { name: new RegExp(EQ_NAME) });
	await expect(row).toBeVisible();
	await expect(row).toContainText(EQ_SERIAL);

	// Recherche sans résultat → état vide explicite.
	await page
		.getByPlaceholder("Nom, n° série, utilisateur")
		.fill(`${E2E_PREFIX}introuvable-xyz`);
	await expect(page.getByText("Aucun équipement trouvé.")).toBeVisible();
});

test("E3 — fiche détail : informations complètes affichées", async ({
	page,
}) => {
	const rows = await queryAsAdmin("SELECT id FROM equipment WHERE name = $1", [
		EQ_NAME,
	]);
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto(`/equipment/${rows.rows[0].id}`);
	await waitHydrated(page);

	await expect(page.getByRole("heading", { name: EQ_NAME })).toBeVisible();
	await expect(page.getByText(EQ_SERIAL)).toBeVisible();
	await expect(page.getByText("Dell", { exact: true })).toBeVisible();
});

test("E4 — édition : changement de statut depuis la fiche (panne ↔ disponible)", async ({
	page,
}) => {
	const rows = await queryAsAdmin("SELECT id FROM equipment WHERE name = $1", [
		EQ_NAME,
	]);
	const id = rows.rows[0].id;
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto(`/equipment/${id}`);
	await waitHydrated(page);

	await page.getByRole("button", { name: "Déclarer en panne" }).click();
	await expect(page.getByText("En panne").first()).toBeVisible();

	await page.getByRole("button", { name: "Marquer disponible" }).click();
	await expect(page.getByText("Disponible").first()).toBeVisible();

	const after = await queryAsAdmin(
		"SELECT status FROM equipment WHERE id = $1",
		[id],
	);
	expect(after.rows[0].status).toBe("available");
});
