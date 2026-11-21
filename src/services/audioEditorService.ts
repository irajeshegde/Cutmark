import { AudioFileDetails, EditorClip, RenderedClip, SpoilSettings } from '../types';
import {
  AbortError,
  ProgressFn,
  execChecked,
  getCodecStrategy,
  readBlob,
  renderSegment,
  withFFmpeg,
  writeInput,
} from './ffmpegService';
import { formatHumanDuration, formatTimestampRange } from '../utils/formatters';
import { getExtension } from '../lib/filenames';

/**
 * Renders manually-picked clips (trim + gain, plus optional degradation) via
 * FFmpeg WASM, optionally concatenating them into a single output file.
 */
export async function exportClips(
  fileDetails: AudioFileDetails,
  clips: EditorClip[],
  joinIntoOne: boolean,
  spoil: SpoilSettings | undefined,
  onProgress: ProgressFn,
  signal?: AbortSignal
): Promise<RenderedClip[]> {
  if (clips.length === 0) {
    throw new Error('No clips to export. Select a range on the waveform first.');
  }

  const file = fileDetails.file;
  const extension = getExtension(file.name) || 'mp3';
  const strategy = getCodecStrategy(extension);

  onProgress(2, 0, clips.length, 'Starting the audio engine…');

  return withFFmpeg(signal, async (ffmpeg) => {
    onProgress(5, 0, clips.length, `Loading “${file.name}” into memory…`);
    const input = await writeInput(ffmpeg, file, extension);

    const partFiles: string[] = [];
    const rendered: RenderedClip[] = [];
    const tempFiles: string[] = [];

    try {
      for (let i = 0; i < clips.length; i++) {
        if (signal?.aborted) throw new AbortError();
        const clip = clips[i];
        const durationSec = Math.max(0, clip.endSec - clip.startSec);
        const percent = 10 + Math.round((i / clips.length) * 70);
        onProgress(percent, i + 1, clips.length, `Rendering clip ${i + 1} of ${clips.length}…`);

        const part = `edit_part${String(i).padStart(3, '0')}.${strategy.extension}`;
        tempFiles.push(part);
        await renderSegment(ffmpeg, input, part, clip.startSec, durationSec, strategy, clip.gainDb, spoil);
        const blob = await readBlob(ffmpeg, part, strategy.mimeType);
        partFiles.push(part);

        rendered.push({
          index: i + 1,
          extension: strategy.extension,
          mimeType: strategy.mimeType,
          startSec: clip.startSec,
          durationSec,
          formattedRange: formatTimestampRange(clip.startSec, durationSec),
          formattedDuration: formatHumanDuration(durationSec),
          blob,
          size: blob.size,
        });
      }

      if (!joinIntoOne || rendered.length === 1) {
        onProgress(92, clips.length, clips.length, 'All clips rendered.');
        return rendered;
      }

      onProgress(85, clips.length, clips.length, 'Joining clips into one file…');
      const listFile = 'edit_concat_list.txt';
      const joined = `edit_joined.${strategy.extension}`;
      tempFiles.push(listFile, joined);
      await ffmpeg.writeFile(listFile, new TextEncoder().encode(partFiles.map((n) => `file '${n}'`).join('\n')));
      await execChecked(ffmpeg, ['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', joined]);

      const joinedBlob = await readBlob(ffmpeg, joined, strategy.mimeType);
      const totalDuration = rendered.reduce((acc, c) => acc + c.durationSec, 0);
      onProgress(92, clips.length, clips.length, 'Clips joined.');

      return [
        {
          index: 1,
          extension: strategy.extension,
          mimeType: strategy.mimeType,
          startSec: clips[0].startSec,
          durationSec: totalDuration,
          formattedRange: `${rendered.length} clips joined`,
          formattedDuration: formatHumanDuration(totalDuration),
          blob: joinedBlob,
          size: joinedBlob.size,
        },
      ];
    } finally {
      await ffmpeg.deleteFile(input).catch(() => {});
      for (const name of tempFiles) await ffmpeg.deleteFile(name).catch(() => {});
    }
  });
}
