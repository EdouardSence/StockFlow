import { expect, test } from "@playwright/test";
import {
	createEphemeralEquipment,
	E2E_PREFIX,
	E2E_TECH,
	queryAsAdmin,
} from "./support/db";
import { login, MOBILE_VIEWPORT, waitHydrated } from "./support/helpers";

const EQ_ID = `${E2E_PREFIX}offline-eq`;
const EQ_NAME = `${E2E_PREFIX}PC cave sans réseau`;
const DESCRIPTION = `${E2E_PREFIX}incident saisi hors-ligne`;

test.beforeAll(async () => {
	await createEphemeralEquipment({ id: EQ_ID, name: EQ_NAME });
});

test("OF1 — incident créé hors-ligne : mis en file, puis synchronisé au retour réseau", async ({
	browser,
}) => {
	const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
	const page = await context.newPage();
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto(`/equipment/${EQ_ID}`);
	await waitHydrated(page);

	// Coupure réseau APRÈS chargement de la fiche (cas terrain : cave).
	await context.setOffline(true);
	await page.getByRole("button", { name: "Signaler panne" }).click();
	await page.fill("#incident-description", DESCRIPTION);
	await page.getByRole("button", { name: "Envoyer le signalement" }).click();

	// Mis en file localement, pas en base.
	await expect(
		page.getByText(
			"Incident enregistré hors-ligne · il sera synchronisé au retour du réseau",
		),
	).toBeVisible();
	await expect(
		page.getByText("1 incident en attente de synchronisation"),
	).toBeVisible();
	const before = await queryAsAdmin(
		"SELECT 1 FROM incidents WHERE description = $1",
		[DESCRIPTION],
	);
	expect(before.rowCount).toBe(0);

	// Retour réseau : flush automatique (event online).
	await context.setOffline(false);
	await expect(page.getByText("en attente de synchronisation")).toBeHidden({
		timeout: 15_000,
	});

	const after = await queryAsAdmin(
		"SELECT status, reported_by FROM incidents WHERE description = $1",
		[DESCRIPTION],
	);
	expect(after.rowCount).toBe(1);
	expect(after.rows[0].status).toBe("open");
	expect(after.rows[0].reported_by).toBe(E2E_TECH.id);
	await context.close();
});
