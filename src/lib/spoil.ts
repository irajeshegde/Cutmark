import { SpoilSettings } from '../types';

/**
 * "Protect Original" degradation model.
 *
 * One set of parameter mappings feeds BOTH the FFmpeg export filter and the
 * Web Audio live preview, so what you hear while auditioning is built from the
 * same numbers that get baked into the file. The preview is an approximation
 * of FFmpeg's filters (different filter implementations), which is why the
 * result view plays back the real exported file too.
 */

export const NO_SPOIL: SpoilSettings = { enabled: false, noiseAmount: 0, muffleAmount: 0, wobbleAmount: 0 };

export type SpoilPresetId = 'subtle' | 'medium' | 'heavy';

export const SPOIL_PRESETS: { id: SpoilPresetId; label: string; hint: string; values: Omit<SpoilSettings, 'enabled'> }[] = [
  { id: 'subtle', label: 'Subtle', hint: 'Fine on a phone speaker, obvious on good headphones', values: { noiseAmount: 20, muffleAmount: 25, wobbleAmount: 15 } },
  { id: 'medium', label: 'Medium', hint: 'Clearly a preview copy', values: { noiseAmount: 40, muffleAmount: 55, wobbleAmount: 40 } },
  { id: 'heavy', label: 'Heavy', hint: 'Recognisable, not enjoyable', values: { noiseAmount: 65, muffleAmount: 80, wobbleAmount: 70 } },
];

export function applyPreset(id: SpoilPresetId): SpoilSettings {
  const preset = SPOIL_PRESETS.find((p) => p.id === id)!;
  return { enabled: true, ...preset.values };
}

export function matchingPreset(s: SpoilSettings): SpoilPresetId | null {
  const hit = SPOIL_PRESETS.find(
    (p) =>
      p.values.noiseAmount === s.noiseAmount &&
      p.values.muffleAmount === s.muffleAmount &&
      p.values.wobbleAmount === s.wobbleAmount
  );
  return s.enabled && hit ? hit.id : null;
}

/** True when export will actually degrade the audio (enabled AND at least one slider above 0). */
export function isSpoilActive(s: SpoilSettings): boolean {
  return s.enabled && (s.noiseAmount > 0 || s.muffleAmount > 0 || s.wobbleAmount > 0);
}

// ---- parameter mappings --------------------------------------------------

export const MUFFLE_MAX_CUTOFF_HZ = 12000;
export const MUFFLE_MIN_CUTOFF_HZ = 1500;
export const WOBBLE_RATE_HZ = 6;

function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/** Low-pass cutoff for a 0-100 muffle amount. 0 means "no filter". */
export function muffleCutoffHz(amount: number): number {
  return Math.round(MUFFLE_MAX_CUTOFF_HZ - (clamp(amount) / 100) * (MUFFLE_MAX_CUTOFF_HZ - MUFFLE_MIN_CUTOFF_HZ));
}

/** FFmpeg `vibrato` depth (0-1) for a 0-100 wobble amount. */
export function wobbleDepth(amount: number): number {
  return (clamp(amount) / 100) * 0.9;
}

/** Linear amplitude of the pink-noise bed for a 0-100 noise amount. */
export function noiseGain(amount: number): number {
  return (clamp(amount) / 100) * 0.5;
}

// ---- severity ---------------------------------------------------------------

export type SeverityLevel = 'none' | 'barely' | 'noticeable' | 'clear' | 'heavy';

export interface Severity {
  /** 0-100 rough "how spoilt" score. */
  score: number;
  level: SeverityLevel;
  label: string;
  detail: string;
}

const SEVERITY_WEIGHTS = { muffle: 0.5, wobble: 0.35, noise: 0.4 };

export function formatHz(hz: number): string {
  return hz >= 1000 ? `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz` : `${hz} Hz`;
}

/**
 * Rough guide to how damaged the audio will sound. It is a heuristic (muffling
 * is the most audible, wobble next, hiss least on its own): listen with the
 * live Original/Spoilt switch for the real judgement.
 */
export function describeSeverity(s: SpoilSettings): Severity {
  if (!isSpoilActive(s)) {
    return { score: 0, level: 'none', label: 'Untouched', detail: 'Export will be a clean copy.' };
  }
  const score = Math.round(
    Math.min(
      100,
      s.muffleAmount * SEVERITY_WEIGHTS.muffle + s.wobbleAmount * SEVERITY_WEIGHTS.wobble + s.noiseAmount * SEVERITY_WEIGHTS.noise
    )
  );
  const level: SeverityLevel = score < 20 ? 'barely' : score < 45 ? 'noticeable' : score < 70 ? 'clear' : 'heavy';
  const label = { barely: 'Barely noticeable', noticeable: 'Noticeable', clear: 'Clearly degraded', heavy: 'Hard to listen to' }[level];

  const parts: string[] = [];
  if (s.muffleAmount > 0) parts.push(`highs cut above ${formatHz(muffleCutoffHz(s.muffleAmount))}`);
  if (s.wobbleAmount > 0) parts.push(`pitch wobble ${s.wobbleAmount}%`);
  if (s.noiseAmount > 0) parts.push(`hiss ${s.noiseAmount}%`);
  return { score, level, label, detail: parts.join(' · ') };
}

// ---- FFmpeg args ----------------------------------------------------------------

/**
 * FFmpeg args for one clip's gain + degradation. Noise needs a second lavfi
 * input mixed in through filter_complex; everything else is a plain -af chain.
 */
export function buildFilterArgs(gainDb: number, durationFormatted: string, spoil?: SpoilSettings): string[] {
  const chain: string[] = [];
  if (gainDb !== 0) chain.push(`volume=${gainDb}dB`);

  const on = !!spoil && isSpoilActive(spoil);
  if (on && spoil.muffleAmount > 0) chain.push(`lowpass=f=${muffleCutoffHz(spoil.muffleAmount)}`);
  if (on && spoil.wobbleAmount > 0) chain.push(`vibrato=f=${WOBBLE_RATE_HZ}:d=${wobbleDepth(spoil.wobbleAmount).toFixed(2)}`);

  if (on && spoil.noiseAmount > 0) {
    const amp = noiseGain(spoil.noiseAmount).toFixed(3);
    const main = chain.length > 0 ? `[0:a]${chain.join(',')}[m]` : '[0:a]anull[m]';
    return [
      '-f', 'lavfi', '-t', durationFormatted, '-i', 'anoisesrc=color=pink:amplitude=1',
      '-filter_complex', `${main};[1:a]volume=${amp}[n];[m][n]amix=inputs=2:duration=first:normalize=0[aout]`,
      '-map', '[aout]',
    ];
  }

  return chain.length > 0 ? ['-af', chain.join(',')] : [];
}
