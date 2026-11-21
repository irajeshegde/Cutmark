import React from 'react';
import { Check, CloudOff, Download, Loader2, RefreshCw, Share } from 'lucide-react';
import { BRAND } from '../brand';
import { ENGINE_SIZE_LABEL, prepareOffline, promptInstall, reloadForUpdate, usePwa } from '../lib/pwa';

/**
 * Install and offline controls that live in the footer, so they are always findable
 * even if the popup was missed or dismissed.
 */
export const AppControls: React.FC = () => {
  const { canInstall, installed, iosManual, offline, updateReady } = usePwa();

  return (
    <section aria-label="Use it as an app" className="border-t border-line">
      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-[1.4fr_2fr] md:items-start">
        <div>
          <p className="eyebrow">Use it as an app</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-2">
            Install {BRAND.name} to open it from your home screen or desktop, and to keep cutting with no connection.
          </p>
        </div>

        <ul className="space-y-3 text-sm text-ink-2">
          <li className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {installed ? (
              <span className="inline-flex items-center gap-2 text-ink">
                <Check className="h-4 w-4 text-ok" aria-hidden="true" /> Installed on this device
              </span>
            ) : canInstall ? (
              <button type="button" className="btn btn-primary" onClick={() => void promptInstall()}>
                <Download className="h-4 w-4" aria-hidden="true" /> Install app
              </button>
            ) : iosManual ? (
              <span className="inline-flex items-start gap-2 text-ink">
                <Share className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>On iPhone or iPad: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</span>
              </span>
            ) : (
              <span>
                To install, open your browser’s menu and look for <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
                Some browsers, such as desktop Firefox, don’t support installing.
              </span>
            )}
          </li>

          <li className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {offline === 'ready' && (
              <span className="inline-flex items-center gap-2 text-ink" role="status">
                <Check className="h-4 w-4 text-ok" aria-hidden="true" /> Works offline: the audio engine is saved on this device
              </span>
            )}
            {offline === 'downloading' && (
              <span className="inline-flex items-center gap-2" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving the audio engine ({ENGINE_SIZE_LABEL})…
              </span>
            )}
            {(offline === 'unknown' || offline === 'error') && (
              <>
                <span className="inline-flex items-center gap-2">
                  <CloudOff className="h-4 w-4" aria-hidden="true" />
                  {offline === 'error' ? 'Couldn’t save it for offline use. Check your connection and try again.' : 'Not available offline yet.'}
                </span>
                <button type="button" className="btn btn-sm" onClick={() => void prepareOffline()}>
                  Save for offline use ({ENGINE_SIZE_LABEL})
                </button>
              </>
            )}
          </li>

          {updateReady && (
            <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-cut bg-sunk px-3 py-2">
              <span className="text-ink">A new version is ready. Reloading clears whatever you are editing.</span>
              <button type="button" className="btn btn-sm btn-ink" onClick={reloadForUpdate}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reload now
              </button>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
};
