import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Download, FileArchive, Pause, Play, RotateCcw } from 'lucide-react';
import { OutputBundle } from '../types';
import { planDownload } from '../lib/downloadPlan';
import { triggerBlobDownload } from '../lib/download';
import { formatFileSize } from '../utils/formatters';

interface ResultViewProps {
  bundle: OutputBundle;
  onBack: () => void;
  onStartOver: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ bundle, onBack, onStartOver }) => {
  const plan = planDownload(bundle);
  const [playing, setPlaying] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(null);
  };

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const togglePlay = (index: number) => {
    if (playing === index) return stop();
    const file = bundle.files[index];
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setPlaying(null));
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(file.blob);
    audioRef.current.src = urlRef.current;
    void audioRef.current.play().catch(() => setPlaying(null));
    setPlaying(index);
  };

  const handleDownload = () => {
    if (plan.kind === 'empty') return;
    triggerBlobDownload(plan.blob, plan.filename);
    setDownloaded(true);
  };

  const count = bundle.files.length;
  const heading = count === 1 ? 'Your file is ready.' : `${count} files, ready in one ZIP.`;

  return (
    <div className="panel">
      <div className="panel-head">
        <p className="eyebrow">Done</p>
        {bundle.spoilt && (
          <span className="chip border-warn text-warn" title="Protect Original was applied to this export">
            Degraded on purpose
          </span>
        )}
      </div>

      <div className="panel-body space-y-6">
        <div>
          <h2 className="font-display text-4xl leading-tight text-ink">{heading}</h2>
          {bundle.spoilt && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-2">
              This copy has been spoilt deliberately. Press play on a file below to hear exactly what you are about to
              share — the live preview was an approximation, this is the real export.
            </p>
          )}
        </div>

        <ul className="divide-y divide-line border-y border-line" aria-label="Exported files">
          {bundle.files.map((file, i) => (
            <li key={file.filename} className="flex items-center gap-3 py-3">
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => togglePlay(i)}
                aria-label={`${playing === i ? 'Pause' : 'Play'} ${file.filename}`}
              >
                {playing === i ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="ml-0.5 h-3.5 w-3.5" aria-hidden="true" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-ink" title={file.filename}>{file.filename}</p>
                <p className="font-mono text-xs text-ink-3">
                  {file.formattedDuration} · {formatFileSize(file.size)} · {file.formattedRange}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          {plan.kind !== 'empty' && (
            <button type="button" className="btn btn-primary btn-lg" onClick={handleDownload}>
              {plan.kind === 'zip' ? <FileArchive className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {plan.kind === 'zip'
                ? `Download ZIP (${plan.fileCount} files, ${formatFileSize(plan.size)})`
                : `Download ${formatFileSize(plan.size)}`}
            </button>
          )}
          {downloaded && plan.kind !== 'empty' && (
            <p role="status" className="flex items-center gap-1.5 text-sm text-ok">
              <Check className="h-4 w-4" aria-hidden="true" /> Saved as <span className="font-mono">{plan.filename}</span>
            </p>
          )}
        </div>
        {plan.kind === 'single' && (
          <p className="-mt-3 font-mono text-xs text-ink-3">{plan.filename}</p>
        )}

        <div className="cutline pt-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to editing
            </button>
            <button type="button" className="btn btn-quiet" onClick={onStartOver}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Start over with another file
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
