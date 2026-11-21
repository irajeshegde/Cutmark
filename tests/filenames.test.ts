import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildBaseName,
  buildFilename,
  buildZipName,
  claimVersion,
  formatDateStamp,
  getExtension,
  peekVersion,
  resetVersionCounters,
  sanitizeStem,
} from '../src/lib/filenames';

describe('sanitizeStem', () => {
  it('strips the extension and replaces spaces', () => {
    expect(sanitizeStem('My Song.mp3')).toBe('My_Song');
  });
  it('removes characters that are illegal on Windows', () => {
    expect(sanitizeStem('a<b>c:d"e/f\\g|h?i*j.wav')).toBe('a_b_c_d_e_f_g_h_i_j');
  });
  it('keeps unicode letters instead of flattening them to underscores', () => {
    expect(sanitizeStem('ನೃತ್ಯ ಗೀತೆ.mp3')).toBe('ನೃತ್ಯ_ಗೀತೆ');
    expect(sanitizeStem('Café del Mar.flac')).toBe('Café_del_Mar');
  });
  it('only strips the last extension', () => {
    expect(sanitizeStem('mix.v2.final.mp3')).toBe('mix.v2.final');
  });
  it('does not treat a leading dot as an extension', () => {
    expect(sanitizeStem('.hidden')).toBe('hidden');
  });
  it('falls back to "audio" when nothing usable is left', () => {
    expect(sanitizeStem('???.mp3')).toBe('audio');
    expect(sanitizeStem('')).toBe('audio');
  });
  it('truncates very long names', () => {
    expect(Array.from(sanitizeStem('x'.repeat(300) + '.mp3')).length).toBe(80);
  });
});

describe('getExtension', () => {
  it('lowercases and handles edge cases', () => {
    expect(getExtension('Song.MP3')).toBe('mp3');
    expect(getExtension('noext')).toBe('');
    expect(getExtension('trailing.')).toBe('');
    expect(getExtension('.bashrc')).toBe('');
  });
});

describe('formatDateStamp', () => {
  it('uses local date, zero padded', () => {
    expect(formatDateStamp(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatDateStamp(new Date(2026, 10, 21, 23, 59))).toBe('2026-11-21');
  });
});

describe('name building', () => {
  const base = { stem: 'Song', dateStamp: '2026-11-21', version: 1, spoilt: false };

  it('single file: date only, no part suffix', () => {
    expect(buildFilename(base, 'mp3', 1, 1)).toBe('Song_2026-11-21.mp3');
    expect(buildFilename(base, 'mp3')).toBe('Song_2026-11-21.mp3');
  });
  it('several files get zero-padded part numbers', () => {
    expect(buildFilename(base, 'mp3', 1, 3)).toBe('Song_2026-11-21_part01.mp3');
    expect(buildFilename(base, 'mp3', 3, 3)).toBe('Song_2026-11-21_part03.mp3');
  });
  it('widens the part number past 99 files', () => {
    expect(buildFilename(base, 'mp3', 7, 120)).toBe('Song_2026-11-21_part007.mp3');
  });
  it('version appears only from v2', () => {
    expect(buildBaseName({ ...base, version: 1 })).toBe('Song_2026-11-21');
    expect(buildBaseName({ ...base, version: 2 })).toBe('Song_2026-11-21_v2');
  });
  it('spoilt files are tagged, in single and multi-file exports', () => {
    expect(buildFilename({ ...base, spoilt: true }, 'mp3', 1, 1)).toBe('Song_2026-11-21_spoilt.mp3');
    expect(buildFilename({ ...base, spoilt: true, version: 2 }, 'wav', 2, 2)).toBe('Song_2026-11-21_v2_spoilt_part02.wav');
  });
  it('the ZIP shares the stem of its files', () => {
    expect(buildZipName({ ...base, spoilt: true })).toBe('Song_2026-11-21_spoilt.zip');
  });
});

describe('version counter', () => {
  beforeEach(resetVersionCounters);

  it('starts at 1 and increments per stem/date', () => {
    expect(peekVersion('Song', '2026-11-21', false)).toBe(1);
    expect(claimVersion('Song', '2026-11-21', false)).toBe(1);
    expect(claimVersion('Song', '2026-11-21', false)).toBe(2);
    expect(peekVersion('Song', '2026-11-21', false)).toBe(3);
  });
  it('peeking does not consume a version', () => {
    peekVersion('Song', '2026-11-21', false);
    peekVersion('Song', '2026-11-21', false);
    expect(claimVersion('Song', '2026-11-21', false)).toBe(1);
  });
  it('is independent per song, per day, and for spoilt vs clean', () => {
    claimVersion('Song', '2026-11-21', false);
    expect(claimVersion('Other', '2026-11-21', false)).toBe(1);
    expect(claimVersion('Song', '2026-11-22', false)).toBe(1);
    expect(claimVersion('Song', '2026-11-21', true)).toBe(1);
  });
});
