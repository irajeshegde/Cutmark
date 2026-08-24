import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Waveform, WaveformHandle, WaveformRegion } from './Waveform';
import { EditorToolbar } from './EditorToolbar';
import { ClipList } from './ClipList';
import { TimestampImport } from './TimestampImport';
import { ProcessingProgress } from '../ProcessingProgress';
import { CompletionView } from '../CompletionView';
import { AudioFileDetails, ChunkInfo, EditorClip, ProcessingProgressState } from '../../types';
import { formatFileSize } from '../../utils/formatters';
import { DEFAULT_GAIN_DB } from '../../utils/constants';
import { parseTimestampRanges } from '../../utils/parseTimestamps';
import { exportClips } from '../../services/audioEditorService';
import { createAndDownloadZip } from '../../services/zipService';

interface AudioEditorProps {
  fileDetails: AudioFileDetails;
  onReset: () => void;
}

function dbToLinear(db: number): number {
  return Math.min(1, Math.max(0, Math.pow(10, db / 20)));
}

const BOUNDARY_EPSILON_SEC = 0.05;

const IDLE_EXPORT_STATE: ProcessingProgressState = {
  stage: 'idle',
  currentChunkIndex: 0,
  totalChunks: 0,
  progressPercent: 0,
  statusMessage: '',
  logs: [],
};

export const AudioEditor: React.FC<AudioEditorProps> = ({ fileDetails, onReset }) => {
  const waveformRef = useRef<WaveformHandle>(null);

  const [durationSec, setDurationSec] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [region, setRegion] = useState<WaveformRegion | null>(null);
  const [gainDb, setGainDb] = useState(DEFAULT_GAIN_DB);
  const [zoomPxPerSec, setZoomPxPerSec] = useState(50);

  const [clips, setClips] = useState<EditorClip[]>([]);
  const [joinIntoOne, setJoinIntoOne] = useState(false);

  const [exportState, setExportState] = useState<ProcessingProgressState>(IDLE_EXPORT_STATE);
  const [resultChunks, setResultChunks] = useState<ChunkInfo[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const relabel = (list: EditorClip[]): EditorClip[] =>
    list.map((c, i) => ({ ...c, label: `part${String(i + 1).padStart(2, '0')}` }));

  const handleGainChange = (db: number) => {
    setGainDb(db);
    waveformRef.current?.setVolume(dbToLinear(db));
  };

  const handleZoomChange = (px: number) => {
    setZoomPxPerSec(px);
    waveformRef.current?.setZoom(px);
  };

  const handleRegionStartChange = (sec: number) => {
    const currentEnd = region ? region.end : Math.min(durationSec, sec + 1);
    const newStart = Math.min(sec, currentEnd - BOUNDARY_EPSILON_SEC);
    waveformRef.current?.setRegionTimes(newStart, currentEnd);
  };

  const handleRegionEndChange = (sec: number) => {
    const currentStart = region ? region.start : 0;
    const newEnd = Math.max(sec, currentStart + BOUNDARY_EPSILON_SEC);
    waveformRef.current?.setRegionTimes(currentStart, newEnd);
  };

  const handleRegionRangeChange = (start: number, end: number) => {
    if (durationSec <= 0) return;
    const clampedStart = Math.max(0, Math.min(start, durationSec));
    const clampedEnd = Math.max(clampedStart + BOUNDARY_EPSILON_SEC, Math.min(end, durationSec));
    waveformRef.current?.setRegionTimes(clampedStart, clampedEnd);
  };

  const handleExtractSelection = () => {
    if (!region) return;
    setClips((prev) =>
      relabel([...prev, { id: crypto.randomUUID(), startSec: region.start, endSec: region.end, gainDb, label: '' }])
    );
    waveformRef.current?.clearRegion();
  };

  const handleDeleteSelection = () => {
    if (!region || durationSec <= 0) return;
    const remaining: EditorClip[] = [];

    if (region.start > BOUNDARY_EPSILON_SEC) {
      remaining.push({ id: crypto.randomUUID(), startSec: 0, endSec: region.start, gainDb: 0, label: '' });
    }
    if (region.end < durationSec - BOUNDARY_EPSILON_SEC) {
      remaining.push({ id: crypto.randomUUID(), startSec: region.end, endSec: durationSec, gainDb: 0, label: '' });
    }
    if (remaining.length === 0) return;

    setClips(relabel(remaining));
    if (remaining.length > 1) setJoinIntoOne(true);
    waveformRef.current?.clearRegion();
  };

  const handleSplitAtPlayhead = () => {
    if (durationSec <= 0) return;

    if (clips.length === 0) {
      if (currentTimeSec <= BOUNDARY_EPSILON_SEC || currentTimeSec >= durationSec - BOUNDARY_EPSILON_SEC) return;
      setClips(
        relabel([
          { id: crypto.randomUUID(), startSec: 0, endSec: currentTimeSec, gainDb: 0, label: '' },
          { id: crypto.randomUUID(), startSec: currentTimeSec, endSec: durationSec, gainDb: 0, label: '' },
        ])
      );
      return;
    }

    const idx = clips.findIndex(
      (c) => currentTimeSec > c.startSec + BOUNDARY_EPSILON_SEC && currentTimeSec < c.endSec - BOUNDARY_EPSILON_SEC
    );
    if (idx === -1) return;

    const target = clips[idx];
    const head: EditorClip = { ...target, id: crypto.randomUUID(), endSec: currentTimeSec };
    const tail: EditorClip = { ...target, id: crypto.randomUUID(), startSec: currentTimeSec };

    setClips((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1, head, tail);
      return relabel(copy);
    });
  };

  const handleImportTimestamps = (text: string) => {
    const ranges = parseTimestampRanges(text);
    if (ranges.length === 0) return;

    const imported: EditorClip[] = ranges
      .map((r) => ({
        id: crypto.randomUUID(),
        startSec: Math.max(0, r.startSec),
        endSec: durationSec > 0 ? Math.min(r.endSec, durationSec) : r.endSec,
        gainDb: 0,
        label: '',
      }))
      .filter((c) => c.endSec > c.startSec);

    if (imported.length === 0) return;
    setClips((prev) => relabel([...prev, ...imported]));
  };

  const handleRemoveClip = (id: string) => {
    setClips((prev) => relabel(prev.filter((c) => c.id !== id)));
  };

  const handleMoveClip = (id: string, direction: 'up' | 'down') => {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
      return relabel(copy);
    });
  };

  const handleClipGainChange = (id: string, db: number) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, gainDb: db } : c)));
  };

  const handleExport = async () => {
    if (clips.length === 0) return;

    setExportState({
      stage: 'processing',
      currentChunkIndex: 0,
      totalChunks: clips.length,
      progressPercent: 1,
      statusMessage: 'Starting export...',
      logs: ['Initializing editor export...'],
    });

    try {
      const chunks = await exportClips(fileDetails, clips, joinIntoOne, (percent, current, total, logMsg) => {
        setExportState((prev) => ({
          ...prev,
          progressPercent: percent,
          currentChunkIndex: current,
          totalChunks: total,
          statusMessage: logMsg,
          logs: [...prev.logs, logMsg].slice(-15),
        }));
      });

      setResultChunks(chunks);

      setExportState((prev) => ({
        ...prev,
        stage: 'zipping',
        progressPercent: 95,
        statusMessage: 'Creating ZIP file and triggering download...',
        logs: [...prev.logs, 'Bundling exported clips into JSZip...'],
      }));

      const generatedZipBlob = await createAndDownloadZip(fileDetails.name, chunks, (zipPercent) => {
        setExportState((prev) => ({
          ...prev,
          progressPercent: Math.min(99, 92 + Math.round(zipPercent * 0.08)),
          statusMessage: `Compressing ZIP file (${zipPercent}%)...`,
        }));
      });

      setZipBlob(generatedZipBlob);

      setExportState({
        stage: 'completed',
        currentChunkIndex: chunks.length,
        totalChunks: chunks.length,
        progressPercent: 100,
        statusMessage: 'Export completed successfully!',
        logs: ['ZIP file generated and auto-downloaded successfully!'],
      });
    } catch (err) {
      setExportState((prev) => ({
        ...prev,
        stage: 'error',
        errorMessage: (err as Error).message || 'An error occurred while exporting.',
        logs: [...prev.logs, `Error: ${(err as Error).message}`],
      }));
    }
  };

  if (exportState.stage === 'processing' || exportState.stage === 'zipping' || exportState.stage === 'error') {
    return <ProcessingProgress state={exportState} filename={fileDetails.name} />;
  }

  if (exportState.stage === 'completed') {
    return (
      <CompletionView baseFilename={fileDetails.name} chunks={resultChunks} zipBlob={zipBlob} onReset={onReset} />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white font-bold flex items-center justify-center text-base shrink-0 uppercase shadow-md">
            {fileDetails.extension}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-lg sm:text-xl font-semibold truncate text-slate-100" title={fileDetails.name}>
              {fileDetails.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
              <span>Size: <strong className="text-slate-200 font-medium">{formatFileSize(fileDetails.size)}</strong></span>
              <span>•</span>
              <span>Total Duration: <strong className="text-indigo-300 font-medium">{fileDetails.formattedDuration}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="self-start sm:self-auto text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Change File
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <Waveform
          ref={waveformRef}
          file={fileDetails.file}
          onReady={setDurationSec}
          onTimeUpdate={setCurrentTimeSec}
          onPlayPauseChange={setIsPlaying}
          onRegionChange={setRegion}
        />

        <EditorToolbar
          currentTimeSec={currentTimeSec}
          durationSec={durationSec}
          isPlaying={isPlaying}
          region={region}
          gainDb={gainDb}
          zoomPxPerSec={zoomPxPerSec}
          onTogglePlay={() => waveformRef.current?.togglePlayPause()}
          onRegionStartChange={handleRegionStartChange}
          onRegionEndChange={handleRegionEndChange}
          onRegionRangeChange={handleRegionRangeChange}
          onClearRegion={() => waveformRef.current?.clearRegion()}
          onGainChange={handleGainChange}
          onZoomChange={handleZoomChange}
          onExtractSelection={handleExtractSelection}
          onDeleteSelection={handleDeleteSelection}
          onSplitAtPlayhead={handleSplitAtPlayhead}
        />

        <TimestampImport onImport={handleImportTimestamps} />

        <ClipList
          clips={clips}
          joinIntoOne={joinIntoOne}
          onJoinToggle={setJoinIntoOne}
          onRemoveClip={handleRemoveClip}
          onMoveClip={handleMoveClip}
          onClipGainChange={handleClipGainChange}
          onExport={handleExport}
          isExporting={false}
        />
      </div>
    </div>
  );
};
