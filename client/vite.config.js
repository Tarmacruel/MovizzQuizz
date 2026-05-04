import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MovizzQuizz',
        short_name: 'MovizzQuizz',
        description: 'Quiz, Stop e Ludo online para jogar com amigos.',
        theme_color: '#070713',
        background_color: '#070713',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rooms') || url.pathname.startsWith('/questions') || url.pathname.startsWith('/app-settings'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'movizz-api-cache',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 12
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
