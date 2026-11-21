import { SpoilSettings } from '../types';
import { WOBBLE_RATE_HZ, isSpoilActive, muffleCutoffHz, noiseGain, wobbleDepth } from '../lib/spoil';

/** Max pitch deviation (fraction) at wobble depth 0.9: tuned by ear against FFmpeg's `vibrato`. */
const MAX_PITCH_DEVIATION = 0.035;
const BASE_DELAY_SEC = 0.01;

/**
 * Live audition chain: <audio> element -> gain -> lowpass -> vibrato(delay+LFO) -> out,
 * with a pink-noise bed mixed in. Lets the user hear gain changes (including
 * boosts above 0 dB, which an <audio> volume cannot do) and flip between the
 * clean and the degraded sound while the track plays.
 *
 * It mirrors the export filters using the same parameter mappings from
 * lib/spoil.ts, but the DSP is Web Audio's, not FFmpeg's: treat it as a close
 * preview, not a bit-exact one.
 */
export class PreviewChain {
  private ctx: AudioContext;
  private gain: GainNode;
  private lowpass: BiquadFilterNode;
  private delay: DelayNode;
  private lfo: OscillatorNode;
  private lfoDepth: GainNode;
  private noise: AudioBufferSourceNode;
  private noiseLevel: GainNode;
  private source: MediaElementAudioSourceNode;
  private disposed = false;

  constructor(media: HTMLMediaElement) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();

    this.source = this.ctx.createMediaElementSource(media);
    this.gain = this.ctx.createGain();
    this.lowpass = this.ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.Q.value = 0.707;
    this.lowpass.frequency.value = this.ctx.sampleRate / 2;

    this.delay = this.ctx.createDelay(0.1);
    this.delay.delayTime.value = BASE_DELAY_SEC;
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = WOBBLE_RATE_HZ;
    this.lfoDepth = this.ctx.createGain();
    this.lfoDepth.gain.value = 0;
    this.lfo.connect(this.lfoDepth).connect(this.delay.delayTime);
    this.lfo.start();

    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = createPinkNoiseBuffer(this.ctx, 4);
    this.noise.loop = true;
    this.noiseLevel = this.ctx.createGain();
    this.noiseLevel.gain.value = 0;
    this.noise.connect(this.noiseLevel).connect(this.ctx.destination);
    this.noise.start();

    this.source.connect(this.gain).connect(this.lowpass).connect(this.delay).connect(this.ctx.destination);
  }

  /** Browsers suspend audio contexts until a user gesture; call when playback starts. */
  resume(): void {
    if (!this.disposed && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setGainDb(db: number): void {
    this.gain.gain.setTargetAtTime(Math.pow(10, db / 20), this.ctx.currentTime, 0.01);
  }

  /** Pass `null` (or inactive settings) for the clean/original sound. */
  setSpoil(settings: SpoilSettings | null): void {
    const t = this.ctx.currentTime;
    const on = !!settings && isSpoilActive(settings);

    const cutoff = on && settings.muffleAmount > 0 ? muffleCutoffHz(settings.muffleAmount) : this.ctx.sampleRate / 2;
    this.lowpass.frequency.setTargetAtTime(Math.min(cutoff, this.ctx.sampleRate / 2), t, 0.02);

    const depth = on ? wobbleDepth(settings.wobbleAmount) : 0;
    // delay swing A gives a pitch deviation of 2π·f·A
    const swing = ((depth / 0.9) * MAX_PITCH_DEVIATION) / (2 * Math.PI * WOBBLE_RATE_HZ);
    this.lfoDepth.gain.setTargetAtTime(swing, t, 0.02);

    this.noiseLevel.gain.setTargetAtTime(on ? noiseGain(settings.noiseAmount) * NOISE_PREVIEW_SCALE : 0, t, 0.02);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.lfo.stop();
      this.noise.stop();
    } catch {
      /* already stopped */
    }
    this.source.disconnect();
    void this.ctx.close().catch(() => {});
  }
}

/** FFmpeg's pink noise source is much quieter than a full-scale buffer; scale to match what the export sounds like. */
const NOISE_PREVIEW_SCALE = 0.35;

/** Pink noise via Paul Kellet's filter, normalised to roughly ±1. */
export function createPinkNoiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}
