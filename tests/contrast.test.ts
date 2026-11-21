import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Reads the :root and .dark token blocks from index.css and checks WCAG contrast for the pairs the UI really uses. */
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground token, background token, minimum ratio, what it is]
const PAIRS: [string, string, number, string][] = [
  ['ink', 'paper', 7, 'body text'],
  ['ink', 'surface', 7, 'text on panels'],
  ['ink-2', 'paper', 4.5, 'secondary text'],
  ['ink-2', 'surface', 4.5, 'secondary text on panels'],
  ['ink-3', 'paper', 4.5, 'muted text'],
  ['ink-3', 'surface', 4.5, 'muted text on panels'],
  ['ink-3', 'sunk', 4.5, 'muted text on wells'],
  ['accent-text', 'paper', 4.5, 'accent links and labels'],
  ['accent-text', 'surface', 4.5, 'accent text on panels'],
  ['on-accent', 'accent', 4.5, 'primary button'],
  ['ink', 'accent-wash', 7, 'error text'],
  ['ink', 'warn-wash', 7, 'warning text'],
  ['warn', 'warn-wash', 4.5, 'warning label'],
  ['warn', 'surface', 4.5, 'warning chip'],
  ['ok', 'surface', 4.5, 'success text'],
];

describe.each([
  ['light', ':root'],
  ['dark', '.dark'],
])('%s theme contrast (WCAG AA)', (_name, selector) => {
  const t = tokens(selector);
  it.each(PAIRS)('%s on %s >= %s (%s)', (fg, bg, min) => {
    expect(t[fg], `missing token --${fg}`).toBeDefined();
    expect(t[bg], `missing token --${bg}`).toBeDefined();
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });
});
