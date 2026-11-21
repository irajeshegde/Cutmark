import { AudioFileDetails } from '../types';
import { formatHumanDuration } from './formatters';
import { getExtension } from '../lib/filenames';

/**
 * Reads audio file metadata (duration, size, channels, etc.) without sending anything to a server.
 */
export async function getAudioFileDetails(file: File): Promise<AudioFileDetails> {
  const extension = getExtension(file.name) || 'mp3';

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };

    const onLoaded = () => {
      const durationSeconds = audio.duration;
      cleanup();

      if (!durationSeconds || isNaN(durationSeconds) || durationSeconds === Infinity) {
        // Fallback to Web Audio API decoding if HTML5 Audio metadata fails
        tryWebAudioDecode(file)
          .then(resolve)
          .catch((err) => reject(new Error('Could not determine audio duration. This file may be corrupted or use a codec your browser cannot decode.')));
        return;
      }

      resolve({
        file,
        name: file.name,
        size: file.size,
        extension,
        durationSeconds,
        formattedDuration: formatHumanDuration(durationSeconds),
      });
    };

    const onError = () => {
      cleanup();
      // Try Web Audio API as fallback before failing
      tryWebAudioDecode(file)
        .then(resolve)
        .catch(() => reject(new Error('Your browser could not read this file. It may be corrupted, or use a codec it does not support. Try re-exporting it as MP3 or WAV.')));
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = objectUrl;
  });
}

/**
 * Fallback audio duration decoder using Web Audio API AudioContext
 */
async function tryWebAudioDecode(file: File): Promise<AudioFileDetails> {
  const extension = getExtension(file.name) || 'mp3';
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextClass();
  
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const durationSeconds = audioBuffer.duration;
    
    return {
      file,
      name: file.name,
      size: file.size,
      extension,
      durationSeconds,
      formattedDuration: formatHumanDuration(durationSeconds),
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
    };
  } finally {
    await ctx.close().catch(() => {});
  }
}

/**
 * Computes chunk count and breakdown based on total duration and target chunk duration in minutes.
 */
export function calculateChunks(durationSeconds: number, chunkDurationMinutes: number = 18) {
  const chunkDurationSec = chunkDurationMinutes * 60;
  if (!durationSeconds || durationSeconds <= 0) {
    return { totalChunks: 0, chunkDurationSec, chunksSummary: [] };
  }

  const totalChunks = Math.ceil(durationSeconds / chunkDurationSec);
  const chunksSummary: { index: number; durationSeconds: number; formattedDuration: string }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkDurationSec;
    const dur = Math.min(chunkDurationSec, durationSeconds - start);
    chunksSummary.push({
      index: i + 1,
      durationSeconds: dur,
      formattedDuration: formatHumanDuration(dur),
    });
  }

  return {
    totalChunks,
    chunkDurationSec,
    chunksSummary,
    lastChunkDuration: chunksSummary[chunksSummary.length - 1]?.durationSeconds || 0,
    formattedLastChunkDuration: chunksSummary[chunksSummary.length - 1]?.formattedDuration || '0s',
  };
}
