import { expect, test } from "@playwright/test";
import {
	createEphemeralEquipment,
	E2E_ADMIN,
	E2E_PREFIX,
	E2E_TECH,
	queryAsAdmin,
} from "./support/db";
import { login, MOBILE_VIEWPORT, waitHydrated } from "./support/helpers";

const EQ_ID = `${E2E_PREFIX}incident-eq`;
const EQ_NAME = `${E2E_PREFIX}Imprimante en panne`;
const DESCRIPTION = `${E2E_PREFIX}bourrage papier permanent`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
	await createEphemeralEquipment({ id: EQ_ID, name: EQ_NAME });
});

test("I1 — mobile : la tuile « Signaler panne » crée une vraie ligne incidents", async ({
	browser,
}) => {
	const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
	const page = await context.newPage();
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto(`/equipment/${EQ_ID}`);
	await waitHydrated(page);

	await page.getByRole("button", { name: "Signaler panne" }).click();
	await page.fill("#incident-description", DESCRIPTION);
	await page.getByRole("button", { name: "Envoyer le signalement" }).click();
	await expect(
		page.getByText("Panne signalée · un administrateur qualifiera l'incident"),
	).toBeVisible();

	// La ligne existe en base : status open, reported_by = technicien courant,
	// et equipment.status n'a PAS été touché (qualification manuelle).
	const incident = await queryAsAdmin(
		"SELECT status, reported_by FROM incidents WHERE description = $1",
		[DESCRIPTION],
	);
	expect(incident.rowCount).toBe(1);
	expect(incident.rows[0].status).toBe("open");
	expect(incident.rows[0].reported_by).toBe(E2E_TECH.id);
	const eq = await queryAsAdmin("SELECT status FROM equipment WHERE id = $1", [
		EQ_ID,
	]);
	expect(eq.rows[0].status).toBe("available");
	await context.close();
});

test("I2 — badge « incidents ouverts » visible sur la liste et la fiche", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/equipment");
	await waitHydrated(page);
	await page.getByPlaceholder("Nom, n° série, utilisateur").fill(EQ_NAME);
	const row = page.getByRole("row", { name: new RegExp(EQ_NAME) });
	await expect(row.getByTitle(/incident.*ouvert.*ou en cours/)).toHaveText("1");

	await page.goto(`/equipment/${EQ_ID}`);
	await waitHydrated(page);
	await expect(page.getByTitle(/incident.*ouvert.*ou en cours/)).toHaveText("1");
});

test("I3 — admin : cycle open → in_progress → resolved depuis /incidents", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/incidents");
	await waitHydrated(page);

	const incidentRow = page
		.locator("div")
		.filter({ hasText: DESCRIPTION })
		.last();
	await expect(incidentRow.getByText("Ouvert")).toBeVisible();

	await incidentRow.getByRole("button", { name: "Prendre en charge" }).click();
	await expect(incidentRow.getByText("En cours")).toBeVisible();

	await incidentRow.getByRole("button", { name: "Marquer résolu" }).click();
	// Résolu : quitte la liste active, rejoint la section repliée.
	await expect(
		page.getByRole("button", {
			name: "Afficher ou masquer les incidents résolus récemment",
		}),
	).toBeVisible();

	const resolved = await queryAsAdmin(
		"SELECT status, resolved_at FROM incidents WHERE description = $1",
		[DESCRIPTION],
	);
	expect(resolved.rows[0].status).toBe("resolved");
	expect(resolved.rows[0].resolved_at).not.toBeNull();
});
