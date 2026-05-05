import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function movizzManualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
    if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-socket';
    if (id.includes('lucide-react')) return 'vendor-icons';
    if (id.includes('@capacitor')) return 'vendor-capacitor';
    return 'vendor';
  }

  if (
    id.includes('/src/LudoBoard') ||
    id.includes('/src/ludoBoardGeometry') ||
    id.includes('/src/ludo-interactions.css')
  ) {
    return 'game-ludo';
  }

  if (id.includes('/src/AuthFirstEntry') || id.includes('/src/auth-first.css')) {
    return 'entry-auth';
  }

  if (id.includes('/src/components/PWAInstallPrompt') || id.includes('/src/components/MobileNativeBridge')) {
    return 'mobile-shell';
  }

  return undefined;
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'pwa/icon.svg',
        'pwa/maskable-icon.svg',
        'pwa/apple-touch-icon.svg',
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
            src: '/pwa/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa/maskable-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
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
    rollupOptions: {
      output: {
        manualChunks: movizzManualChunks,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
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
