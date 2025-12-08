/* ===================================================
   CréaVisuel SaaS - Main Entry Point
   ================================================= */

import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';

// Import shared styles
import './index.css'; // Main CSS with Sci-Fi animations
import './shared/styles/glassmorphism.css';
import './shared/styles/animations.css';
import './shared/styles/sci-fi-effects.css';
import './apps/client/index.css'; // Tailwind base (includes both apps styles)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);
