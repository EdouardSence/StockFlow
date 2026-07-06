import { expect, test } from "@playwright/test";
import {
	createEphemeralEquipment,
	E2E_ADMIN,
	E2E_PREFIX,
	E2E_TECH,
} from "./support/db";
import { login, waitHydrated } from "./support/helpers";

const EQ_ID = `${E2E_PREFIX}rbac-eq`;

test.beforeAll(async () => {
	await createEphemeralEquipment({ id: EQ_ID, name: `${E2E_PREFIX}RBAC PC` });
});

test("R1 — technicien : /incidents (admin-only) redirige hors de la page", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto("/incidents");
	// beforeLoad renvoie vers "/" ; desktop re-redirige vers /equipment.
	await page.waitForURL((url) =>
		["/", "/equipment"].includes(new URL(url).pathname),
	);
	// exact: le dashboard « / » a un heading « Incidents ouverts » légitime —
	// seul le h1 « Incidents » de la page admin ne doit pas apparaître.
	await expect(
		page.getByRole("heading", { name: "Incidents", exact: true }),
	).toHaveCount(0);
});

test("R2 — technicien : pas de picker d'assignation admin sur la fiche", async ({
	page,
}) => {
	await login(page, E2E_TECH.email, E2E_TECH.password);
	await page.goto(`/equipment/${EQ_ID}`);
	await waitHydrated(page);
	await expect(page.locator("#assign-user-select")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "M'attribuer" })).toBeVisible();
});

test("R3 — appel serveur admin-only forcé par un technicien : refusé", async ({
	browser,
	page,
}) => {
	// 1. En admin, capturer l'URL réelle de la server function listIncidentsFn
	//    (navigation client vers /incidents → fetch visible sur le réseau).
	await login(page, E2E_ADMIN.email, E2E_ADMIN.password);
	await page.goto("/equipment");
	await waitHydrated(page);
	// L'id de server function est encodé en base64 dans l'URL
	// (/_serverFn/<base64 de {file, export}>) — on le décode pour cibler
	// précisément listIncidentsFn et pas getSessionFn ou un autre appel.
	const isListIncidentsCall = (url: string) => {
		const m = url.match(/_serverFn\/([A-Za-z0-9+/=_-]+)/);
		if (!m) return false;
		try {
			return Buffer.from(m[1], "base64").toString().includes("listIncidentsFn");
		} catch {
			return false;
		}
	};
	const [request] = await Promise.all([
		page.waitForRequest((r) => isListIncidentsCall(r.url()), {
			timeout: 15_000,
		}),
		page.getByRole("link", { name: "Incidents" }).click(),
	]);

	// 2. Rejouer exactement le même appel avec la session du technicien.
	const techContext = await browser.newContext();
	const techPage = await techContext.newPage();
	await login(techPage, E2E_TECH.email, E2E_TECH.password);
	// En-têtes d'origine sans le cookie : chaque contexte joue sa propre
	// session. Sans ces en-têtes TanStack, le endpoint répond 200 vide sans
	// invoquer le handler — le replay ne testerait rien.
	const headers = Object.fromEntries(
		Object.entries(request.headers()).filter(
			([k]) => !["cookie", "host", "content-length"].includes(k.toLowerCase()),
		),
	);
	// Contrôle positif : le même appel en admin passe sans erreur sérialisée.
	const adminReplay = await page.context().request.fetch(request.url(), {
		method: request.method(),
		headers,
		failOnStatusCode: false,
	});
	expect(await adminReplay.text()).not.toContain("FORBIDDEN");

	// TanStack Start transporte les erreurs de server function en HTTP 200
	// avec l'erreur sérialisée dans l'enveloppe ($TSR/Error, re-levée côté
	// client) — le refus s'observe donc dans le corps, pas dans le status.
	const forced = await techContext.request.fetch(request.url(), {
		method: request.method(),
		headers,
		failOnStatusCode: false,
	});
	const body = await forced.text();
	expect(body).toContain("FORBIDDEN");
	expect(body).not.toContain("reported_by_name");
	await techContext.close();
});
