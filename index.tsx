
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE || 'production',
  tracesSampleRate: 0.2,
});

window.addEventListener('vite:preloadError', (event) => {
  if (!sessionStorage.getItem('vite_preload_error')) {
    sessionStorage.setItem('vite_preload_error', 'true');
    window.location.reload();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="p-8 text-center bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center"><h2 className="text-2xl font-bold mb-2">System Anomaly Detected</h2><p className="text-slate-400 mb-4">Our Sentry error tracking team has been notified.</p><button onClick={() => window.location.reload()} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400">Reload Vault</button></div>}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}
