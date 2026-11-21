import React from 'react';
import { WaveformRegion } from './Waveform';
import { TimeField } from './TimeField';
import { formatHumanDuration } from '../../utils/formatters';

interface SelectionControlsProps {
  region: WaveformRegion | null;
  disabled: boolean;
  onCommit: (raw: string, which: 'start' | 'end') => void;
  onStampStart?: () => void;
  onStampEnd?: () => void;
  /** Extra control rendered in the third column (the editor puts the gain slider here). */
  children?: React.ReactNode;
}

/** Start / end fields (typed, pasted, or stamped from the playhead) plus the selection length. */
export const SelectionControls: React.FC<SelectionControlsProps> = ({ region, disabled, onCommit, onStampStart, onStampEnd, children }) => (
  <div className="space-y-2">
    <div className={`grid grid-cols-2 gap-3 ${children ? 'sm:grid-cols-3' : ''}`}>
      <TimeField
        label="Start"
        valueSec={region?.start ?? null}
        disabled={disabled}
        onCommit={(raw) => onCommit(raw, 'start')}
        onStamp={onStampStart}
        stampLabel="Set start to the playhead"
      />
      <TimeField
        label="End"
        valueSec={region?.end ?? null}
        disabled={disabled}
        onCommit={(raw) => onCommit(raw, 'end')}
        onStamp={onStampEnd}
        stampLabel="Set end to the playhead"
      />
      {children && <div className="col-span-2 sm:col-span-1">{children}</div>}
    </div>
    <p className="min-h-5 font-mono text-xs text-ink-3">
      {region ? `Selection: ${formatHumanDuration(region.end - region.start)} (${(region.end - region.start).toFixed(2)} s)` : 'No selection yet.'}
      <span className="hidden sm:inline"> You can paste a whole range like <span className="text-ink-2">3:16-5:14</span> into either box.</span>
    </p>
  </div>
);
