/**
 * Output filename rules.
 *
 *   {stem}_{YYYY-MM-DD}[_vN][_spoilt][_partNN].{ext}
 *
 * - date    always present, local time, so files sort by day
 * - _vN     only from the 2nd export of the same stem/date/spoilt flag in one
 *           browser session ("version, only if needed")
 * - _spoilt only when degradation was baked in, so a shared preview copy can
 *           never be mistaken for the clean one
 * - _partNN only when the export produced more than one file; a single file
 *           never carries a part suffix
 */

const ILLEGAL_FS_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

/** Strip the extension and make the base name safe on Windows/macOS/Linux, keeping unicode letters. */
export function sanitizeStem(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  // A leading dot (".hidden") or no dot means there is no extension to strip.
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const cleaned = base
    .normalize('NFC')
    .replace(ILLEGAL_FS_CHARS, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '');
  const truncated = Array.from(cleaned).slice(0, 80).join('');
  return truncated || 'audio';
}

export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/** Local-time YYYY-MM-DD. */
export function formatDateStamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---- per-session version counter ---------------------------------------

const exportsThisSession = new Map<string, number>();

function versionKey(stem: string, dateStamp: string, spoilt: boolean): string {
  return `${stem}|${dateStamp}|${spoilt ? 1 : 0}`;
}

/** The version the next export would get, without claiming it (for previews). */
export function peekVersion(stem: string, dateStamp: string, spoilt: boolean): number {
  return (exportsThisSession.get(versionKey(stem, dateStamp, spoilt)) ?? 0) + 1;
}

/** Claim the next version for this stem/date/spoilt combination. */
export function claimVersion(stem: string, dateStamp: string, spoilt: boolean): number {
  const next = peekVersion(stem, dateStamp, spoilt);
  exportsThisSession.set(versionKey(stem, dateStamp, spoilt), next);
  return next;
}

export function resetVersionCounters(): void {
  exportsThisSession.clear();
}

// ---- name building ------------------------------------------------------

export interface NameParts {
  stem: string;
  dateStamp: string;
  /** 1 = first export, omitted from the name. */
  version: number;
  spoilt: boolean;
}

/** `{stem}_{date}[_vN][_spoilt]`: shared by every file and the ZIP of one export. */
export function buildBaseName({ stem, dateStamp, version, spoilt }: NameParts): string {
  let name = `${stem}_${dateStamp}`;
  if (version > 1) name += `_v${version}`;
  if (spoilt) name += '_spoilt';
  return name;
}

export function buildFilename(parts: NameParts, extension: string, partNumber?: number, partCount?: number): string {
  let name = buildBaseName(parts);
  if (partNumber !== undefined && partCount !== undefined && partCount > 1) {
    const width = Math.max(2, String(partCount).length);
    name += `_part${String(partNumber).padStart(width, '0')}`;
  }
  return extension ? `${name}.${extension}` : name;
}

export function buildZipName(parts: NameParts): string {
  return `${buildBaseName(parts)}.zip`;
}
