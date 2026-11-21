import React, { useRef, useState } from 'react';
import { Check, Download, Maximize2, Minimize2, Scissors, SplitSquareHorizontal, Trash2, X } from 'lucide-react';
import { Waveform } from './Waveform';
import { Transport } from './Transport';
import { SelectionControls } from './SelectionControls';
import { ClipList } from './ClipList';
import { TimestampImport } from './TimestampImport';
import { SpoilPanel } from '../SpoilPanel';
import { FileHeader } from '../FileHeader';
import { ProcessingView } from '../ProcessingView';
import { ResultView } from '../ResultView';
import { AudioFileDetails, EditorClip, SpoilSettings } from '../../types';
import { DEFAULT_GAIN_DB, MAX_GAIN_DB, MIN_GAIN_DB } from '../../utils/constants';
import { parseTimestampRanges } from '../../utils/parseTimestamps';
import { exportClips } from '../../services/audioEditorService';
import { packageOutputs } from '../../lib/outputs';
import { isSpoilActive } from '../../lib/spoil';
import { clipsFromRanges, makeClip, moveClip, splitClipAt, subtractRange, totalDuration } from '../../lib/clipOps';
import { relabel, useClipHistory } from '../../hooks/useClipHistory';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useRenderJob } from '../../hooks/useRenderJob';
import { useSeekShortcuts } from '../../hooks/useSeekShortcuts';
import { useSpoilPreview } from '../../hooks/useSpoilPreview';
import { useWaveformSession } from '../../hooks/useWaveformSession';

/** Editor state lives in the workspace so it survives switching tabs. */
export interface EditorSession {
  history: ReturnType<typeof useClipHistory>;
  spoil: SpoilSettings;
  setSpoil: (s: SpoilSettings) => void;
  joinIntoOne: boolean;
  setJoinIntoOne: (join: boolean) => void;
}

interface AudioEditorProps {
  fileDetails: AudioFileDetails;
  onReset: () => void;
  session: EditorSession;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({ fileDetails, onReset, session: editor }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen, supported: fullscreenSupported } = useFullscreen(rootRef);

  const { spoil, setSpoil, joinIntoOne, setJoinIntoOne, history } = editor;
  const [gainDb, setGainDb] = useState(DEFAULT_GAIN_DB);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  const { clips } = history;
  const { job, run, cancel, reset: resetJob } = useRenderJob();

  const preview = useSpoilPreview(spoil, gainDb);
  const session = useWaveformSession(preview.attach);
  const { waveformRef, durationSec, currentTimeSec, region } = session;

  const editingClip = clips.find((c) => c.id === editingClipId) ?? null;
  const spoilActive = isSpoilActive(spoil);

  useSeekShortcuts(session.togglePlay, session.step);

  // ---- clip actions ----

  const keepSelection = () => {
    if (!region) return;
    history.commit((prev) => relabel([...prev, makeClip(region.start, region.end, gainDb)]));
    session.clearRegion();
  };

  const deleteSelection = () => {
    if (!region || durationSec <= 0) return;
    history.commit((prev) => {
      const base = prev.length > 0 ? prev : [makeClip(0, durationSec)];
      const next = subtractRange(base, region.start, region.end);
      return next.length === 0 ? prev : relabel(next);
    });
    setJoinIntoOne(true);
    session.clearRegion();
  };

  const splitAtPlayhead = () => {
    if (durationSec <= 0) return;
    history.commit((prev) => {
      const base = prev.length > 0 ? prev : [makeClip(0, durationSec)];
      const next = splitClipAt(base, currentTimeSec);
      return next === base ? prev : relabel(next);
    });
  };

  const importTimestamps = (text: string) => {
    const imported = clipsFromRanges(parseTimestampRanges(text), durationSec);
    if (imported.length === 0) return;
    history.commit((prev) => relabel([...prev, ...imported]));
  };

  const removeClip = (id: string) => history.commit((prev) => relabel(prev.filter((c) => c.id !== id)));
  const moveClipBy = (id: string, direction: 'up' | 'down') =>
    history.commit((prev) => {
      const next = moveClip(prev, id, direction);
      return next === prev ? prev : relabel(next);
    });
  const setClipGain = (id: string, db: number) => history.patch((prev) => prev.map((c) => (c.id === id ? { ...c, gainDb: db } : c)));

  const previewClip = (clip: EditorClip) => {
    setGainDb(clip.gainDb);
    session.previewRange(clip.id, clip.startSec, clip.endSec);
  };

  const editClip = (clip: EditorClip) => {
    session.stopPreview();
    setEditingClipId(clip.id);
    setGainDb(clip.gainDb);
    waveformRef.current?.setRegionTimes(clip.startSec, clip.endSec);
    if (session.zoomPxPerSec < 100) session.setZoom(140);
  };

  const saveEdit = () => {
    if (!editingClipId || !region) return;
    history.commit((prev) => prev.map((c) => (c.id === editingClipId ? { ...c, startSec: region.start, endSec: region.end, gainDb } : c)));
    setEditingClipId(null);
    session.clearRegion();
  };

  const cancelEdit = () => {
    setEditingClipId(null);
    session.clearRegion();
  };

  // ---- export ----

  const handleExport = () => {
    if (clips.length === 0) return;
    waveformRef.current?.pause();
    const join = joinIntoOne && clips.length > 1;
    void run(async ({ signal, report }) => {
      const rendered = await exportClips(fileDetails, clips, join, spoil, (percent, _i, _n, message) => report(percent, message), signal);
      report(94, rendered.length > 1 ? 'Packing the ZIP…' : 'Naming the file…');
      return packageOutputs(
        rendered,
        { sourceName: fileDetails.name, spoilt: spoilActive },
        (zipPct) => report(94 + zipPct * 0.05, 'Packing the ZIP…')
      );
    });
  };

  const outputCount = joinIntoOne && clips.length > 1 ? 1 : clips.length;
  const exportLabel = outputCount === 1 ? 'Export 1 file' : `Export ${outputCount} files (ZIP)`;
  const showJob = job.status !== 'idle';

  // What to do next, in plain words.
  const hint = editingClip
    ? 'Adjust the selection, then save the change.'
    : region
      ? 'Keep selection saves it as a clip. Delete selection removes it from the track.'
      : clips.length === 0
        ? 'Drag across the waveform to select a part, or paste timestamps below.'
        : 'Add more clips, or export when you are done.';

  return (
    <div
      ref={rootRef}
      className={isFullscreen ? 'h-screen w-screen overflow-y-auto bg-paper' : 'space-y-5'}
    >
      {showJob && (
        <div className={isFullscreen ? 'mx-auto max-w-3xl p-4' : ''}>
          {job.status === 'done' && job.bundle ? (
            <ResultView bundle={job.bundle} onBack={resetJob} onStartOver={onReset} />
          ) : (
            <ProcessingView job={job} filename={fileDetails.name} onCancel={cancel} onBack={resetJob} />
          )}
        </div>
      )}

      {/* The editor stays mounted (hidden) during export so clips and the waveform survive. */}
      <div hidden={showJob} className={isFullscreen ? 'mx-auto max-w-3xl space-y-5 p-4' : 'space-y-5'}>
        <div className="panel">
          <FileHeader fileDetails={fileDetails} onReset={onReset} showsWaveform />

          <div className="panel-body space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="min-h-5 text-sm text-ink-2" role="status">{hint}</p>
              {fullscreenSupported && (
                <button type="button" className="btn btn-sm hidden sm:inline-flex" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </button>
              )}
            </div>

            {session.loadError && (
              <p role="alert" className="border border-accent bg-accent-wash px-3 py-2 text-sm text-ink rounded-cut">
                Could not draw the waveform: {session.loadError}
              </p>
            )}

            <Waveform ref={waveformRef} file={fileDetails.file} {...session.waveformProps} />

            <Transport
              currentTimeSec={currentTimeSec}
              durationSec={durationSec}
              isPlaying={session.isPlaying}
              zoomPxPerSec={session.zoomPxPerSec}
              minZoomPxPerSec={session.minZoomPxPerSec}
              onTogglePlay={session.togglePlay}
              onStep={session.step}
              onZoomChange={session.setZoom}
            />

            <div className="cutline pt-4">
              <SelectionControls
                region={region}
                disabled={durationSec <= 0}
                onCommit={session.commitTime}
                onStampStart={() => session.setStart(currentTimeSec)}
                onStampEnd={() => session.setEnd(currentTimeSec)}
              >
                <div>
                  <label htmlFor="selection-gain" className="eyebrow mb-1.5 flex justify-between">
                    <span>Gain</span>
                    <span className="font-mono normal-case tracking-normal text-ink-2">{gainDb > 0 ? '+' : ''}{gainDb} dB</span>
                  </label>
                  <input
                    id="selection-gain"
                    type="range"
                    min={MIN_GAIN_DB}
                    max={MAX_GAIN_DB}
                    value={gainDb}
                    onChange={(e) => setGainDb(Number(e.target.value))}
                    className="mt-2.5 w-full"
                  />
                </div>
              </SelectionControls>
            </div>

            <div className="flex flex-wrap gap-2">
              {editingClip ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={!region}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Save change
                  </button>
                  <button type="button" className="btn" onClick={cancelEdit}>
                    <X className="h-4 w-4" aria-hidden="true" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={keepSelection} disabled={!region}>
                    <Scissors className="h-4 w-4" aria-hidden="true" /> Keep selection
                  </button>
                  <button type="button" className="btn" onClick={deleteSelection} disabled={!region}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete selection
                  </button>
                  <button type="button" className="btn" onClick={splitAtPlayhead} disabled={durationSec <= 0}>
                    <SplitSquareHorizontal className="h-4 w-4" aria-hidden="true" /> Split here
                  </button>
                  {region && (
                    <button type="button" className="btn btn-quiet sm:ml-auto" onClick={session.clearRegion}>Clear selection</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <ClipList
          clips={clips}
          joinIntoOne={joinIntoOne}
          onJoinToggle={setJoinIntoOne}
          onRemoveClip={removeClip}
          onMoveClip={moveClipBy}
          onClipGainChange={setClipGain}
          onPreviewClip={previewClip}
          onEditClip={editClip}
          previewingClipId={session.previewId}
          editingClipId={editingClipId}
          onUndo={history.undo}
          canUndo={history.canUndo}
        />

        <details className="panel group" open={spoil.enabled || undefined}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink">
            <span>Spoil the audio <span className="font-normal text-ink-3">· optional, for sharing a preview</span></span>
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
              playHint="Press play on the waveform above."
            />
          </div>
        </details>

        <details className="panel">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink">
            Paste timestamps <span className="font-normal text-ink-3">· add many clips at once</span>
          </summary>
          <div className="border-t border-line p-4">
            <TimestampImport onImport={importTimestamps} disabled={editingClipId !== null} />
          </div>
        </details>

        {/* export bar: sticky so it is always one thumb away on a phone */}
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 backdrop-blur sm:mx-0 sm:border sm:rounded-cut sm:bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-ink-3" role="status">
              {clips.length === 0
                ? 'No clips to export yet'
                : `${clips.length} clip${clips.length === 1 ? '' : 's'} · ${Math.round(totalDuration(clips))} s total${spoilActive ? ' · spoilt' : ''}`}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg w-full sm:w-auto"
              onClick={handleExport}
              disabled={clips.length === 0 || editingClipId !== null}
            >
              <Download className="h-4 w-4" aria-hidden="true" /> {exportLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
