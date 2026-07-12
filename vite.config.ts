import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enregistrement manuel dans __root.tsx (SSR : pas de virtual module côté serveur).
      injectRegister: null,
      // Le manifest existe déjà dans public/, le plugin ne doit pas en générer un.
      manifest: false,
      workbox: {
        // Pas de précache : le plugin génère le SW dans dist/ avant que Nitro
        // assemble .output/public — le glob n'y verrait rien. Tout passe en
        // cache runtime, y compris les assets (hashés, donc immuables).
        globPatterns: [],
        // App SSR : pas de index.html précaché, le fallback classique est inapplicable.
        navigateFallback: null,
        runtimeCaching: [
          {
            // Assets buildés (JS/CSS/fonts/images) — hashés, immuables.
            urlPattern: ({ request }) =>
              ['script', 'style', 'font', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sf-assets',
              expiration: { maxEntries: 200 },
            },
          },
          {
            // Pages visitées, consultables hors-ligne (HTML rendu par le serveur).
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'sf-pages', networkTimeoutSeconds: 3 },
          },
          {
            // Lectures server functions uniquement — jamais les POST (mutations).
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/_serverFn/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: { cacheName: 'sf-data', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
})

export default config
