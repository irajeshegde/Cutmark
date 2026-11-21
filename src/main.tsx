import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {inject} from '@vercel/analytics';
import {registerSW} from 'virtual:pwa-register';
import {setUpdateHandler, startPwa} from './lib/pwa';
import './index.css';

// Vercel Web Analytics: cookieless page-view counts only. It never sees audio
// or file names. Skipped on localhost so dev, tests and previews stay silent.
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (import.meta.env.PROD && !isLocal) inject();

startPwa();

// Offline support. A new version waits until the person taps "Reload", so an update
// can never wipe clips they are editing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      setUpdateHandler(() => void updateSW(true));
    },
    onRegisteredSW(_url, registration) {
      // An installed app can stay open for days; look for a new version hourly.
      if (registration) setInterval(() => void registration.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
