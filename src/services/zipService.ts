import JSZip from 'jszip';
import { BRAND } from '../brand';
import { OutputFile } from '../types';

export interface ManifestInfo {
  sourceName: string;
  spoilt: boolean;
  generatedAt: Date;
}

function buildManifest(files: OutputFile[], info: ManifestInfo): string {
  const lines = files.map((f) => `- ${f.filename} | ${f.formattedDuration} | ${f.formattedRange}`);
  return [
    `${BRAND.name} export`,
    '='.repeat(`${BRAND.name} export`.length),
    `Source file : ${info.sourceName}`,
    `Files       : ${files.length}`,
    `Degraded    : ${info.spoilt ? 'yes (Protect Original was applied)' : 'no'}`,
    `Created     : ${info.generatedAt.toISOString()}`,
    '',
    ...lines,
    '',
    `Made in the browser with ${BRAND.name} - ${BRAND.repoUrl}`,
    '',
  ].join('\n');
}

/** Bundles output files into a ZIP blob. Does not trigger a download. */
export async function buildZip(
  files: OutputFile[],
  info: ManifestInfo,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.filename, file.blob);
  zip.file('manifest.txt', buildManifest(files, info));

  return zip.generateAsync(
    // Audio is already compressed; STORE is much faster and no larger.
    { type: 'blob', compression: 'STORE' },
    (meta) => onProgress?.(Math.round(meta.percent))
  );
}
