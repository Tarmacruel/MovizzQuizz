import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'brand/bee/icons/favicon-16x16.png',
        'brand/bee/icons/favicon-32x32.png',
        'brand/bee/icons/apple-touch-icon-180x180.png',
        'brand/bee/icons/icon-192x192.png',
        'brand/bee/icons/icon-512x512.png',
        'brand/bee/icons/icon-maskable-512x512.png',
        'brand/bee/icons/icon.svg',
        'brand/bee/icons/maskable-icon.svg',
        'brand/bee/icons/notification-monochrome.svg',
        'brand/bee/backgrounds/honeycomb-bg.svg',
        'brand/bee/backgrounds/honeycomb-mobile-bg.svg',
        'pwa/offline.html'
      ],
      manifest: {
        id: '/',
        name: 'MovizzQuizz',
        short_name: 'MovizzQuizz',
        description: 'Quiz, Stop e Ludo online para jogar com amigos.',
        theme_color: '#070713',
        background_color: '#070713',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'browser'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        categories: ['games', 'entertainment'],
        lang: 'pt-BR',
        icons: [
          {
            src: '/brand/bee/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/brand/bee/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/brand/bee/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/brand/bee/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: '/pwa/screenshot-mobile.svg',
            sizes: '1080x1920',
            type: 'image/svg+xml',
            form_factor: 'narrow',
            label: 'MovizzQuizz no celular'
          },
          {
            src: '/pwa/screenshot-desktop.svg',
            sizes: '1600x900',
            type: 'image/svg+xml',
            form_factor: 'wide',
            label: 'MovizzQuizz no desktop'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'movizz-navigation-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rooms') || url.pathname.startsWith('/questions') || url.pathname.startsWith('/app-settings'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'movizz-api-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 12
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request }) => ['image', 'font', 'style', 'script'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'movizz-static-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 14
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
  },
  server: {
    port: 5180,
    host: '0.0.0.0',
    allowedHosts: ['quizz.sirel.com.br'],
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8001',
        ws: true,
      },
      '/health': 'http://localhost:8001',
      '/questions': 'http://localhost:8001',
      '/rooms': 'http://localhost:8001',
      '/app-settings': 'http://localhost:8001',
      '/auth': 'http://localhost:8001',
      '/api/auth': 'http://localhost:8001',
      '/admin': {
        target: 'http://localhost:8001',
        bypass(req) {
          if (req.method === 'GET' && (req.url === '/admin' || req.url === '/admin/')) {
            return '/index.html';
          }
          return undefined;
        },
      },
    },
  },
});
