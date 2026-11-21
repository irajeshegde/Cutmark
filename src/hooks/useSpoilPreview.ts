import { useCallback, useEffect, useRef, useState } from 'react';
import { SpoilSettings } from '../types';
import { PreviewChain } from '../services/previewChain';
import { isSpoilActive } from '../lib/spoil';

export type ListenMode = 'spoilt' | 'original';

/**
 * Wires an <audio> element into the live preview chain and keeps it in sync
 * with the spoil settings, the Original/Spoilt switch and the gain.
 *
 * `attach(media)` is called once the element exists (waveform ready / audio
 * mounted). Browsers allow createMediaElementSource only once per element, so
 * the chain is torn down and rebuilt only when the element itself changes.
 */
export function useSpoilPreview(settings: SpoilSettings, gainDb = 0) {
  const chainRef = useRef<PreviewChain | null>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [listen, setListen] = useState<ListenMode>('spoilt');
  const [available, setAvailable] = useState(true);

  const apply = useCallback(
    (chain: PreviewChain | null) => {
      if (!chain) return;
      chain.setGainDb(gainDb);
      chain.setSpoil(listen === 'spoilt' && isSpoilActive(settings) ? settings : null);
    },
    [settings, listen, gainDb]
  );

  const attach = useCallback(
    (media: HTMLMediaElement | null) => {
      if (media === mediaRef.current) return;
      chainRef.current?.dispose();
      chainRef.current = null;
      mediaRef.current = media;
      if (!media) return;
      try {
        const chain = new PreviewChain(media);
        chainRef.current = chain;
        media.addEventListener('play', () => chain.resume());
        apply(chain);
        setAvailable(true);
      } catch (err) {
        console.warn('Live spoil preview unavailable:', err);
        setAvailable(false);
      }
    },
    [apply]
  );

  useEffect(() => apply(chainRef.current), [apply]);
  useEffect(() => () => chainRef.current?.dispose(), []);

  return { listen, setListen, attach, available };
}
