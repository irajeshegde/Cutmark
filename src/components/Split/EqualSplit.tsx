import React, { useEffect, useRef, useState } from 'react';
import { Scissors } from 'lucide-react';
import { FileHeader } from '../FileHeader';
import { ProcessingView } from '../ProcessingView';
import { ResultView } from '../ResultView';
import { SpoilPanel } from '../SpoilPanel';
import { AudioFileDetails, SpoilSettings } from '../../types';
import { calculateChunks } from '../../utils/audioMetadata';
import { CHUNK_PRESETS_MINUTES, MAX_CHUNK_MINUTES, MIN_CHUNK_MINUTES } from '../../utils/constants';
import { splitAudioFile } from '../../services/ffmpegService';
import { packageOutputs, previewFilenames } from '../../lib/outputs';
import { NO_SPOIL, isSpoilActive } from '../../lib/spoil';
import { useRenderJob } from '../../hooks/useRenderJob';
import { useSpoilPreview } from '../../hooks/useSpoilPreview';

interface EqualSplitProps {
  fileDetails: AudioFileDetails;
  chunkMinutes: number;
  onChunkMinutesChange: (minutes: number) => void;
  onReset: () => void;
}

export const EqualSplit: React.FC<EqualSplitProps> = ({ fileDetails, chunkMinutes, onChunkMinutesChange, onReset }) => {
  const [spoil, setSpoil] = useState<SpoilSettings>(NO_SPOIL);
  const { job, run, cancel, reset } = useRenderJob();
  const preview = useSpoilPreview(spoil);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // A plain <audio> element lets Split mode audition the spoil without decoding a waveform.
  useEffect(() => {
    const url = URL.createObjectURL(fileDetails.file);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileDetails.file]);
  useEffect(() => {
    if (audioUrl) preview.attach(audioRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const plan = calculateChunks(fileDetails.durationSeconds, chunkMinutes);
  const spoilActive = isSpoilActive(spoil);
  const names = previewFilenames(fileDetails.name, plan.totalChunks, fileDetails.extension, spoilActive);
  const shownNames = names.length > 6 ? [...names.slice(0, 3), '…', ...names.slice(-2)] : names;

  const start = () =>
    void run(async ({ signal, report }) => {
      const rendered = await splitAudioFile(
        fileDetails,
        chunkMinutes,
        spoil,
        (percent, _i, _n, message) => report(percent, message),
        signal
      );
      report(94, rendered.length > 1 ? 'Packing the ZIP…' : 'Naming the file…');
      return packageOutputs(rendered, { sourceName: fileDetails.name, spoilt: spoilActive }, (z) => report(94 + z * 0.05, 'Packing the ZIP…'));
    });

  if (job.status === 'done' && job.bundle) {
    return <ResultView bundle={job.bundle} onBack={reset} onStartOver={onReset} />;
  }
  if (job.status !== 'idle') {
    return <ProcessingView job={job} filename={fileDetails.name} onCancel={cancel} onBack={reset} />;
  }

  return (
    <div className="space-y-5">
      <div className="panel">
        <FileHeader fileDetails={fileDetails} onReset={onReset} />
        <div className="panel-body space-y-6">
          <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-end">
            <div>
              <label htmlFor="chunk-minutes" className="eyebrow mb-1.5 block">Length of each part</label>
              <div className="flex items-center gap-2">
                <input
                  id="chunk-minutes"
                  type="number"
                  inputMode="numeric"
                  min={MIN_CHUNK_MINUTES}
                  max={MAX_CHUNK_MINUTES}
                  value={chunkMinutes}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n)) onChunkMinutesChange(Math.min(MAX_CHUNK_MINUTES, Math.max(MIN_CHUNK_MINUTES, Math.round(n))));
                  }}
                  className="field w-24"
                />
                <span className="text-sm text-ink-2">minutes</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common lengths">
              {CHUNK_PRESETS_MINUTES.map((m) => (
                <button key={m} type="button" aria-pressed={chunkMinutes === m} onClick={() => onChunkMinutesChange(m)} className={`btn btn-sm font-mono ${chunkMinutes === m ? 'border-ink bg-ink text-paper hover:bg-ink' : ''}`}>
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="border-y border-line py-4">
            <p className="font-display text-3xl leading-tight text-ink">
              {plan.totalChunks === 1 ? 'One file' : `${plan.totalChunks} parts`}
              <span className="ml-2 text-lg text-ink-3">
                {plan.totalChunks > 1 && `· the last one is ${plan.formattedLastChunkDuration}`}
              </span>
            </p>
            <ul className="mt-3 space-y-1 font-mono text-xs text-ink-2" aria-label="File names">
              {shownNames.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-3">
              {plan.totalChunks === 1
                ? 'The track is shorter than one part, so you get a single file. It downloads directly.'
                : 'Several files come as one ZIP.'}
              {!spoilActive && ' Cuts are lossless where the format allows it.'}
            </p>
          </div>

          <details className="panel" open={spoil.enabled || undefined}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink">
              <span>Spoil the audio <span className="font-normal text-ink-3">· optional</span></span>
              <span className={`chip ${spoilActive ? 'border-warn text-warn' : ''}`}>{spoilActive ? 'On' : 'Off'}</span>
            </summary>
            <div className="border-t border-line">
              <SpoilPanel
                bare
                settings={spoil}
                onChange={setSpoil}
                listen={preview.listen}
                onListenChange={preview.setListen}
                previewAvailable={preview.available}
                playHint="Press play on the player below."
              />
              <div className="border-t border-line p-4">
                {audioUrl && <audio ref={audioRef} src={audioUrl} controls className="w-full" aria-label="Audition the original and spoilt sound" />}
              </div>
            </div>
          </details>

          <button type="button" className="btn btn-primary btn-lg w-full sm:w-auto" onClick={start}>
            <Scissors className="h-4 w-4" aria-hidden="true" />
            {plan.totalChunks === 1 ? 'Export the file' : `Split into ${plan.totalChunks} parts`}
          </button>
        </div>
      </div>
    </div>
  );
};
