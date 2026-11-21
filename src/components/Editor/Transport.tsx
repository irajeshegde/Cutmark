import React from 'react';
import { Pause, Play, ZoomIn } from 'lucide-react';
import { formatMinutesSeconds, formatPreciseTime } from '../../utils/formatters';
import { SeekSteps } from './SeekSteps';

interface TransportProps {
  currentTimeSec: number;
  durationSec: number;
  isPlaying: boolean;
  zoomPxPerSec: number;
  minZoomPxPerSec: number;
  onTogglePlay: () => void;
  onStep: (deltaSec: number) => void;
  onZoomChange: (pxPerSec: number) => void;
}

export const Transport: React.FC<TransportProps> = ({
  currentTimeSec,
  durationSec,
  isPlaying,
  zoomPxPerSec,
  minZoomPxPerSec,
  onTogglePlay,
  onStep,
  onZoomChange,
}) => (
  <div className="space-y-2.5">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="btn btn-ink h-11 w-11 p-0"
      >
        {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />}
      </button>

      <div className="leading-tight" aria-label="Playhead position" role="timer">
        <p className="font-mono text-xl tabular-nums text-ink">{formatPreciseTime(currentTimeSec)}</p>
        <p className="font-mono text-[11px] text-ink-3 tabular-nums">of {formatMinutesSeconds(durationSec)}</p>
      </div>

      <SeekSteps onStep={onStep} />

      <label className="flex items-center gap-2 sm:ml-auto">
        <ZoomIn className="h-4 w-4 text-ink-3" aria-hidden="true" />
        <span className="sr-only">Zoom</span>
        <input
          type="range"
          min={minZoomPxPerSec}
          max={Math.max(300, minZoomPxPerSec)}
          value={zoomPxPerSec}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 sm:w-32"
        />
      </label>
    </div>

    <p className="text-[11px] leading-5 text-ink-3">
      <kbd>Space</kbd> play/pause · <kbd>←</kbd> <kbd>→</kbd> 100 ms · <kbd>Shift</kbd> + arrow 1 s · <kbd>Alt</kbd> + arrow 10 ms
    </p>
  </div>
);
