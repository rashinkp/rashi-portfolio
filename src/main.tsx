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

// A cached/fallback homepage response must not flash or hydrate the portfolio
// when the actual browser route is chat.
const isChatRoute = window.location.pathname.replace(/\/$/, '') === '/chat'
if (isChatRoute && root.dataset.prerendered === 'true') root.replaceChildren()
if (!isChatRoute && root.dataset.prerendered === 'true') hydrateRoot(root, app)
else createRoot(root).render(app)
