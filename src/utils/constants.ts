// Everything runs in tab memory: the file is copied into FFmpeg's virtual
// filesystem (a second copy) and, in Editor/Finder, decoded for the waveform
// (a third, much larger one). These caps keep that inside what browsers allow.
export const WARN_FILE_SIZE_BYTES = 512 * 1024 * 1024; // show a warning, still allowed
export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024; // hard cap, rejected

export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'oga', 'opus',
  'wma', 'aiff', 'aif', 'amr', 'webm', 'mka', 'caf', '3gp', 'mp4',
  'mpeg', 'mpg', 'mpga',
];

export const MIN_CHUNK_MINUTES = 1;
export const MAX_CHUNK_MINUTES = 180;
export const DEFAULT_CHUNK_MINUTES = 18;
export const CHUNK_PRESETS_MINUTES = [10, 15, 18, 20, 30];

export const MIN_GAIN_DB = -20;
export const MAX_GAIN_DB = 20;
export const DEFAULT_GAIN_DB = 0;

// Seek step sizes in seconds: coarse (Shift+arrow), default (plain arrow), fine/"frame" (Alt+arrow)
export const COARSE_STEP_SEC = 1;
export const DEFAULT_STEP_SEC = 0.1;
export const FINE_STEP_SEC = 0.01;

/** Waveform decoding holds the whole track as 32-bit float PCM. Warn above this estimate. */
export const WARN_DECODE_BYTES = 1024 * 1024 * 1024;
