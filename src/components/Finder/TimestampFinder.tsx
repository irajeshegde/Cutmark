import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, Plus } from 'lucide-react';
import { Waveform } from '../Editor/Waveform';
import { Transport } from '../Editor/Transport';
import { SelectionControls } from '../Editor/SelectionControls';
import { MarkList } from './MarkList';
import { FileHeader } from '../FileHeader';
import { AudioFileDetails, TimestampMark } from '../../types';
import { newId } from '../../lib/clipOps';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useSeekShortcuts } from '../../hooks/useSeekShortcuts';
import { useWaveformSession } from '../../hooks/useWaveformSession';

interface TimestampFinderProps {
  fileDetails: AudioFileDetails;
  onReset: () => void;
  onSendToEditor: (marks: TimestampMark[]) => void;
}

export const TimestampFinder: React.FC<TimestampFinderProps> = ({ fileDetails, onReset, onSendToEditor }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen, supported: fullscreenSupported } = useFullscreen(rootRef);
  const session = useWaveformSession();
  const { waveformRef, region, durationSec, currentTimeSec } = session;
  const [marks, setMarks] = useState<TimestampMark[]>([]);

  useSeekShortcuts(session.togglePlay, session.step);

  const addMark = () => {
    if (!region) return;
    setMarks((prev) => [...prev, { id: newId(), startSec: region.start, endSec: region.end }]);
    session.clearRegion();
  };

  const hint = region
    ? 'Happy with both ends? Add the range.'
    : 'Play, pause right on the beat, then pin the playhead as Start. Do the same for End.';

  return (
    <div ref={rootRef} className={isFullscreen ? 'h-screen w-screen overflow-y-auto bg-paper' : ''}>
      <div className={`space-y-5 ${isFullscreen ? 'mx-auto max-w-3xl p-4' : ''}`}>
        <div className="panel">
          <FileHeader fileDetails={fileDetails} onReset={onReset} showsWaveform />
          <div className="panel-body space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-ink-2" role="status">{hint}</p>
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
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={addMark} disabled={!region}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add range
              </button>
              {region && (
                <button type="button" className="btn btn-quiet" onClick={session.clearRegion}>Clear selection</button>
              )}
            </div>
          </div>
        </div>

        <MarkList
          marks={marks}
          onRemoveMark={(id) => setMarks((prev) => prev.filter((m) => m.id !== id))}
          onPreviewMark={(m) => session.previewRange(m.id, m.startSec, m.endSec)}
          previewingMarkId={session.previewId}
          onSendToEditor={onSendToEditor}
        />
      </div>
    </div>
  );
};
