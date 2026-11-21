# Architecture

AudioSlice is a static single-page app. There is no backend; everything happens in the browser tab.

## Layers

```
components/  render + wire events
hooks/       shared stateful behaviour
services/    side effects: FFmpeg, Web Audio, ZIP
lib/         pure functions (no DOM, no React): naming, spoil model, clip maths
```

Dependencies point downward only. `lib/` imports nothing from the layers above it, which is why it is the most heavily tested part.

## Data flow

1. **Open.** `DropZone` validates the file (`lib/validateFile.ts`); `utils/audioMetadata.ts` reads its duration through an `<audio>` element, falling back to Web Audio decoding.
2. **Workspace** (lazy-loaded) hosts the three tools. It owns the Editor's clips, undo history, spoil settings and join flag so switching tabs never loses work.
3. **Waveform session** (`hooks/useWaveformSession.ts`) wraps wavesurfer: playhead, selection region, zoom, "play this range once". Editor and Finder share it.
4. **Render job** (`hooks/useRenderJob.ts`) runs an export or split, tracks progress, supports cancel (`AbortController` terminates the FFmpeg worker), and holds the finished `OutputBundle`.
5. **Services** render clips (`services/audioEditorService.ts`, `services/ffmpegService.ts`) into `RenderedClip[]` (blob + metadata, no filename yet).
6. **Packaging** (`lib/outputs.ts`) names the files (`lib/filenames.ts`) and, only when there is more than one, builds the ZIP (`services/zipService.ts`).
7. **Result** (`components/ResultView.tsx`) asks `lib/downloadPlan.ts` what to offer: one file -> direct download; several -> ZIP only. Downloads happen only on a click.

## FFmpeg

`@ffmpeg/core` is a dev dependency. `scripts/copy-ffmpeg-core.mjs` copies the ESM core into `public/ffmpeg/` before `dev` and `build`, and `ffmpegService` loads it from the same origin. There are no CDN fallbacks on purpose.

`ffmpeg.exec` resolves with an exit code instead of throwing; `execChecked` turns non-zero codes into errors. Cancelling terminates the worker; the next job loads a fresh instance.

## Spoil ("Protect Original")

`lib/spoil.ts` is the single source of the parameter mappings (cutoff Hz, vibrato depth, noise gain). Two consumers:

- **Export:** `buildFilterArgs()` -> FFmpeg `-af` / `filter_complex`.
- **Live preview:** `services/previewChain.ts` builds a Web Audio graph on the waveform's `<audio>` element: `gain -> lowpass -> delay+LFO (vibrato)`, plus a pink-noise bed. Parameters are switched with short ramps for the Original/Spoilt A/B, so there is no re-connecting and no clicks.

The preview is close to, not bit-identical with, FFmpeg's output; the result view plays the real exported file for the final check. `createMediaElementSource` may be called once per element, so `useSpoilPreview` rebuilds the chain only when the element changes.

## Routing

`hooks/useHashRoute.ts`: `#/`, `#/guide`, `#/capabilities`, `#/about`. Hash routing needs no rewrite rules on a static host.

## Testing

| Layer | Tool | Where |
| --- | --- | --- |
| Pure logic, shortcuts, contrast | Vitest | `tests/*.test.ts` |
| Components | Vitest + Testing Library (jsdom) | `tests/components.test.tsx` |
| Real flows: load, cut, spoil, download, mobile, no third-party requests | Playwright (Chromium, production build) | `e2e/app.spec.ts` |

jsdom has no Web Audio and no WASM, so anything that needs them is covered in e2e.

## Renaming the product

Edit `src/brand.ts`, then `package.json` (`name`), `index.html` (title, meta tags and the theme-key script, which must match `BRAND.slug`), and `public/favicon.svg`.
