import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing from the page.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registered only in a build, so the dev server's hot reloading is untouched.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline support is a bonus; the app works fine without it.
    });
  });
}
