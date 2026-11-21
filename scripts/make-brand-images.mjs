// Renders the social/preview images from the brand tokens, so they never drift
// from the site's look. Run: npm run brand-images
//
// Outputs (committed, served from /public):
//   public/og-image.png          1200x630   Open Graph / Twitter / link previews
//   public/apple-touch-icon.png  180x180    iOS home screen
//   public/icon-192.png          192x192    PWA install icon
//   public/icon-512.png          512x512    PWA install icon / store listings
//   public/icon-maskable-512.png 512x512    PWA maskable icon (art inside the 80% safe zone)
//
// To rename the product, edit src/brand.ts and the NAME/URL constants below.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'Cutmark';
const URL_TEXT = 'cutmark.vercel.app';

const font = (pkg, file) => readFileSync(resolve(root, 'node_modules', pkg, 'files', file)).toString('base64');
const faces = `
@font-face{font-family:'Instrument Serif';font-style:normal;src:url(data:font/woff2;base64,${font('@fontsource/instrument-serif', 'instrument-serif-latin-400-normal.woff2')}) format('woff2')}
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(data:font/woff2;base64,${font('@fontsource/instrument-serif', 'instrument-serif-latin-400-italic.woff2')}) format('woff2')}
@font-face{font-family:'Geist';font-weight:100 900;src:url(data:font/woff2;base64,${font('@fontsource-variable/geist', 'geist-latin-wght-normal.woff2')}) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:100 800;src:url(data:font/woff2;base64,${font('@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}) format('woff2')}
`;

const PAPER = '#f5f0e6';
const SURFACE = '#faf6ee';
const INK = '#1c1a16';
const INK3 = '#6b655a';
const LINE = '#d9d1c0';
const ACCENT = '#d2381a';

// Same deterministic waveform as the landing hero.
const BARS = 80;
const SCALE = 0.55; // flatter than the hero so it clears the headline
const heights = Array.from({ length: BARS }, (_, i) => {
  const env = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI * 3.1 + 0.6);
  const tex = 0.5 + 0.5 * Math.sin(i * 1.7) * Math.cos(i * 0.43);
  return Math.max(6, Math.round((14 + env * tex * 150) * SCALE));
});
const CUTS = [27, 54];
const PITCH = 10;
const H = 200 * SCALE;
const bar = (i, fill) =>
  `<rect x="${i * PITCH}" y="${(H - heights[i]) / 2}" width="5" height="${heights[i]}" rx="2" fill="${fill}"/>`;
const waveform = heights
  .map((_, i) => bar(i, i >= CUTS[0] && i < CUTS[1] ? ACCENT : INK))
  .join('');
const cuts = CUTS.map(
  (c) =>
    `<line x1="${c * PITCH - 2.5}" x2="${c * PITCH - 2.5}" y1="-10" y2="${H + 10}" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="5 6"/>`,
).join('');

const logoMark = (s) => `
<svg width="${s}" height="${s}" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${PAPER}"/>
  <g fill="${INK}">
    <rect x="3" y="12" width="3" height="8" rx="1"/><rect x="8" y="6" width="3" height="20" rx="1"/>
    <rect x="13" y="10" width="3" height="12" rx="1"/><rect x="22" y="9" width="3" height="14" rx="1"/>
    <rect x="27" y="13" width="2" height="6" rx="1"/>
  </g>
  <rect x="17.5" y="2" width="2" height="28" rx="1" fill="${ACCENT}"/>
</svg>`;

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>${faces}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:${PAPER};color:${INK};font-family:'Geist',sans-serif;position:relative;overflow:hidden}
.frame{position:absolute;inset:36px;border:1px solid ${LINE};background:${SURFACE}}
.brand{position:absolute;left:84px;top:78px;display:flex;align-items:center;gap:16px;font-family:'Instrument Serif',serif;font-size:38px}
.kicker{position:absolute;right:84px;top:88px;font-family:'JetBrains Mono',monospace;font-size:17px;letter-spacing:.14em;text-transform:uppercase;color:${INK3}}
h1{position:absolute;left:84px;top:168px;width:860px;font-family:'Instrument Serif',serif;font-weight:400;font-size:100px;line-height:.98;letter-spacing:-.01em}
h1 em{color:${ACCENT}}
.wave{position:absolute;left:84px;right:84px;bottom:108px}
.foot{position:absolute;left:84px;right:84px;bottom:66px;display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:18px;color:${INK3}}
</style></head><body>
<div class="frame"></div>
<div class="brand">${logoMark(46)}<span>${NAME}</span></div>
<div class="kicker">Audio cutter · runs in your browser</div>
<h1>Cut the song <em>exactly</em> where it should end.</h1>
<svg class="wave" viewBox="-10 -12 ${BARS * PITCH + 20} ${H + 24}" width="1032" height="${Math.round(((H + 24) / (BARS * PITCH + 20)) * 1032)}">${waveform}${cuts}</svg>
<div class="foot"><span>No uploads · no account · free &amp; open source</span><span>${URL_TEXT}</span></div>
</body></html>`;

// Maskable: Android crops to a circle/squircle, so the mark sits inside the central 80%.
const maskableHtml = (size) => `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:${PAPER};display:flex;align-items:center;justify-content:center">${logoMark(Math.round(size * 0.62)).replace(/<rect width="32" height="32" rx="6"[^>]*\/>/, `<rect width="32" height="32" fill="${PAPER}"/>`)}</body></html>`;

const iconHtml = (size) => `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:${PAPER}">${logoMark(size).replace(/<rect width="32" height="32" rx="6"[^>]*\/>/, `<rect width="32" height="32" fill="${PAPER}"/>`)}</body></html>`;

const browser = await chromium.launch();
try {
  const shot = async (html, w, h, out) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    writeFileSync(resolve(root, 'public', out), await page.screenshot({ type: 'png' }));
    await page.close();
    console.log('wrote public/' + out);
  };
  await shot(ogHtml, 1200, 630, 'og-image.png');
  await shot(iconHtml(180), 180, 180, 'apple-touch-icon.png');
  await shot(iconHtml(192), 192, 192, 'icon-192.png');
  await shot(iconHtml(512), 512, 512, 'icon-512.png');
  await shot(maskableHtml(512), 512, 512, 'icon-maskable-512.png');
} finally {
  await browser.close();
}
