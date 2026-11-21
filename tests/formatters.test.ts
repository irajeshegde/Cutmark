import { describe, expect, it } from 'vitest';
import { estimateDecodeBytes, formatFFmpegTime, formatFileSize, formatHumanDuration, formatMinutesSeconds, formatPreciseTime } from '../src/utils/formatters';
import { calculateChunks } from '../src/utils/audioMetadata';

describe('formatters', () => {
  it('formatHumanDuration', () => {
    expect(formatHumanDuration(0)).toBe('0s');
    expect(formatHumanDuration(5)).toBe('5s');
    expect(formatHumanDuration(65)).toBe('1m 05s');
    expect(formatHumanDuration(3725)).toBe('1h 2m 05s');
  });
  it('formatPreciseTime is mm:ss.mmm', () => {
    expect(formatPreciseTime(0)).toBe('00:00.000');
    expect(formatPreciseTime(196.245)).toBe('03:16.245');
    expect(formatPreciseTime(-3)).toBe('00:00.000');
  });
  it('formatFFmpegTime is hh:mm:ss.mmm', () => {
    expect(formatFFmpegTime(3725.5)).toBe('01:02:05.500');
  });
  it('formatMinutesSeconds', () => {
    expect(formatMinutesSeconds(125)).toBe('02:05');
  });
  it('formatFileSize', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatFileSize(1024 ** 3)).toBe('1 GB');
  });
  it('estimateDecodeBytes: stereo 44.1k float is 352800 bytes per second', () => {
    expect(estimateDecodeBytes(3600)).toBe(3600 * 44100 * 2 * 4);
  });
});

describe('calculateChunks', () => {
  it('splits evenly with a short remainder', () => {
    const c = calculateChunks(40 * 60, 18);
    expect(c.totalChunks).toBe(3);
    expect(c.chunksSummary.map((x) => x.durationSeconds)).toEqual([1080, 1080, 240]);
  });
  it('a track shorter than one part is a single chunk', () => {
    expect(calculateChunks(300, 18).totalChunks).toBe(1);
  });
  it('an exact multiple has no empty trailing chunk', () => {
    expect(calculateChunks(36 * 60, 18).totalChunks).toBe(2);
  });
  it('zero duration', () => {
    expect(calculateChunks(0, 18).totalChunks).toBe(0);
  });
});
