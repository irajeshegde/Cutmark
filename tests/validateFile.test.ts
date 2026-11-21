import { describe, expect, it } from 'vitest';
import { validateAudioFile } from '../src/lib/validateFile';
import { MAX_FILE_SIZE_BYTES } from '../src/utils/constants';

const f = (name: string, type = '', size = 1000) => ({ name, type, size });

describe('validateAudioFile', () => {
  it('accepts known extensions and audio mime types', () => {
    expect(validateAudioFile(f('a.MP3'))).toBeNull();
    expect(validateAudioFile(f('voice-memo', 'audio/x-m4a'))).toBeNull();
    expect(validateAudioFile(f('clip.mp4', 'video/mp4'))).toBeNull();
  });
  it('rejects non-audio', () => {
    expect(validateAudioFile(f('photo.jpg', 'image/jpeg'))).toMatch(/look like an audio file/);
    expect(validateAudioFile(f('notes.txt'))).not.toBeNull();
  });
  it('rejects empty and oversize files', () => {
    expect(validateAudioFile(f('a.mp3', '', 0))).toMatch(/empty/);
    expect(validateAudioFile(f('a.mp3', '', MAX_FILE_SIZE_BYTES + 1))).toMatch(/limit/);
    expect(validateAudioFile(f('a.mp3', '', MAX_FILE_SIZE_BYTES))).toBeNull();
  });
});
