import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { AudioFileDetails, RenderedClip, SpoilSettings } from '../types';
import { formatFFmpegTime, formatHumanDuration, formatTimestampRange } from '../utils/formatters';
import { getExtension } from '../lib/filenames';
import { buildFilterArgs, isSpoilActive } from '../lib/spoil';

export type ProgressFn = (percent: number, currentIndex: number, total: number, message: string) => void;

export class AbortError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'AbortError';
  }
}

export interface CodecStrategy {
  extension: string;
  mimeType: string;
  encodeArgs: string[];
}

/**
 * Codecs the bundled ffmpeg-core WASM build is known to encode. Extensions not
 * listed here fall back to MP3 (libmp3lame), which is always available.
 */
const CODEC_STRATEGY: Record<string, Omit<CodecStrategy, 'extension'>> = {
  mp3: { mimeType: 'audio/mpeg', encodeArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  mpeg: { mimeType: 'audio/mpeg', encodeArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  mpg: { mimeType: 'audio/mpeg', encodeArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  mpga: { mimeType: 'audio/mpeg', encodeArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  m4a: { mimeType: 'audio/mp4', encodeArgs: ['-c:a', 'aac', '-b:a', '192k'] },
  aac: { mimeType: 'audio/aac', encodeArgs: ['-c:a', 'aac', '-b:a', '192k'] },
  mp4: { mimeType: 'audio/mp4', encodeArgs: ['-c:a', 'aac', '-b:a', '192k'] },
  wav: { mimeType: 'audio/wav', encodeArgs: ['-c:a', 'pcm_s16le'] },
  aiff: { mimeType: 'audio/aiff', encodeArgs: ['-c:a', 'pcm_s16le'] },
  aif: { mimeType: 'audio/aiff', encodeArgs: ['-c:a', 'pcm_s16le'] },
  flac: { mimeType: 'audio/flac', encodeArgs: ['-c:a', 'flac'] },
  ogg: { mimeType: 'audio/ogg', encodeArgs: ['-c:a', 'libvorbis', '-q:a', '5'] },
  oga: { mimeType: 'audio/ogg', encodeArgs: ['-c:a', 'libvorbis', '-q:a', '5'] },
  opus: { mimeType: 'audio/opus', encodeArgs: ['-c:a', 'libopus', '-b:a', '128k'] },
  webm: { mimeType: 'audio/webm', encodeArgs: ['-c:a', 'libopus', '-b:a', '128k'] },
  mka: { mimeType: 'audio/x-matroska', encodeArgs: ['-c:a', 'libopus', '-b:a', '128k'] },
};

const FALLBACK_STRATEGY: CodecStrategy = {
  extension: 'mp3',
  mimeType: 'audio/mpeg',
  encodeArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'],
};

export function getCodecStrategy(extension: string): CodecStrategy {
  const strategy = CODEC_STRATEGY[extension];
  return strategy ? { extension, ...strategy } : FALLBACK_STRATEGY;
}

// ---- engine lifecycle ---------------------------------------------------------

let ffmpegInstance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/** The WASM core is copied into /ffmpeg at install/build time (scripts/copy-ffmpeg-core.mjs) and served from our own origin. */
const CORE_BASE = `${import.meta.env.BASE_URL}ffmpeg`;

export function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpegInstance) return Promise.resolve(ffmpegInstance);
  if (loading) return loading;

  loading = (async () => {
    const ffmpeg = new FFmpeg();
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    } catch (err) {
      throw new Error(
        `Could not load the audio engine (${(err as Error).message || 'network error'}). Reload the page and try again.`
      );
    }
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })().finally(() => {
    loading = null;
  });

  return loading;
}

/** Kills any running FFmpeg work. The next job loads a fresh engine. */
export function terminateFFmpeg(): void {
  ffmpegInstance?.terminate();
  ffmpegInstance = null;
}

/** Runs `fn` with an FFmpeg instance; aborting the signal terminates the engine mid-run. */
export async function withFFmpeg<T>(signal: AbortSignal | undefined, fn: (ffmpeg: FFmpeg) => Promise<T>): Promise<T> {
  if (signal?.aborted) throw new AbortError();
  const ffmpeg = await getFFmpegInstance();
  const onAbort = () => terminateFFmpeg();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await fn(ffmpeg);
  } catch (err) {
    if (signal?.aborted) throw new AbortError();
    throw err;
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

/** ffmpeg.exec resolves with the exit code instead of throwing — turn failures into errors. */
export async function execChecked(ffmpeg: FFmpeg, args: string[]): Promise<void> {
  const code = await ffmpeg.exec(['-y', ...args]);
  if (code !== 0) throw new Error(`FFmpeg failed (exit code ${code}).`);
}

export async function readBlob(ffmpeg: FFmpeg, filename: string, mimeType: string): Promise<Blob> {
  const data = await ffmpeg.readFile(filename);
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return new Blob([bytes as BlobPart], { type: mimeType });
}

export async function writeInput(ffmpeg: FFmpeg, file: File, extension: string): Promise<string> {
  const name = `input_${Date.now()}.${extension || 'bin'}`;
  await ffmpeg.writeFile(name, await fetchFile(file));
  return name;
}

/** Renders [startSec, startSec+durationSec) of `input` through gain/spoil filters and a re-encode. */
export async function renderSegment(
  ffmpeg: FFmpeg,
  input: string,
  output: string,
  startSec: number,
  durationSec: number,
  strategy: CodecStrategy,
  gainDb: number,
  spoil: SpoilSettings | undefined
): Promise<void> {
  const duration = formatFFmpegTime(durationSec);
  await execChecked(ffmpeg, [
    '-ss', formatFFmpegTime(startSec),
    '-t', duration,
    '-i', input,
    '-vn',
    ...buildFilterArgs(gainDb, duration, spoil),
    ...strategy.encodeArgs,
    output,
  ]);
}

// ---- equal split ---------------------------------------------------------------------

/**
 * Splits an audio file into fixed-length chunks. Tries a lossless stream copy
 * first; falls back to a re-encode when the copy fails, and always re-encodes
 * when "Protect Original" is on (filters can't run on copied streams).
 */
export async function splitAudioFile(
  fileDetails: AudioFileDetails,
  chunkDurationMinutes: number,
  spoil: SpoilSettings | undefined,
  onProgress: ProgressFn,
  signal?: AbortSignal
): Promise<RenderedClip[]> {
  const file = fileDetails.file;
  const totalDuration = fileDetails.durationSeconds;
  const chunkDurationSec = chunkDurationMinutes * 60;
  const totalChunks = Math.max(1, Math.ceil(totalDuration / chunkDurationSec));

  const extension = getExtension(file.name) || 'mp3';
  const strategy = getCodecStrategy(extension);
  const copyMime = CODEC_STRATEGY[extension]?.mimeType ?? 'audio/mpeg';
  const mustReencode = !!spoil && isSpoilActive(spoil);

  onProgress(2, 0, totalChunks, 'Starting the audio engine…');

  return withFFmpeg(signal, async (ffmpeg) => {
    onProgress(5, 0, totalChunks, `Loading “${file.name}” (${fileDetails.formattedDuration}) into memory…`);
    const input = await writeInput(ffmpeg, file, extension);
    const rendered: RenderedClip[] = [];

    try {
      for (let i = 0; i < totalChunks; i++) {
        if (signal?.aborted) throw new AbortError();
        const startSec = i * chunkDurationSec;
        const durationSec = Math.min(chunkDurationSec, totalDuration - startSec);
        const num = i + 1;
        const percent = 10 + Math.round((i / totalChunks) * 80);
        onProgress(percent, num, totalChunks, `Cutting part ${num} of ${totalChunks} (${formatHumanDuration(durationSec)})…`);

        let blob: Blob | null = null;
        let outExt = extension;
        let mime = copyMime;

        if (!mustReencode) {
          const copyOut = `chunk_${i}_copy.${extension}`;
          try {
            await execChecked(ffmpeg, [
              '-ss', formatFFmpegTime(startSec),
              '-i', input,
              '-t', formatFFmpegTime(durationSec),
              '-c', 'copy',
              '-avoid_negative_ts', 'make_zero',
              copyOut,
            ]);
            const candidate = await readBlob(ffmpeg, copyOut, copyMime);
            if (candidate.size > 100) blob = candidate;
          } catch {
            // stream copy failed for this container; re-encode below
          } finally {
            await ffmpeg.deleteFile(copyOut).catch(() => {});
          }
        }

        if (!blob) {
          if (!mustReencode) onProgress(percent + 1, num, totalChunks, `Re-encoding part ${num} for a clean boundary…`);
          const out = `chunk_${i}_enc.${strategy.extension}`;
          try {
            await renderSegment(ffmpeg, input, out, startSec, durationSec, strategy, 0, spoil);
            blob = await readBlob(ffmpeg, out, strategy.mimeType);
          } finally {
            await ffmpeg.deleteFile(out).catch(() => {});
          }
          outExt = strategy.extension;
          mime = strategy.mimeType;
        }

        rendered.push({
          index: num,
          extension: outExt,
          mimeType: mime,
          startSec,
          durationSec,
          formattedRange: formatTimestampRange(startSec, durationSec),
          formattedDuration: formatHumanDuration(durationSec),
          blob,
          size: blob.size,
        });
      }
    } finally {
      await ffmpeg.deleteFile(input).catch(() => {});
    }

    onProgress(92, totalChunks, totalChunks, 'All parts cut.');
    return rendered;
  });
}
