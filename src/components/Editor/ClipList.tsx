import React from 'react';
import { ArrowDown, ArrowUp, Link2, Pause, Pencil, Play, Trash2, Undo2 } from 'lucide-react';
import { EditorClip } from '../../types';
import { formatHumanDuration, formatPreciseTime } from '../../utils/formatters';
import { MAX_GAIN_DB, MIN_GAIN_DB } from '../../utils/constants';

interface ClipListProps {
  clips: EditorClip[];
  joinIntoOne: boolean;
  onJoinToggle: (join: boolean) => void;
  onRemoveClip: (id: string) => void;
  onMoveClip: (id: string, direction: 'up' | 'down') => void;
  onClipGainChange: (id: string, gainDb: number) => void;
  onPreviewClip: (clip: EditorClip) => void;
  onEditClip: (clip: EditorClip) => void;
  previewingClipId: string | null;
  editingClipId: string | null;
  onUndo: () => void;
  canUndo: boolean;
}

const iconBtn = 'btn btn-quiet btn-icon';

export const ClipList: React.FC<ClipListProps> = ({
  clips,
  joinIntoOne,
  onJoinToggle,
  onRemoveClip,
  onMoveClip,
  onClipGainChange,
  onPreviewClip,
  onEditClip,
  previewingClipId,
  editingClipId,
  onUndo,
  canUndo,
}) => {
  const locked = editingClipId !== null;

  return (
    <section className="panel" aria-labelledby="clips-title">
      <div className="panel-head">
        <h3 id="clips-title" className="text-sm font-semibold text-ink">
          Clips <span className="ml-1 font-mono text-xs font-normal text-ink-3">{clips.length}</span>
        </h3>
        <button type="button" onClick={onUndo} disabled={!canUndo || locked} className="btn btn-sm btn-quiet">
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Undo
        </button>
      </div>

      {clips.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-3">
          Nothing yet. Drag across the waveform to select a part, then press <strong className="font-medium text-ink-2">Keep selection</strong>.
        </p>
      ) : (
        <>
          <ol className="divide-y divide-line">
            {clips.map((clip, index) => {
              const previewing = previewingClipId === clip.id;
              const editing = editingClipId === clip.id;
              return (
                <li key={clip.id} className={`px-4 py-3 ${editing ? 'bg-accent-wash' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs text-ink-3">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm text-ink">
                        {formatPreciseTime(clip.startSec)} – {formatPreciseTime(clip.endSec)}
                        {editing && <span className="ml-2 text-accent-text">editing</span>}
                      </p>
                      <p className="font-mono text-xs text-ink-3">{formatHumanDuration(clip.endSec - clip.startSec)}</p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => onPreviewClip(clip)}
                        disabled={locked && !editing}
                        aria-label={`${previewing ? 'Pause' : 'Play'} clip ${index + 1}`}
                      >
                        {previewing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      <button type="button" className={iconBtn} onClick={() => onEditClip(clip)} disabled={locked} aria-label={`Re-trim clip ${index + 1}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button type="button" className={`${iconBtn} btn-danger`} onClick={() => onRemoveClip(clip.id)} disabled={locked} aria-label={`Remove clip ${index + 1}`}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-9">
                    <label className="flex min-w-[11rem] flex-1 items-center gap-2 text-xs text-ink-3">
                      <span className="w-8">Gain</span>
                      <input
                        type="range"
                        min={MIN_GAIN_DB}
                        max={MAX_GAIN_DB}
                        value={clip.gainDb}
                        disabled={locked}
                        onChange={(e) => onClipGainChange(clip.id, Number(e.target.value))}
                        className="min-w-0 flex-1"
                        aria-label={`Gain for clip ${index + 1}`}
                      />
                      <span className="w-14 text-right font-mono text-ink-2 tabular-nums">
                        {clip.gainDb > 0 ? '+' : ''}{clip.gainDb} dB
                      </span>
                    </label>
                    <span className="ml-auto flex">
                      <button type="button" className={iconBtn} onClick={() => onMoveClip(clip.id, 'up')} disabled={locked || index === 0} aria-label={`Move clip ${index + 1} up`}>
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button type="button" className={iconBtn} onClick={() => onMoveClip(clip.id, 'down')} disabled={locked || index === clips.length - 1} aria-label={`Move clip ${index + 1} down`}>
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <label className="flex cursor-pointer items-start gap-2.5 border-t border-line px-4 py-3 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={joinIntoOne}
              onChange={(e) => onJoinToggle(e.target.checked)}
              disabled={clips.length < 2 || locked}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="flex items-center gap-1.5 font-medium text-ink"><Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Join into one file</span>
              <span className="block text-xs text-ink-3">
                {clips.length < 2 ? 'Needs two or more clips.' : joinIntoOne ? 'You get one file, clips in this order.' : `You get ${clips.length} files in one ZIP.`}
              </span>
            </span>
          </label>
        </>
      )}
    </section>
  );
};
