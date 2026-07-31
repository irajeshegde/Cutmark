<img src="public/favicon.svg" width="48" height="48" alt="AudioSlice icon" />

# AudioSlice

Split long audio recordings into equal-length chunks, right in your browser. No uploads, no server, no storage.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19-61dafb.svg)
![Vite](https://img.shields.io/badge/vite-6-646cff.svg)
![Client-side only](https://img.shields.io/badge/processing-100%25%20client--side-brightgreen.svg)

<p>
  <img src="assets/screenshots/2026-07-31%2010%2039%2048.png" width="49%" alt="AudioSlice file overview screen, showing chunk length settings and planned output" />
  <img src="assets/screenshots/2026-07-31%2010%2040%2015.png" width="49%" alt="AudioSlice processing screen in dark mode, showing progress and activity logs" />
</p>

## Features

- Drag-and-drop MP3, WAV, M4A, FLAC, OGG, and most other audio formats
- Splits into equal-length chunks at any custom duration (default 18 minutes)
- Downloads all chunks as one ZIP, or grab them one at a time
- Runs fully client-side via [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm), so your file never leaves the tab
- Light and dark mode
- File size cap (2GB hard limit, warning above 1GB) to stay within browser memory limits

## Run locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech stack

- React, TypeScript, Vite
- Tailwind CSS
- ffmpeg.wasm for audio splitting in-browser
- JSZip for bundling output chunks

## License

MIT, see [LICENSE](LICENSE).
