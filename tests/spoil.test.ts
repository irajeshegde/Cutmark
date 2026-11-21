import { describe, expect, it } from 'vitest';
import {
  NO_SPOIL,
  SPOIL_PRESETS,
  applyPreset,
  buildFilterArgs,
  describeSeverity,
  formatHz,
  isSpoilActive,
  matchingPreset,
  muffleCutoffHz,
  noiseGain,
  wobbleDepth,
} from '../src/lib/spoil';

const on = (noiseAmount: number, muffleAmount: number, wobbleAmount: number) => ({ enabled: true, noiseAmount, muffleAmount, wobbleAmount });

describe('parameter mappings', () => {
  it('muffle: 0% leaves the highs, 100% cuts hard', () => {
    expect(muffleCutoffHz(0)).toBe(12000);
    expect(muffleCutoffHz(100)).toBe(1500);
    expect(muffleCutoffHz(50)).toBe(6750);
  });
  it('clamps out-of-range input', () => {
    expect(muffleCutoffHz(-20)).toBe(12000);
    expect(muffleCutoffHz(500)).toBe(1500);
    expect(noiseGain(500)).toBe(0.5);
    expect(wobbleDepth(-5)).toBe(0);
  });
  it('wobble and noise scale linearly', () => {
    expect(wobbleDepth(100)).toBeCloseTo(0.9);
    expect(noiseGain(50)).toBeCloseTo(0.25);
  });
});

describe('isSpoilActive', () => {
  it('needs the switch on AND something above zero', () => {
    expect(isSpoilActive(NO_SPOIL)).toBe(false);
    expect(isSpoilActive({ ...NO_SPOIL, enabled: true })).toBe(false);
    expect(isSpoilActive({ ...NO_SPOIL, muffleAmount: 40 })).toBe(false);
    expect(isSpoilActive(on(0, 40, 0))).toBe(true);
  });
});

describe('describeSeverity', () => {
  it('untouched when inactive', () => {
    const s = describeSeverity(NO_SPOIL);
    expect(s.level).toBe('none');
    expect(s.score).toBe(0);
  });
  it('ignores sliders while the switch is off', () => {
    expect(describeSeverity({ enabled: false, noiseAmount: 100, muffleAmount: 100, wobbleAmount: 100 }).level).toBe('none');
  });
  it('rises monotonically with each slider', () => {
    const scores = [0, 25, 50, 75, 100].map((v) => describeSeverity(on(v, 0, 0)).score);
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    const m = [10, 50, 90].map((v) => describeSeverity(on(0, v, 0)).score);
    expect(m[0]).toBeLessThan(m[2]);
  });
  it('presets land in increasing severity', () => {
    const scores = SPOIL_PRESETS.map((p) => describeSeverity(applyPreset(p.id)).score);
    expect(scores[0]).toBeLessThan(scores[1]);
    expect(scores[1]).toBeLessThan(scores[2]);
  });
  it('caps at 100 and reaches the top label', () => {
    const s = describeSeverity(on(100, 100, 100));
    expect(s.score).toBe(100);
    expect(s.level).toBe('heavy');
  });
  it('detail names the cutoff in Hz', () => {
    expect(describeSeverity(on(0, 100, 0)).detail).toContain('1.5 kHz');
  });
});

describe('presets', () => {
  it('applying a preset turns spoil on and is recognised again', () => {
    for (const p of SPOIL_PRESETS) {
      const s = applyPreset(p.id);
      expect(s.enabled).toBe(true);
      expect(matchingPreset(s)).toBe(p.id);
    }
  });
  it('a hand-tuned value matches no preset', () => {
    expect(matchingPreset(on(21, 25, 15))).toBeNull();
    expect(matchingPreset({ ...applyPreset('subtle'), enabled: false })).toBeNull();
  });
});

describe('formatHz', () => {
  it('switches to kHz at 1000', () => {
    expect(formatHz(800)).toBe('800 Hz');
    expect(formatHz(6000)).toBe('6 kHz');
    expect(formatHz(1500)).toBe('1.5 kHz');
  });
});

describe('buildFilterArgs (FFmpeg)', () => {
  it('is empty with no gain and no spoil', () => {
    expect(buildFilterArgs(0, '00:00:10.000')).toEqual([]);
    expect(buildFilterArgs(0, '00:00:10.000', NO_SPOIL)).toEqual([]);
  });
  it('gain only', () => {
    expect(buildFilterArgs(6, '00:00:10.000')).toEqual(['-af', 'volume=6dB']);
  });
  it('ignores sliders when disabled', () => {
    expect(buildFilterArgs(0, 'x', { enabled: false, noiseAmount: 50, muffleAmount: 50, wobbleAmount: 50 })).toEqual([]);
  });
  it('muffle + wobble use a plain filter chain, in a stable order', () => {
    expect(buildFilterArgs(-3, 'x', on(0, 100, 100))).toEqual(['-af', 'volume=-3dB,lowpass=f=1500,vibrato=f=6:d=0.90']);
  });
  it('noise adds a lavfi input and a filter_complex mix', () => {
    const args = buildFilterArgs(0, '00:00:05.000', on(100, 0, 0));
    expect(args).toContain('-filter_complex');
    expect(args).toContain('anoisesrc=color=pink:amplitude=1');
    expect(args[args.indexOf('-t') + 1]).toBe('00:00:05.000');
    expect(args[args.indexOf('-filter_complex') + 1]).toBe('[0:a]anull[m];[1:a]volume=0.500[n];[m][n]amix=inputs=2:duration=first:normalize=0[aout]');
    expect(args.slice(-2)).toEqual(['-map', '[aout]']);
  });
  it('noise combines with the other filters on the main branch', () => {
    const args = buildFilterArgs(2, 'x', on(40, 50, 0));
    expect(args[args.indexOf('-filter_complex') + 1]).toContain('[0:a]volume=2dB,lowpass=f=6750[m]');
  });
});
