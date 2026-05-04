import React from 'react';
import { createRoot } from 'react-dom/client';
import MovizzEntryShell from './MovizzEntryShell.jsx';
import './styles.css';
import './clean-lobby.css';
import './structured-lobby.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MovizzEntryShell />
  </React.StrictMode>
);
