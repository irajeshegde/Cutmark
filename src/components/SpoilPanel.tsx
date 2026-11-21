import React, { useEffect } from 'react';
import { Headphones, ShieldAlert } from 'lucide-react';
import { SpoilSettings } from '../types';
import { ListenMode } from '../hooks/useSpoilPreview';
import { shouldIgnoreShortcut } from '../hooks/useSeekShortcuts';
import { SPOIL_PRESETS, applyPreset, describeSeverity, matchingPreset } from '../lib/spoil';

interface SpoilPanelProps {
  settings: SpoilSettings;
  onChange: (settings: SpoilSettings) => void;
  listen: ListenMode;
  onListenChange: (mode: ListenMode) => void;
  /** False when the browser cannot build the live preview (no Web Audio). */
  previewAvailable: boolean;
  /** Where the user can press play to audition. */
  playHint: string;
  /** Render without its own frame and title, for use inside a collapsible that already has one. */
  bare?: boolean;
}

const SLIDERS: { key: 'muffleAmount' | 'wobbleAmount' | 'noiseAmount'; label: string; hint: string }[] = [
  { key: 'muffleAmount', label: 'Muffle', hint: 'Cuts the highs, like a recording from the next room.' },
  { key: 'wobbleAmount', label: 'Wobble', hint: 'Pitch flutter, like a worn tape.' },
  { key: 'noiseAmount', label: 'Hiss', hint: 'A bed of pink noise under the music.' },
];

const METER_FILL: Record<string, string> = {
  none: 'bg-line-strong',
  barely: 'bg-ok',
  noticeable: 'bg-warn',
  clear: 'bg-accent',
  heavy: 'bg-accent',
};

export const SpoilPanel: React.FC<SpoilPanelProps> = ({ settings, onChange, listen, onListenChange, previewAvailable, playHint, bare }) => {
  const severity = describeSeverity(settings);
  const preset = matchingPreset(settings);
  const set = (patch: Partial<SpoilSettings>) => onChange({ ...settings, ...patch });

  // B flips between the original and the spoilt sound, so it can be done while listening.
  useEffect(() => {
    if (!previewAvailable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyB' || e.altKey || e.shiftKey || shouldIgnoreShortcut(e)) return;
      onListenChange(listen === 'spoilt' ? 'original' : 'spoilt');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listen, onListenChange, previewAvailable]);

  const applyToggle = (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-2">
      <input type="checkbox" checked={settings.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-3.5 w-3.5" />
      Apply to export
    </label>
  );

  return (
    <section className={bare ? undefined : 'panel'} aria-labelledby={bare ? undefined : 'spoil-title'} aria-label={bare ? 'Spoil the audio' : undefined}>
      {!bare && (
        <div className="panel-head">
          <h3 id="spoil-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldAlert className="h-4 w-4 text-ink-3" aria-hidden="true" /> Spoil the audio
          </h3>
          {applyToggle}
        </div>
      )}

      <div className="panel-body space-y-5">
        {bare && applyToggle}
        <p className="max-w-2xl text-sm leading-6 text-ink-2">
          Make an exported copy deliberately worse, so it works as a preview but not as a replacement for the original.
          The exported file is also tagged <span className="font-mono text-ink">_spoilt</span> in its name.
        </p>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Presets">
          {SPOIL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              aria-pressed={preset === p.id}
              onClick={() => onChange(applyPreset(p.id))}
              className={`btn btn-sm ${preset === p.id ? 'border-ink bg-ink text-paper hover:bg-ink' : ''}`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-quiet"
            onClick={() => onChange({ enabled: false, noiseAmount: 0, muffleAmount: 0, wobbleAmount: 0 })}
          >
            Off
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {SLIDERS.map(({ key, label, hint }) => (
            <div key={key}>
              <label htmlFor={`spoil-${key}`} className="flex items-baseline justify-between">
                <span className="eyebrow">{label}</span>
                <span className="font-mono text-xs text-ink-2 tabular-nums">{settings[key]}%</span>
              </label>
              <input
                id={`spoil-${key}`}
                type="range"
                min={0}
                max={100}
                value={settings[key]}
                onChange={(e) => onChange({ ...settings, enabled: true, [key]: Number(e.target.value) })}
                className="mt-2 w-full"
                aria-describedby={`spoil-${key}-hint`}
              />
              <p id={`spoil-${key}-hint`} className="mt-1 text-xs leading-5 text-ink-3">{hint}</p>
            </div>
          ))}
        </div>

        {/* severity meter */}
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow">How spoilt</p>
            <p className="text-sm font-medium text-ink">
              {severity.label} <span className="font-mono text-xs text-ink-3">{severity.score}/100</span>
            </p>
          </div>
          <div
            role="meter"
            aria-label="How spoilt the export will sound"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={severity.score}
            aria-valuetext={`${severity.label}, ${severity.score} out of 100`}
            className="relative h-2 w-full bg-sunk"
          >
            <div className={`h-full transition-all duration-200 ${METER_FILL[severity.level]}`} style={{ width: `${severity.score}%` }} />
            {[20, 45, 70].map((tick) => (
              <span key={tick} className="absolute top-0 h-full w-px bg-paper" style={{ left: `${tick}%` }} aria-hidden="true" />
            ))}
          </div>
          <p className="font-mono text-xs text-ink-3">{severity.detail}</p>
        </div>

        {/* live A/B */}
        <div className="cutline space-y-2 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5" aria-hidden="true" /> Listen live
            </p>
            <div className="segmented" role="group" aria-label="Which version to hear">
              <button type="button" aria-pressed={listen === 'original'} onClick={() => onListenChange('original')} disabled={!previewAvailable}>
                Original
              </button>
              <button type="button" aria-pressed={listen === 'spoilt'} onClick={() => onListenChange('spoilt')} disabled={!previewAvailable}>
                Spoilt
              </button>
            </div>
            <kbd title="Press B to switch">B</kbd>
          </div>
          <p className="text-xs leading-5 text-ink-3">
            {previewAvailable
              ? `${playHint} Flip between the two while it plays. This is a close preview; the exported file is the real thing and you can play it before downloading.`
              : 'Live preview needs Web Audio, which this browser does not offer. The export will still be spoilt; you can listen to it before downloading.'}
          </p>
        </div>
      </div>
    </section>
  );
};
