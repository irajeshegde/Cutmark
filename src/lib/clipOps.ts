import { EditorClip } from '../types';

export const CLIP_EPSILON_SEC = 0.05;

let counter = 0;
/** crypto.randomUUID needs a secure context; fall back so plain-http dev hosts still work. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  counter += 1;
  return `clip-${Date.now().toString(36)}-${counter}`;
}

export function makeClip(startSec: number, endSec: number, gainDb = 0): EditorClip {
  return { id: newId(), startSec, endSec, gainDb, label: '' };
}

/**
 * Cut [start, end) out of every clip. A clip that fully contains the range is
 * split in two; clips fully inside it vanish; pieces shorter than epsilon are dropped.
 */
export function subtractRange(clips: EditorClip[], start: number, end: number, eps = CLIP_EPSILON_SEC): EditorClip[] {
  const out: EditorClip[] = [];
  for (const clip of clips) {
    if (end <= clip.startSec || start >= clip.endSec) {
      out.push(clip);
      continue;
    }
    if (start - clip.startSec > eps) out.push({ ...clip, id: newId(), endSec: start });
    if (clip.endSec - end > eps) out.push({ ...clip, id: newId(), startSec: end });
  }
  return out;
}

/** Split the clip containing `time` into two. Returns the same array when nothing can be split. */
export function splitClipAt(clips: EditorClip[], time: number, eps = CLIP_EPSILON_SEC): EditorClip[] {
  const idx = clips.findIndex((c) => time > c.startSec + eps && time < c.endSec - eps);
  if (idx === -1) return clips;
  const target = clips[idx];
  const copy = [...clips];
  copy.splice(idx, 1, { ...target, id: newId(), endSec: time }, { ...target, id: newId(), startSec: time });
  return copy;
}

/** Clamp imported ranges to the track and drop empty ones. */
export function clipsFromRanges(ranges: { startSec: number; endSec: number }[], durationSec: number): EditorClip[] {
  return ranges
    .map((r) => makeClip(Math.max(0, r.startSec), durationSec > 0 ? Math.min(r.endSec, durationSec) : r.endSec))
    .filter((c) => c.endSec - c.startSec > 0);
}

export function moveClip(clips: EditorClip[], id: string, direction: 'up' | 'down'): EditorClip[] {
  const idx = clips.findIndex((c) => c.id === id);
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (idx === -1 || target < 0 || target >= clips.length) return clips;
  const copy = [...clips];
  [copy[idx], copy[target]] = [copy[target], copy[idx]];
  return copy;
}

export function totalDuration(clips: EditorClip[]): number {
  return clips.reduce((sum, c) => sum + Math.max(0, c.endSec - c.startSec), 0);
}
