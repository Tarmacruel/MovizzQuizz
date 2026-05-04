import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import AuthFirstEntry from './AuthFirstEntry.jsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx';
import './styles.css';
import './clean-lobby.css';
import './auth-first.css';
import './pwa-mobile.css';

registerSW({
  immediate: true,
  onRegistered(registration) {
    registration?.update?.();
  },
  onRegisterError(error) {
    console.warn('Falha ao registrar o service worker do MovizzQuizz.', error);
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthFirstEntry />
    <PWAInstallPrompt />
  </React.StrictMode>
);
