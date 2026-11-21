/**
 * Format time in seconds to human readable duration e.g. "1h 42m 15s" or "18m 00s"
 */
export function formatHumanDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0s';
  
  const totalSeconds = Math.round(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
  parts.push(`${secs.toString().padStart(hrs > 0 || mins > 0 ? 2 : 1, '0')}s`);

  return parts.join(' ');
}

/**
 * Format time in seconds to HH:MM:SS or MM:SS for FFmpeg cut timestamps
 */
export function formatFFmpegTime(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  const hh = hrs.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  const mmm = ms.toString().padStart(3, '0');

  return `${hh}:${mm}:${ss}.${mmm}`;
}

/**
 * Format time in seconds to short timestamps e.g. "00:00 - 18:00"
 */
export function formatTimestampRange(startSec: number, durationSec: number): string {
  const endSec = startSec + durationSec;
  return `${formatShortTime(startSec)} - ${formatShortTime(endSec)}`;
}

function formatShortTime(seconds: number): string {
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const hh = hrs.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Format time in seconds to mm:ss (no hours) for editor toolbar readouts
 */
export function formatMinutesSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Format time in seconds to mm:ss.mmm: precise, round-trippable through
 * parseTimeOrRangeInput/parseTimestampRanges for marking exact cut points.
 */
export function formatPreciseTime(seconds: number): string {
  const totalMs = Math.round(Math.max(0, seconds) * 1000);
  const mm = Math.floor(totalMs / 60000).toString().padStart(2, '0');
  const ss = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
  const mmm = (totalMs % 1000).toString().padStart(3, '0');
  return `${mm}:${ss}.${mmm}`;
}

/**
 * Format file size in bytes to MB/GB
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1))} ${sizes[i]}`;
}

/** Bytes of RAM needed to hold the decoded track (32-bit float, interleaved) for waveform drawing. */
export function estimateDecodeBytes(durationSeconds: number, sampleRate = 44100, channels = 2): number {
  return Math.max(0, Math.round(durationSeconds * sampleRate * channels * 4));
}
