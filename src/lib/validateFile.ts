import { MAX_FILE_SIZE_BYTES, SUPPORTED_AUDIO_EXTENSIONS } from '../utils/constants';
import { formatFileSize } from '../utils/formatters';
import { getExtension } from './filenames';

const EXTRA_MIME_TYPES = ['video/mp4', 'video/x-m4a', 'video/webm'];

/** Returns a human-readable problem with the file, or null when it can be opened. */
export function validateAudioFile(file: { name: string; type: string; size: number }): string | null {
  const ext = getExtension(file.name);
  const knownExt = !!ext && SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
  const audioMime = file.type.startsWith('audio/') || EXTRA_MIME_TYPES.includes(file.type);

  if (!knownExt && !audioMime) {
    return `“${file.name}” doesn’t look like an audio file${ext ? ` (.${ext})` : ''}. Try MP3, WAV, M4A, FLAC or OGG.`;
  }
  if (file.size === 0) {
    return `“${file.name}” is empty.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${formatFileSize(file.size)} is over the ${formatFileSize(MAX_FILE_SIZE_BYTES)} limit. The file is processed in this tab’s memory, so very large files can crash it.`;
  }
  return null;
}
