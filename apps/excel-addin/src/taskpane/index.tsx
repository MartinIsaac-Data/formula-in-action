/* global Office, document */
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

function render(): void {
  const container = document.getElementById('root');
  if (!container) throw new Error('#root not found');
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

// Office.js is loaded from the CDN in index.html. Wait for it before rendering so
// the Excel APIs are available to the hooks.
if (typeof Office !== 'undefined' && typeof Office.onReady === 'function') {
  void Office.onReady().then(render);
} else {
  // Running outside Office (e.g. plain browser preview) — render anyway.
  render();
}
