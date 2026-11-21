import { describe, expect, it } from 'vitest';
import { planDownload } from '../src/lib/downloadPlan';
import { OutputBundle, OutputFile } from '../src/types';

const file = (name: string, bytes = 10): OutputFile => ({
  index: 1,
  extension: 'mp3',
  mimeType: 'audio/mpeg',
  startSec: 0,
  durationSec: 1,
  formattedRange: '00:00 - 00:01',
  formattedDuration: '1s',
  blob: new Blob([new Uint8Array(bytes)]),
  size: bytes,
  filename: name,
});

describe('planDownload', () => {
  it('one file downloads directly, never as a ZIP', () => {
    const bundle: OutputBundle = { files: [file('a.mp3', 42)], zip: null, spoilt: false };
    expect(planDownload(bundle)).toMatchObject({ kind: 'single', filename: 'a.mp3', size: 42 });
  });
  it('several files are ZIP only', () => {
    const zip = new Blob([new Uint8Array(99)]);
    const bundle: OutputBundle = { files: [file('a.mp3'), file('b.mp3')], zip: { name: 'x.zip', blob: zip }, spoilt: false };
    expect(planDownload(bundle)).toMatchObject({ kind: 'zip', filename: 'x.zip', fileCount: 2, size: 99 });
  });
  it('several files without a ZIP are not offered as loose files', () => {
    expect(planDownload({ files: [file('a.mp3'), file('b.mp3')], zip: null, spoilt: false }).kind).toBe('empty');
  });
  it('no files', () => {
    expect(planDownload({ files: [], zip: null, spoilt: false }).kind).toBe('empty');
  });
});
