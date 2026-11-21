import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { BRAND } from '../brand';
import { ENGINE_SIZE_LABEL, dismissBanner, promptInstall, usePwa } from '../lib/pwa';

/**
 * The install popup. Shown on the home screen only (never over the editor), and only
 * when installing is actually possible. Closing it is remembered; the footer keeps an
 * install control either way, so a missed or dismissed popup is never a dead end.
 */
export const InstallBanner: React.FC = () => {
  const { canInstall, iosManual, installed, bannerDismissed } = usePwa();
  const [footerInView, setFooterInView] = useState(false);

  // The footer carries the same controls; don't cover them while they are on screen.
  useEffect(() => {
    const panel = document.querySelector('[aria-label="Use it as an app"]');
    if (!panel || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting));
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  if (footerInView || installed || bannerDismissed || (!canInstall && !iosManual)) return null;

  return (
    <aside
      aria-label={`Install ${BRAND.name}`}
      className="fade-up fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-cut border border-line-strong bg-surface p-4 shadow-lg sm:left-auto sm:right-6 sm:bottom-6 sm:mx-0"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button type="button" onClick={dismissBanner} className="btn btn-quiet btn-icon btn-sm absolute right-1.5 top-1.5" aria-label="Close install suggestion">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <p className="pr-8 font-display text-xl leading-tight text-ink">Install {BRAND.name}</p>
      <p className="mt-1.5 text-sm leading-6 text-ink-2">
        Opens like an app and works with no connection. Your audio still never leaves the device.
        {canInstall ? ` The audio engine (${ENGINE_SIZE_LABEL}) downloads once so it can run offline.` : ''}
      </p>
      {canInstall ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => void promptInstall()}>
            <Download className="h-4 w-4" aria-hidden="true" /> Install app
          </button>
          <button type="button" className="btn btn-quiet" onClick={dismissBanner}>Not now</button>
        </div>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-cut bg-sunk px-3 py-2 text-sm leading-6 text-ink">
          <Share className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
          </span>
        </p>
      )}
    </aside>
  );
};
