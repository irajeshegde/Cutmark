import React, { useState } from 'react';
import { Check, ClipboardCopy, Pause, Play, Trash2 } from 'lucide-react';
import { TimestampMark } from '../../types';
import { formatHumanDuration, formatPreciseTime } from '../../utils/formatters';

interface MarkListProps {
  marks: TimestampMark[];
  onRemoveMark: (id: string) => void;
  onPreviewMark: (mark: TimestampMark) => void;
  previewingMarkId: string | null;
  /** Sends the marks to the Manual Editor as clips. */
  onSendToEditor: (marks: TimestampMark[]) => void;
}

export function marksToText(marks: TimestampMark[]): string {
  return marks.map((m) => `${formatPreciseTime(m.startSec)}-${formatPreciseTime(m.endSec)}`).join('\n');
}

export const MarkList: React.FC<MarkListProps> = ({ marks, onRemoveMark, onPreviewMark, previewingMarkId, onSendToEditor }) => {
  const [copied, setCopied] = useState(false);
  const text = marksToText(marks);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the read-only box below is selectable as a fallback.
    }
  };

  return (
    <section className="panel" aria-labelledby="marks-title">
      <div className="panel-head">
        <h3 id="marks-title" className="text-sm font-semibold text-ink">
          Marked ranges <span className="ml-1 font-mono text-xs font-normal text-ink-3">{marks.length}</span>
        </h3>
      </div>

      {marks.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-3">
          Nothing marked yet. Play, pause on the beat, press the pin next to Start or End, then <strong className="font-medium text-ink-2">Add range</strong>.
        </p>
      ) : (
        <>
          <ol className="divide-y divide-line">
            {marks.map((mark, i) => (
              <li key={mark.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 shrink-0 font-mono text-xs text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-ink">{formatPreciseTime(mark.startSec)} to {formatPreciseTime(mark.endSec)}</p>
                  <p className="font-mono text-xs text-ink-3">{formatHumanDuration(mark.endSec - mark.startSec)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-quiet btn-icon"
                  onClick={() => onPreviewMark(mark)}
                  aria-label={`${previewingMarkId === mark.id ? 'Pause' : 'Play'} range ${i + 1}`}
                >
                  {previewingMarkId === mark.id ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                </button>
                <button type="button" className="btn btn-quiet btn-icon btn-danger" onClick={() => onRemoveMark(mark.id)} aria-label={`Remove range ${i + 1}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>

          <div className="space-y-3 border-t border-line p-4">
            <label htmlFor="marks-text" className="eyebrow block">As text, one range per line</label>
            <textarea id="marks-text" readOnly value={text} rows={Math.min(6, marks.length)} className="field h-auto text-xs" />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => onSendToEditor(marks)}>
                Cut these in the editor
              </button>
              <button type="button" className="btn" onClick={copy}>
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy all'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
