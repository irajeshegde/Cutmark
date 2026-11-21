import { OutputBundle, OutputFile, RenderedClip } from '../types';
import {
  NameParts,
  buildFilename,
  buildZipName,
  claimVersion,
  formatDateStamp,
  peekVersion,
  sanitizeStem,
} from './filenames';
import { buildZip } from '../services/zipService';

export interface PackageOptions {
  /** Original file name, e.g. "My Song.mp3" — used for the stem. */
  sourceName: string;
  spoilt: boolean;
  now?: Date;
}

/** Name every rendered clip, and bundle them into a ZIP when there is more than one. */
export async function packageOutputs(
  rendered: RenderedClip[],
  { sourceName, spoilt, now = new Date() }: PackageOptions,
  onZipProgress?: (percent: number) => void
): Promise<OutputBundle> {
  const stem = sanitizeStem(sourceName);
  const dateStamp = formatDateStamp(now);
  const parts: NameParts = { stem, dateStamp, version: claimVersion(stem, dateStamp, spoilt), spoilt };

  const count = rendered.length;
  const files: OutputFile[] = rendered.map((clip, i) => ({
    ...clip,
    filename: buildFilename(parts, clip.extension, i + 1, count),
  }));

  if (files.length <= 1) return { files, zip: null, spoilt };

  const zipName = buildZipName(parts);
  const blob = await buildZip(files, { sourceName, spoilt, generatedAt: now }, onZipProgress);
  return { files, zip: { name: zipName, blob }, spoilt };
}

/** What the next export's file names will look like, without claiming a version. */
export function previewFilenames(sourceName: string, count: number, extension: string, spoilt: boolean, now = new Date()): string[] {
  const stem = sanitizeStem(sourceName);
  const dateStamp = formatDateStamp(now);
  const parts: NameParts = { stem, dateStamp, version: peekVersion(stem, dateStamp, spoilt), spoilt };
  return Array.from({ length: count }, (_, i) => buildFilename(parts, extension, i + 1, count));
}
