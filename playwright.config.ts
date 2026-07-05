import { defineConfig } from "@playwright/test";

/**
 * Suite e2e (cahier de recettes) — voir docs/certification/13-cahier-de-recettes.md.
 *
 * ⚠️ La base Postgres est PARTAGÉE dev/test/prod (un seul projet Supabase).
 * Cette suite ne tourne JAMAIS en CI : exécution locale, à la demande,
 * sous supervision (`bun run test:e2e`). Toute donnée créée porte le préfixe
 * `e2e-ephemeral-` et est balayée avant ET après la suite (e2e/support/db.ts).
 */
export default defineConfig({
	testDir: "./e2e",
	globalSetup: "./e2e/support/global-setup.ts",
	globalTeardown: "./e2e/support/global-teardown.ts",
	// Base partagée : pas de parallélisme, pas de retries silencieux.
	workers: 1,
	retries: 0,
	use: {
		baseURL: "http://localhost:3000",
	},
	webServer: {
		command: "bun run dev",
		port: 3000,
		reuseExistingServer: true,
		timeout: 60_000,
	},
});
