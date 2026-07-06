import { expect, test } from "@playwright/test";
import {
	createEphemeralEquipment,
	E2E_ADMIN,
	E2E_PREFIX,
	E2E_TECH,
	queryAsAdmin,
} from "./support/db";
import { login, waitHydrated } from "./support/helpers";

const EQ_SELF = `${E2E_PREFIX}assign-self`;
const EQ_ADMIN = `${E2E_PREFIX}assign-admin`;
const EQ_BROKEN = `${E2E_PREFIX}assign-broken`;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
	await createEphemeralEquipment({ id: EQ_SELF, name: `${E2E_PREFIX}PC self` });
	await createEphemeralEquipment({ id: EQ_ADMIN, name: `${E2E_PREFIX}PC admin` });
	await createEphemeralEquipment({
		id: EQ_BROKEN,
		name: `${E2E_PREFIX}PC HS`,
		status: "broken",
	});
});

test("AS1 — technicien : s'auto-assigne puis se désassigne", async ({ page }) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto(`/equipment/${EQ_SELF}`);
	await waitHydrated(page);

	await page.getByRole("button", { name: "M'attribuer" }).click();
	await expect(page.getByText("Vous", { exact: true })).toBeVisible();

	const assigned = await queryAsAdmin(
		"SELECT status, assigned_to FROM equipment WHERE id = $1",
		[EQ_SELF],
	);
	expect(assigned.rows[0]).toEqual({ status: "assigned", assigned_to: E2E_TECH.id });

	await page.getByRole("button", { name: "Retirer mon attribution" }).click();
	await expect(page.getByText("Non attribué")).toBeVisible();

	const unassigned = await queryAsAdmin(
		"SELECT status, assigned_to FROM equipment WHERE id = $1",
		[EQ_SELF],
	);
	expect(unassigned.rows[0]).toEqual({ status: "available", assigned_to: null });
});

test("AS2 — admin : assigne à un utilisateur via le picker complet", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto(`/equipment/${EQ_ADMIN}`);
	await waitHydrated(page);

	await page.locator("#assign-user-select").selectOption(E2E_TECH.id);
	await page.getByRole("button", { name: "Assigner", exact: true }).click();
	await expect(page.getByText(E2E_TECH.name)).toBeVisible();

	const row = await queryAsAdmin(
		"SELECT status, assigned_to FROM equipment WHERE id = $1",
		[EQ_ADMIN],
	);
	expect(row.rows[0]).toEqual({ status: "assigned", assigned_to: E2E_TECH.id });

	await page.getByRole("button", { name: "Retirer l'attribution" }).click();
	await expect(page.getByText("Non attribué")).toBeVisible();
});

test("AS3 — équipement broken : assignation refusée (UI désactivée + règle serveur)", async ({
	page,
}) => {
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto(`/equipment/${EQ_BROKEN}`);
	await waitHydrated(page);

	await expect(page.locator("#assign-user-select")).toBeDisabled();
	await expect(
		page.getByText("Assignation impossible : équipement en panne."),
	).toBeVisible();

	// La règle serveur (EquipmentUnavailableError) est verrouillée par les
	// tests de domaine exhaustifs (equipment-domain.test.ts) — l'e2e vérifie
	// que l'UI ne propose jamais l'action.
	const row = await queryAsAdmin(
		"SELECT assigned_to FROM equipment WHERE id = $1",
		[EQ_BROKEN],
	);
	expect(row.rows[0].assigned_to).toBeNull();
});
