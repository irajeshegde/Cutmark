export interface ParsedTimeRange {
  startSec: number;
  endSec: number;
}

// Matches "3.16-5:14", "8.02 - 8.55", "24.22-24.54" etc. — mm.ss or mm:ss on
// either side of the dash, separators used interchangeably. Anything else on
// the line (chat sender names, dates, message timestamps) is ignored.
const RANGE_REGEX = /(\d{1,3})[.:](\d{2})\s*-\s*(\d{1,3})[.:](\d{2})/;

/**
 * Parses one time-range per line (mm.ss-mm.ss / mm:ss-mm:ss) out of pasted
 * text, e.g. lines copied from a chat export. Lines without a matching
 * pattern, or with end <= start, are skipped.
 */
export function parseTimestampRanges(text: string): ParsedTimeRange[] {
  const ranges: ParsedTimeRange[] = [];

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(RANGE_REGEX);
    if (!match) continue;

    const [, startMin, startSec, endMin, endSec] = match;
    const startTotal = Number(startMin) * 60 + Number(startSec);
    const endTotal = Number(endMin) * 60 + Number(endSec);

    if (Number.isNaN(startTotal) || Number.isNaN(endTotal) || endTotal <= startTotal) continue;
    ranges.push({ startSec: startTotal, endSec: endTotal });
  }

  return ranges;
}
