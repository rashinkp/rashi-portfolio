import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installAnalytics } from './lib/analytics'

installAnalytics()

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Hydrate only when the static shell matches the current route, including
// unknown URLs served through a cached homepage or the custom 404 document.
const isHomeRoute = window.location.pathname === '/'
const isNotFoundShell = root.dataset.prerendered === '404'
const canHydrate = isNotFoundShell ? !isHomeRoute && window.location.pathname.replace(/\/$/, '') !== '/chat' : isHomeRoute
if (!canHydrate && root.dataset.prerendered) root.replaceChildren()
if (canHydrate && root.dataset.prerendered) hydrateRoot(root, app)
else createRoot(root).render(app)
