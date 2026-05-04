import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthFirstEntry from './AuthFirstEntry.jsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx';
import './styles.css';
import './clean-lobby.css';
import './auth-first.css';
import './pwa-mobile.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthFirstEntry />
    <PWAInstallPrompt />
  </React.StrictMode>
);
