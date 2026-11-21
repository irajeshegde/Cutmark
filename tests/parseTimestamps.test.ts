import { describe, expect, it } from 'vitest';
import { parseTimeOrRangeInput, parseTimestampRanges } from '../src/utils/parseTimestamps';
import { formatPreciseTime } from '../src/utils/formatters';

describe('parseTimestampRanges', () => {
  it('reads mm:ss and mm.ss, mixed', () => {
    expect(parseTimestampRanges('3.16-5:14\n8.02 - 8.55')).toEqual([
      { startSec: 196, endSec: 314 },
      { startSec: 482, endSec: 535 },
    ]);
  });
  it('reads millisecond precision', () => {
    expect(parseTimestampRanges('03:16.245-05:14.5')).toEqual([{ startSec: 196.245, endSec: 314.5 }]);
  });
  it('ignores chat noise around the range', () => {
    expect(parseTimestampRanges('[12/03, 9:41] Asha: 8.02 - 8.55 please')).toEqual([{ startSec: 482, endSec: 535 }]);
  });
  it('skips lines without a range and ranges that end before they start', () => {
    expect(parseTimestampRanges('hello\n5:00-4:00\n1:00-1:00\n2:00-3:00')).toEqual([{ startSec: 120, endSec: 180 }]);
  });
  it('handles Windows line endings', () => {
    expect(parseTimestampRanges('1:00-2:00\r\n3:00-4:00')).toHaveLength(2);
  });
  it('round-trips what the finder copies', () => {
    const text = `${formatPreciseTime(196.245)}-${formatPreciseTime(314.5)}`;
    expect(parseTimestampRanges(text)).toEqual([{ startSec: 196.245, endSec: 314.5 }]);
  });
});

describe('parseTimeOrRangeInput', () => {
  it('single mm:ss', () => {
    expect(parseTimeOrRangeInput('1:30')).toEqual({ kind: 'single', sec: 90 });
  });
  it('bare seconds', () => {
    expect(parseTimeOrRangeInput('42.5')).toEqual({ kind: 'single', sec: 42.5 });
  });
  it('a pasted range sets both ends', () => {
    expect(parseTimeOrRangeInput('12.08-13.18')).toEqual({ kind: 'range', startSec: 728, endSec: 798 });
  });
  it('rejects empty and garbage', () => {
    expect(parseTimeOrRangeInput('')).toBeNull();
    expect(parseTimeOrRangeInput('abc')).toBeNull();
  });
});
