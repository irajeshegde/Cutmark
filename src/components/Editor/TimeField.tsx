import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { formatPreciseTime } from '../../utils/formatters';

interface TimeFieldProps {
  label: string;
  /** Current value in seconds, or null when there is no selection. */
  valueSec: number | null;
  disabled?: boolean;
  /** Receives the raw text on blur/Enter. Parsing and clamping belong to the caller. */
  onCommit: (raw: string) => void;
  /** When set, shows a button that stamps the playhead into this field. */
  onStamp?: () => void;
  stampLabel?: string;
}

/** Time input that shows mm:ss.mmm, accepts typed or pasted values, and commits on blur or Enter. */
export const TimeField: React.FC<TimeFieldProps> = ({ label, valueSec, disabled, onCommit, onStamp, stampLabel }) => {
  const formatted = valueSec === null ? '' : formatPreciseTime(valueSec);
  const [text, setText] = useState(formatted);

  // Follow the selection when it changes from elsewhere (dragging on the waveform).
  useEffect(() => setText(formatted), [formatted]);

  const id = `time-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-1.5 block">{label}</label>
      <div className="flex gap-1.5">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={text}
          placeholder="mm:ss.mmm"
          onChange={(e) => setText(e.target.value)}
          onBlur={() => text.trim() !== formatted && onCommit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setText(formatted);
          }}
          className="field"
        />
        {onStamp && (
          <button
            type="button"
            className="btn btn-icon h-9 w-9"
            onClick={onStamp}
            disabled={disabled}
            title={stampLabel}
            aria-label={stampLabel}
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
