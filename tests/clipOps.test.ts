import { describe, expect, it } from 'vitest';
import { clipsFromRanges, makeClip, moveClip, splitClipAt, subtractRange, totalDuration } from '../src/lib/clipOps';

const ranges = (clips: { startSec: number; endSec: number }[]) => clips.map((c) => [c.startSec, c.endSec]);

describe('subtractRange', () => {
  it('deleting from the middle of the whole track leaves two clips', () => {
    expect(ranges(subtractRange([makeClip(0, 100)], 30, 40))).toEqual([[0, 30], [40, 100]]);
  });
  it('deleting from the start or end leaves one clip', () => {
    expect(ranges(subtractRange([makeClip(0, 100)], 0, 10))).toEqual([[10, 100]]);
    expect(ranges(subtractRange([makeClip(0, 100)], 90, 100))).toEqual([[0, 90]]);
  });
  it('deleting everything leaves nothing', () => {
    expect(subtractRange([makeClip(0, 100)], 0, 100)).toEqual([]);
  });
  it('drops slivers shorter than the epsilon', () => {
    expect(ranges(subtractRange([makeClip(0, 100)], 0.02, 40))).toEqual([[40, 100]]);
  });
  it('applies to every clip it overlaps and leaves the rest alone', () => {
    const out = subtractRange([makeClip(0, 20), makeClip(30, 50), makeClip(60, 80)], 15, 65);
    expect(ranges(out)).toEqual([[0, 15], [65, 80]]);
  });
  it('keeps the identity of untouched clips', () => {
    const keep = makeClip(0, 10);
    expect(subtractRange([keep, makeClip(20, 40)], 25, 30)[0]).toBe(keep);
  });
});

describe('splitClipAt', () => {
  it('splits the clip that contains the time', () => {
    expect(ranges(splitClipAt([makeClip(0, 10), makeClip(10, 20)], 15))).toEqual([[0, 10], [10, 15], [15, 20]]);
  });
  it('does nothing on a boundary or outside every clip', () => {
    const clips = [makeClip(0, 10)];
    expect(splitClipAt(clips, 10)).toBe(clips);
    expect(splitClipAt(clips, 0.01)).toBe(clips);
    expect(splitClipAt(clips, 50)).toBe(clips);
  });
  it('both halves keep the gain', () => {
    expect(splitClipAt([makeClip(0, 10, 6)], 5).map((c) => c.gainDb)).toEqual([6, 6]);
  });
});

describe('clipsFromRanges', () => {
  it('clamps to the track and drops empty ranges', () => {
    const out = clipsFromRanges([{ startSec: -5, endSec: 10 }, { startSec: 95, endSec: 200 }, { startSec: 150, endSec: 160 }], 100);
    expect(ranges(out)).toEqual([[0, 10], [95, 100]]);
  });
});

describe('moveClip / totalDuration', () => {
  it('moves up and down, and is a no-op at the edges', () => {
    const [a, b, c] = [makeClip(0, 1), makeClip(1, 2), makeClip(2, 3)];
    expect(moveClip([a, b, c], b.id, 'up')).toEqual([b, a, c]);
    expect(moveClip([a, b, c], b.id, 'down')).toEqual([a, c, b]);
    const list = [a, b, c];
    expect(moveClip(list, a.id, 'up')).toBe(list);
    expect(moveClip(list, c.id, 'down')).toBe(list);
  });
  it('sums durations', () => {
    expect(totalDuration([makeClip(0, 1.5), makeClip(10, 12)])).toBe(3.5);
  });
});
