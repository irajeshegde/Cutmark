export interface AudioFileDetails {
  file: File;
  name: string;
  size: number;
  extension: string;
  durationSeconds: number;
  formattedDuration: string;
  sampleRate?: number;
  numberOfChannels?: number;
}

/** A rendered piece of audio, before it has been given its final filename. */
export interface RenderedClip {
  index: number;
  extension: string;
  mimeType: string;
  startSec: number;
  durationSec: number;
  formattedRange: string;
  formattedDuration: string;
  blob: Blob;
  size: number;
}

/** A rendered piece with its final, download-ready filename. */
export interface OutputFile extends RenderedClip {
  filename: string;
}

/** Everything the result view needs: the files, and a ZIP when there is more than one. */
export interface OutputBundle {
  files: OutputFile[];
  /** Present only when files.length > 1. */
  zip: { name: string; blob: Blob } | null;
  spoilt: boolean;
}

export type AppMode = 'split' | 'editor' | 'finder';

export interface EditorClip {
  id: string;
  startSec: number;
  endSec: number;
  gainDb: number;
  label: string;
}

export interface TimestampMark {
  id: string;
  startSec: number;
  endSec: number;
}

export interface SpoilSettings {
  enabled: boolean;
  noiseAmount: number; // 0-100, mixes in hiss to mask fidelity
  muffleAmount: number; // 0-100, low-pass cutoff strength
  wobbleAmount: number; // 0-100, pitch/speed vibrato depth
}

export type JobStatus = 'idle' | 'running' | 'done' | 'error' | 'cancelled';

export interface JobState {
  status: JobStatus;
  percent: number;
  message: string;
  logs: string[];
  error?: string;
  bundle: OutputBundle | null;
}
