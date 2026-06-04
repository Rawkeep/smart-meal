import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from './ErrorBoundary.jsx'
import App from './App.jsx'
import { initMonitoring } from './monitoring'
import './index.css'

// Best-effort error monitoring; no-op unless VITE_SENTRY_DSN is set.
initMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
