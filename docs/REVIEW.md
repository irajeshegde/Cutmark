# Review report: v0.1 -> v0.2

End-to-end review of the original site, what was found, and what was done. Severity: **High** = wrong behaviour or broken promise, **Medium** = real friction or risk, **Low** = polish.

## Findings

### Trust and correctness

| # | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| 1 | High | The FFmpeg WASM core was fetched from unpkg/jsDelivr at export time, contradicting "nothing leaves your device" and failing offline. | Core is a dev dependency, copied to `public/ffmpeg/` at build, loaded same-origin. CDN fallbacks removed. E2E asserts the page only contacts its own origin. |
| 2 | High | `ffmpeg.exec` resolves with an exit code; it was ignored, so a failed encode could be returned as a (broken) file. | `execChecked` throws on non-zero. |
| 3 | High | A ZIP was always built and auto-downloaded, even for a single file, with no way to decline. | One file downloads directly; several are ZIP only; nothing downloads without a click. (`lib/downloadPlan.ts`, tested.) |
| 4 | Medium | No way to cancel a long export. | Cancel button; aborting terminates the FFmpeg worker. |
| 5 | Medium | Outputs had no date or version and spoilt exports were indistinguishable from clean ones. Names stripped all non-ASCII letters (`ನೃತ್ಯ.mp3` -> `____.mp3`). | New scheme `{name}_{date}[_vN][_spoilt][_partNN]`; unicode kept; Windows-illegal characters removed. (`lib/filenames.ts`, tested.) |
| 6 | Medium | Spoil could only be judged after exporting. | Live Original/Spoilt A/B on the playing audio, severity meter, and playback of the real export before download. |
| 7 | Medium | Space was captured globally, so a keyboard user could not press a focused button with Space. | `shouldIgnoreShortcut` (tested). |
| 8 | Medium | Undo called `setClips` inside a state updater (runs twice under StrictMode). | Single-state `useClipHistory`. |
| 9 | Medium | Positive gain could not be previewed (element volume is capped at 1.0). | Gain runs through the Web Audio chain, so -20 to +20 dB is audible. |
| 10 | Medium | After an export the only options were "download again" or "process another file", losing all clips. | "Back to editing" keeps clips; the editor stays mounted while exporting. Tab switches no longer lose work (state lifted to `Workspace`). |
| 11 | Medium | "Delete selection" replaced the whole clip list instead of cutting the range out of it. | `subtractRange` removes the range from every clip (tested). |
| 12 | Medium | File caps (1 GB warn / 2 GB hard) were optimistic: the waveform decodes the whole file to 32-bit float. | Caps lowered to 512 MB / 1 GB and a decode-memory estimate warning. *Limits are conservative estimates, not measured on every device.* |
| 13 | Low | Waveform colours were read once, so the theme toggle did not repaint it. | Observes the theme class and re-colours. |
| 14 | Low | Stale-closure risk: wavesurfer callbacks captured props at creation. | Callbacks read through a ref. |
| 15 | Low | Dead code and leftovers: `metadata.json`, AI Studio comments and mojibake in `vite.config.ts`, unused types and the `@` alias, unused `motion`, runtime dependencies that are build-only. | Removed or moved. |

### Accessibility

| # | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| 16 | High | Drop zone was a `div` with a click handler: unreachable by keyboard. | A real `button`, with drag-and-drop on top. |
| 17 | Medium | Icon-only buttons had no accessible names; mode tabs had no roles. | Labels everywhere; `tablist`/`tab`/`tabpanel` with arrow-key navigation. |
| 18 | Medium | Colour contrast untested; muted text was low. | Tokens defined with AA pairs and asserted in a test for both themes. |
| 19 | Low | No skip link, no `aria-live` for status, motion not reducible. | Skip link, live regions, `prefers-reduced-motion` handling. |

### Design and UX

| # | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| 20 | Medium | Stock slate + indigo, `rounded-3xl` cards with soft shadows, icon-in-square feature grid: read as a template. | New design system: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). |
| 21 | Medium | Not usable on a phone: 24 px icon buttons, a wide toolbar, nothing pinned. | 44 px touch targets, stacked layouts, sticky export bar, no horizontal scroll (e2e checks it). |
| 22 | Medium | Too many controls at once; no guidance. | One "what next" hint line, optional features (spoil, paste timestamps) in collapsibles, one primary action per area. |
| 23 | Low | Finder results had to be copy-pasted into the editor. | "Cut these in the editor" button. |
| 24 | Low | Landing page: a drop zone and four cards. No explanation, no guide. | Animated landing, Guide, Capabilities and About pages, footer with AI disclosure and contribution links. |

## Verification

- `npm run check`: type-check (strict), 130 unit/component tests, production build.
- `npm run test:e2e`: 11 browser tests (Chromium): no console errors or third-party requests; one file downloads plain; several as ZIP only with `_part01`/`_part02`; join; spoil A/B + `_spoilt` + `_v2`; tab-switch persistence and Finder -> Editor; Equal Split; 390 px mobile layout without horizontal scroll and with >= 40 px targets.

## Known gaps

- Only Chromium has been tested. Firefox and Safari are untested; iPhone has no fullscreen API (the button is hidden).
- Live spoil preview is an approximation of FFmpeg's filters. Whether it sounds "the same" is a judgement call; the e2e test only proves the export differs from a clean cut, not how it sounds.
- Large-file limits are estimates. A 1 GB file may still fail on a low-RAM device; the failure is a browser tab crash that the app cannot catch.
- No screen-reader pass has been done (labels and roles are in place, but real assistive-technology testing is still wanted).
- MP3 and AAC exports are re-encoded at 192 kbps; there is no bitrate or format option.
- The Open Graph image (`public/og-image.png`) is from the previous design.
