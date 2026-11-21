# Changelog

## 0.2.0

A ground-up rewrite. See [docs/REVIEW.md](docs/REVIEW.md) for the findings behind it.

### Added
- Live **Original / Spoilt** switch while audio plays, a "how spoilt" meter, and Subtle / Medium / Heavy presets.
- Playback of the real exported files before downloading.
- Single-file exports download directly; multi-file exports download as one ZIP.
- Filenames: `{name}_{YYYY-MM-DD}[_vN][_spoilt][_partNN].{ext}`.
- Cancel for long exports; "Back to editing" after an export.
- Spoil option in Equal Split.
- "Cut these in the editor" from Find Timestamp.
- Animated landing page, Guide, Capabilities and About pages; footer with AI disclosure and contributing links.
- Mobile layout with 44 px touch targets and a sticky export bar.
- Installable, offline-capable PWA: install popup plus a footer control (and iPhone steps), service worker for the app shell, the 32 MB audio engine cached on first use or via "Save for offline use", updates that wait for a reload.
- Vercel Web Analytics (cookieless page views, off on localhost); `npm run brand-images` regenerates the Open Graph image and app icons from the brand tokens.
- Unit, component and browser (Playwright) tests; CI; CONTRIBUTING, Code of Conduct, issue and PR templates.

### Changed
- New design system (paper/ink/vermilion, Instrument Serif + Geist + JetBrains Mono, light and dark).
- FFmpeg core is self-hosted instead of loaded from a CDN.
- "Delete selection" now removes the range from every clip.
- File limits: warn at 512 MB, hard cap 1 GB (was 1 GB / 2 GB).
- ZIP manifest renamed `manifest.txt`; no longer auto-downloads.

### Fixed
- Failed FFmpeg runs are reported instead of returning a broken file.
- Space no longer steals activation from focused buttons.
- Undo no longer mutates state inside an updater.
- Waveform follows the theme toggle.
- Non-Latin file names are preserved in output names.
- Gain boosts above 0 dB are audible in the preview.
- Drop zone is keyboard accessible.

### Removed
- `metadata.json`, AI Studio leftovers, the unused `motion` dependency.
