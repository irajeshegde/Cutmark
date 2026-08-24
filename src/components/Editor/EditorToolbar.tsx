import React from 'react';
import { Play, Pause, Scissors, SplitSquareHorizontal, XCircle, ZoomIn } from 'lucide-react';
import { MAX_GAIN_DB, MIN_GAIN_DB } from '../../utils/constants';
import { parseTimestampRanges } from '../../utils/parseTimestamps';

interface EditorToolbarProps {
  currentTimeSec: number;
  durationSec: number;
  isPlaying: boolean;
  region: { start: number; end: number } | null;
  gainDb: number;
  zoomPxPerSec: number;
  onTogglePlay: () => void;
  onRegionStartChange: (sec: number) => void;
  onRegionEndChange: (sec: number) => void;
  onRegionRangeChange: (start: number, end: number) => void;
  onClearRegion: () => void;
  onGainChange: (db: number) => void;
  onZoomChange: (pxPerSec: number) => void;
  onExtractSelection: () => void;
  onDeleteSelection: () => void;
  onSplitAtPlayhead: () => void;
}

function formatMMSS(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentTimeSec,
  durationSec,
  isPlaying,
  region,
  gainDb,
  zoomPxPerSec,
  onTogglePlay,
  onRegionStartChange,
  onRegionEndChange,
  onRegionRangeChange,
  onClearRegion,
  onGainChange,
  onZoomChange,
  onExtractSelection,
  onDeleteSelection,
  onSplitAtPlayhead,
}) => {
  const handleTimeInput = (raw: string, apply: (sec: number) => void) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Pasting a full range (e.g. "12.08-13.18") into either field sets both ends at once.
    const ranges = parseTimestampRanges(trimmed);
    if (ranges.length === 1) {
      onRegionRangeChange(ranges[0].startSec, ranges[0].endSec);
      return;
    }

    const parts = trimmed.split(':').map(Number);
    if (parts.some(Number.isNaN)) return;
    const sec = parts.length === 2 ? parts[0] * 60 + parts[1] : Number(trimmed);
    if (!Number.isNaN(sec)) apply(Math.min(durationSec, Math.max(0, sec)));
  };

  return (
    <div className="space-y-5">
      {/* Transport row */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center hover:bg-slate-800 dark:hover:bg-indigo-500 transition cursor-pointer shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <span className="font-mono text-sm text-slate-600 dark:text-slate-300 tabular-nums">
          {formatMMSS(currentTimeSec)} / {formatMMSS(durationSec)}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <ZoomIn className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="range"
            min={10}
            max={300}
            value={zoomPxPerSec}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-28 accent-indigo-600"
          />
        </div>
      </div>

      {/* Selection start/end + gain */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">
            Start Point
          </label>
          <input
            type="text"
            disabled={durationSec <= 0}
            defaultValue={region ? formatMMSS(region.start) : ''}
            key={`start-${region?.start ?? 'none'}`}
            onBlur={(e) => handleTimeInput(e.target.value, onRegionStartChange)}
            placeholder="mm:ss or mm.ss-mm.ss"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-100 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">
            End Point
          </label>
          <input
            type="text"
            disabled={durationSec <= 0}
            defaultValue={region ? formatMMSS(region.end) : ''}
            key={`end-${region?.end ?? 'none'}`}
            onBlur={(e) => handleTimeInput(e.target.value, onRegionEndChange)}
            placeholder="mm:ss or mm.ss-mm.ss"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-100 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">
            Gain ({gainDb > 0 ? '+' : ''}{gainDb} dB)
          </label>
          <input
            type="range"
            min={MIN_GAIN_DB}
            max={MAX_GAIN_DB}
            value={gainDb}
            onChange={(e) => onGainChange(Number(e.target.value))}
            className="w-full accent-indigo-600 mt-2.5"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onExtractSelection}
          disabled={!region}
          className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100/80 dark:hover:bg-indigo-500/20 px-3.5 py-2 rounded-lg border border-indigo-100 dark:border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Scissors className="w-3.5 h-3.5" /> Extract Selection
        </button>

        <button
          onClick={onDeleteSelection}
          disabled={!region}
          className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100/80 dark:hover:bg-rose-500/20 px-3.5 py-2 rounded-lg border border-rose-100 dark:border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <XCircle className="w-3.5 h-3.5" /> Delete Selection
        </button>

        <button
          onClick={onSplitAtPlayhead}
          className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <SplitSquareHorizontal className="w-3.5 h-3.5" /> Split at Playhead
        </button>

        {region && (
          <button
            onClick={onClearRegion}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3.5 py-2 rounded-lg transition cursor-pointer ml-auto"
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
};
