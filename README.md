<p align="center">
  <img src="public/favicon.svg" width="56" height="56" alt="Cutmark logo" />
</p>

<h1 align="center">Cutmark</h1>

<p align="center">
  Cut, split and time-mark audio in your browser.<br />
  Nothing is uploaded, there is no account, and it works offline.
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Runs in the browser" src="https://img.shields.io/badge/processing-100%25%20in--browser-brightgreen.svg" />
  <img alt="Built with AI assistance" src="https://img.shields.io/badge/built%20with-AI%20assistance-lightgrey.svg" />
</p>

**Live site:** https://cutmark.vercel.app

## What it does

| Tool | For |
| --- | --- |
| **Manual Editor** | Drag a range on a zoomable waveform, or type exact times to the millisecond. Keep, delete, split, reorder, re-trim, undo. Per-clip gain. Join clips into one file or export them separately. Paste many `mm:ss-mm:ss` ranges at once. |
| **Find Timestamp** | Nudge the playhead in 1 s / 100 ms / 10 ms steps to find the exact beat. Mark start/end pairs, audition them, copy as text or send them straight to the editor. |
| **Equal Split** | Cut a long recording into fixed-length parts (1 to 180 minutes) with no waveform. Lossless stream copy where the container allows it. |

Plus:

- **Spoil the audio** (“Protect Original”): deliberately degrade an export (muffle, wobble, hiss) so it works as a preview but not a replacement. A live **Original / Spoilt** switch lets you hear it while it plays, and a meter rates how damaged it is. Spoilt files are named `_spoilt`.
- **Simple downloads:** one output file downloads as itself; several come as a single ZIP. Nothing downloads until you press the button.
- **Predictable names:** `{name}_{YYYY-MM-DD}[_vN][_spoilt][_partNN].{ext}`. A version appears only from the second export of the same file on the same day; a part number only when there are several files.
- **Installable and offline:** a PWA. Install it from the in-page popup or the footer (Add to Home Screen on iPhone); once the audio engine is saved it cuts with no connection. Updates wait for you to reload, so they never wipe an edit.
- Works on phones (44 px touch targets, sticky export bar), light and dark themes, keyboard shortcuts, reduced-motion support.

Details for users: the in-app **Guide** and **Capabilities** pages (`src/pages/`).

## Privacy

Audio is decoded and cut by FFmpeg compiled to WebAssembly, running in your tab. The FFmpeg core, fonts and page are all served from the same origin; the page makes no third-party requests (an end-to-end test asserts this). The one exception is [Vercel Web Analytics](https://vercel.com/docs/analytics) on the hosted site: cookieless, anonymous page-view counts that never include audio or file names. It is off on localhost, so forks and local runs send nothing. The service worker keeps the app and the FFmpeg core in your browser cache so it works offline; the only other things stored are your theme choice and whether you closed the install popup. Audio is never stored.

## Run it locally

Requires Node 20 or newer.

```bash
npm install
npm run dev        # http://localhost:3947
```

`npm install` / `npm run dev` copy the FFmpeg core from `node_modules` into `public/ffmpeg/` (git-ignored) so it is served from your own origin.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run lint` | Type-check only |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) against the production build |
| `npm run check` | Type-check, unit tests, build |

First time running e2e: `npx playwright install chromium`.

## Tech

React 19, TypeScript (strict), Vite, Tailwind CSS 4 · ffmpeg.wasm · wavesurfer.js · JSZip · Vitest + Testing Library + Playwright. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Built with AI

This project, including the code, tests, design and docs, was written largely by an AI assistant (Claude, through Claude Code), directed and reviewed by a human maintainer. AI-written code can be wrong in convincing ways, so it is covered by automated tests and has been exercised in a real browser, but please report anything that looks off. [docs/REVIEW.md](docs/REVIEW.md) records what the last review found.

## Contributing

Contributions are very welcome, including from people who use AI tools. Read [CONTRIBUTING.md](CONTRIBUTING.md). Good places to start: more output formats, translations, screen-reader testing, Firefox and Safari testing.

## Limits worth knowing

- Files up to 1 GB; the Editor and Find Timestamp decode the whole track for the waveform, which needs several times the file size in memory. Equal Split avoids that.
- Editor exports are re-encoded, so lossy formats lose a little each generation.
- The live spoil preview uses the browser's audio filters and is close to, not identical to, the FFmpeg export.
- Developed and tested in Chromium. Other browsers should work but get less testing.

## License

[MIT](LICENSE). FFmpeg, bundled through ffmpeg.wasm, has its own license terms; see the [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) project.
