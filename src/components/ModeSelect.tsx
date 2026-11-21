import React from 'react';
import { Crosshair, Layers, Waves } from 'lucide-react';
import { AppMode } from '../types';

interface ModeSelectProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const MODE_TABS: { mode: AppMode; label: string; hint: string; icon: React.ReactNode }[] = [
  { mode: 'editor', label: 'Manual Editor', hint: 'Pick ranges on the waveform', icon: <Waves className="h-3.5 w-3.5" aria-hidden="true" /> },
  { mode: 'finder', label: 'Find Timestamp', hint: 'Find exact cut points by ear', icon: <Crosshair className="h-3.5 w-3.5" aria-hidden="true" /> },
  { mode: 'split', label: 'Equal Split', hint: 'Fixed-length parts', icon: <Layers className="h-3.5 w-3.5" aria-hidden="true" /> },
];

export const tabId = (mode: AppMode) => `tab-${mode}`;
export const panelId = (mode: AppMode) => `panel-${mode}`;

export const ModeSelect: React.FC<ModeSelectProps> = ({ mode, onModeChange }) => {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = MODE_TABS.findIndex((t) => t.mode === mode);
    const next = MODE_TABS[(i + (e.key === 'ArrowRight' ? 1 : -1) + MODE_TABS.length) % MODE_TABS.length];
    onModeChange(next.mode);
    document.getElementById(tabId(next.mode))?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div role="tablist" aria-label="Tool" className="segmented max-w-full flex-wrap" onKeyDown={onKeyDown}>
        {MODE_TABS.map((tab) => (
          <button
            key={tab.mode}
            id={tabId(tab.mode)}
            role="tab"
            type="button"
            aria-selected={mode === tab.mode}
            aria-controls={panelId(tab.mode)}
            tabIndex={mode === tab.mode ? 0 : -1}
            onClick={() => onModeChange(tab.mode)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-3">{MODE_TABS.find((t) => t.mode === mode)?.hint}</p>
    </div>
  );
};
