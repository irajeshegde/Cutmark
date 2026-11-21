import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { JobState } from '../types';

interface ProcessingViewProps {
  job: JobState;
  filename: string;
  onCancel: () => void;
  /** Shown on error/cancel to return to the tool. */
  onBack: () => void;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ job, filename, onCancel, onBack }) => {
  const failed = job.status === 'error';
  const cancelled = job.status === 'cancelled';

  return (
    <div className="panel">
      <div className="panel-head">
        <p className="eyebrow">{failed ? 'Failed' : cancelled ? 'Cancelled' : 'Working'}</p>
        <p className="max-w-[60%] truncate font-mono text-xs text-ink-3" title={filename}>{filename}</p>
      </div>

      <div className="panel-body space-y-5">
        {failed ? (
          <div role="alert" className="flex items-start gap-3 border border-accent bg-accent-wash px-4 py-3 rounded-cut">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" aria-hidden="true" />
            <div>
              <p className="font-medium text-ink">That didn’t work.</p>
              <p className="mt-1 text-sm leading-6 text-ink-2">{job.error}</p>
            </div>
          </div>
        ) : cancelled ? (
          <p className="text-ink-2">Stopped. Nothing was exported.</p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <p className="flex items-center gap-2 text-ink" role="status" aria-live="polite">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-text" aria-hidden="true" />
                {job.message}
              </p>
              <p className="font-display text-5xl leading-none text-ink tabular-nums">{job.percent}<span className="text-2xl text-ink-3">%</span></p>
            </div>
            <div
              role="progressbar"
              aria-label="Export progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={job.percent}
              className="h-1.5 w-full overflow-hidden bg-sunk"
            >
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(2, job.percent)}%` }} />
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          {job.status === 'running' ? (
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          ) : (
            <button type="button" className="btn btn-ink" onClick={onBack}>Back to editing</button>
          )}
        </div>

        {job.logs.length > 0 && (
          <details className="border-t border-line pt-3 text-xs">
            <summary className="cursor-pointer select-none text-ink-3 hover:text-ink">Activity log</summary>
            <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-ink-2">
              {job.logs.map((line, i) => (
                <li key={i}>› {line}</li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
};
