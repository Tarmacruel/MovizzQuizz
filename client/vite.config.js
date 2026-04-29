import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
