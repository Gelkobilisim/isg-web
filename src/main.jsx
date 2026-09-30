import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

// Safe PWA registration without disruptive auto-reloads
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version detected; will apply quietly on next startup.');
  },
  onOfflineReady() {
    console.log('[PWA] Application ready for offline use.');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
)