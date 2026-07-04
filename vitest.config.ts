import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    // Charge .env/.env.local pour les tests d'intégration (APP_POSTGRES_URL…)
    env: loadEnv('test', process.cwd(), ''),
  },
});
