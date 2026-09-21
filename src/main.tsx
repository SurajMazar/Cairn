import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import { registerServiceWorker } from './lib/serviceWorker';

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing from the page.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registered only in a build, so the dev server's hot reloading is untouched.
if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void registerServiceWorker();
  });
}
