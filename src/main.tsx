import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { appCache } from './services/cache'

// Set up periodic cache cleanup to prevent memory leaks
// Run every 60 seconds to remove expired entries
const CACHE_CLEANUP_INTERVAL_MS = 60 * 1000;
setInterval(() => {
  appCache.clearExpired();
}, CACHE_CLEANUP_INTERVAL_MS);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
