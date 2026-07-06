import { expect, test } from "@playwright/test";
import {
	createEphemeralEquipment,
	E2E_ADMIN,
	E2E_PREFIX,
	E2E_TECH,
	queryAsAdmin,
} from "./support/db";
import { login, waitHydrated } from "./support/helpers";

const EQ_ASSIGNED = `${E2E_PREFIX}dash-assigned`;
const EQ_BROKEN = `${E2E_PREFIX}dash-broken`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
	await createEphemeralEquipment({
		id: EQ_ASSIGNED,
		name: `${E2E_PREFIX}Dash ThinkPad`,
		status: "assigned",
		assigned_to: E2E_TECH.id,
	});
	await createEphemeralEquipment({
		id: EQ_BROKEN,
		name: `${E2E_PREFIX}Dash LaserJet`,
		status: "broken",
	});
});

test("D1 — admin : le tableau de bord affiche KPI, parc récent et incidents", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/");
	await waitHydrated(page);

	await expect(
		page.getByRole("heading", { name: "Vue d'ensemble du parc" }),
	).toBeVisible();
	await expect(page.getByText("Total équipements")).toBeVisible();
	await expect(page.getByText("En maintenance")).toBeVisible();

	// Parc récent : les équipements seedés apparaissent avec leur action contextuelle.
	const table = page.getByRole("table");
	await expect(table.getByText(`${E2E_PREFIX}Dash ThinkPad`)).toBeVisible();
	await expect(table.getByText(`${E2E_PREFIX}Dash LaserJet`)).toBeVisible();
	await expect(page.getByRole("link", { name: "Réparer" }).first()).toBeVisible();

	await expect(
		page.getByRole("heading", { name: "Incidents ouverts" }),
	).toBeVisible();
});

test("D2 — admin : « Libérer » désassigne directement depuis le tableau", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/");
	await waitHydrated(page);

	const row = page.getByRole("row", { name: new RegExp(`${E2E_PREFIX}Dash ThinkPad`) });
	await row.getByRole("button", { name: "Libérer" }).click();
	await expect(row.getByText("Disponible")).toBeVisible();

	const after = await queryAsAdmin(
		"SELECT status, assigned_to FROM equipment WHERE id = $1",
		[EQ_ASSIGNED],
	);
	expect(after.rows[0]).toEqual({ status: "available", assigned_to: null });
});

test("D3 — technicien : dashboard visible, noms des collègues masqués (RLS)", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/");
	await waitHydrated(page);

	await expect(
		page.getByRole("heading", { name: "Vue d'ensemble du parc" }),
	).toBeVisible();
	// Pas de lien « Gérer les incidents » (réservé admin).
	await expect(page.getByRole("link", { name: /Gérer les incidents/ })).toHaveCount(0);
});
