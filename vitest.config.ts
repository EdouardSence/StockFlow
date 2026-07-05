import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Restreint à src/ : les .spec.ts de e2e/ appartiennent à Playwright.
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    // Charge .env/.env.local pour les tests d'intégration (APP_POSTGRES_URL…)
    env: loadEnv('test', process.cwd(), ''),
  },
});
