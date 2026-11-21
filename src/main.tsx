import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {inject} from '@vercel/analytics';
import './index.css';

// Vercel Web Analytics: cookieless page-view counts only. It never sees audio
// or file names. Skipped on localhost so dev, tests and previews stay silent.
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (import.meta.env.PROD && !isLocal) inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
