import { OutputBundle } from '../types';

export type DownloadPlan =
  | { kind: 'single'; filename: string; blob: Blob; size: number }
  | { kind: 'zip'; filename: string; blob: Blob; size: number; fileCount: number }
  | { kind: 'empty' };

/**
 * One output file downloads directly. Several files download as one ZIP and
 * nothing else — no per-file buttons, no auto-download.
 */
export function planDownload(bundle: OutputBundle): DownloadPlan {
  if (bundle.files.length === 0) return { kind: 'empty' };
  if (bundle.files.length === 1) {
    const f = bundle.files[0];
    return { kind: 'single', filename: f.filename, blob: f.blob, size: f.size };
  }
  if (!bundle.zip) return { kind: 'empty' };
  return { kind: 'zip', filename: bundle.zip.name, blob: bundle.zip.blob, size: bundle.zip.blob.size, fileCount: bundle.files.length };
}
