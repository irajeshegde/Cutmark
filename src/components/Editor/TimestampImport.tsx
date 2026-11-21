import React, { useState } from 'react';
import { parseTimestampRanges } from '../../utils/parseTimestamps';

interface TimestampImportProps {
  onImport: (text: string) => void;
  disabled?: boolean;
}

export const TimestampImport: React.FC<TimestampImportProps> = ({ onImport, disabled }) => {
  const [text, setText] = useState('');
  const count = parseTimestampRanges(text).length;

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-ink-2">
        Paste one range per line, like <code className="font-mono text-ink">3:16-5:14</code> or{' '}
        <code className="font-mono text-ink">8.02-8.55</code>. Millisecond precision works too (
        <code className="font-mono text-ink">03:16.245-05:14.000</code>). Anything else on the line, like a chat name or date, is ignored.
      </p>
      <label htmlFor="paste-ranges" className="sr-only">Timestamp ranges</label>
      <textarea
        id="paste-ranges"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={disabled}
        placeholder={'3.16-5:14\n8.02-8.55\n12.08-13.18'}
        className="field h-auto resize-y py-2 text-xs"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-ink-3" role="status">
          {disabled ? 'Finish re-trimming the clip first.' : count > 0 ? `${count} range${count === 1 ? '' : 's'} found` : 'No ranges found yet'}
        </span>
        <button
          type="button"
          className="btn btn-sm"
          disabled={count === 0 || disabled}
          onClick={() => {
            onImport(text);
            setText('');
          }}
        >
          Add {count > 0 ? `${count} clip${count === 1 ? '' : 's'}` : 'clips'}
        </button>
      </div>
    </div>
  );
};
