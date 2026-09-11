import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Restreint à src/ : les .spec.ts de e2e/ appartiennent à Playwright.
		include: ["src/**/*.test.ts"],
		environment: "jsdom",
		globals: true,
		setupFiles: [],
		// Charge .env/.env.local pour les tests d'intégration (APP_POSTGRES_URL…)
		env: loadEnv("test", process.cwd(), ""),
		coverage: {
			// Le reporter texte masque par défaut les fichiers couverts à 100 % :
			// equipment-domain.ts et incidents-domain.ts disparaissaient du tableau
			// alors qu'ils sont mesurés (présents dans coverage-final.json et le HTML).
			reporter: [["text", { skipFull: false }], "html", "clover", "json"],
		},
	},
});
