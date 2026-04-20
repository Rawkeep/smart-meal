import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg', 'manifest.json'],
      manifest: false, // use public/manifest.json
      workbox: {
        // Precache core app shell so the PWA launches with zero network
        globPatterns: ['**/*.{js,css,html,svg,woff2,json,png,ico}'],
        // SPA routing fallback — any unknown route returns the app shell
        navigateFallback: '/smart-meal/index.html',
        navigateFallbackDenylist: [/^\/api/],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Health/availability check — NetworkFirst with tiny timeout so the
            // offline banner appears instantly instead of hanging on a TCP retry.
            urlPattern: /\/api\/health$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-health-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Anthropic / backend suggest endpoints — network-only. We never
            // want to replay a stale recipe, but we DO want the request to
            // fail fast so the offline swarm engine can take over.
            urlPattern: /\/api\/(suggest|meal-plan)$/,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'smart-meal-suggest-queue',
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
        ],
      },
    }),
  ],
  base: "/smart-meal/",
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
