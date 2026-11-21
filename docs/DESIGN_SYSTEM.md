# Design system

**Idea:** a print shop's proofing table. Warm paper, black ink, one red-pencil accent, hairlines instead of shadows, crop marks and dashed *cut here* rules. It is a tool for cutting things, so the visual language is about precision and editing marks, not glass cards and gradients.

Tokens live in `src/index.css`. Components use the semantic names below and never raw hex, so light and dark are one switch (`.dark` on `<html>`).

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `paper` | `#f5f0e6` | `#14120f` | page background |
| `surface` | `#fbf8f1` | `#1c1a16` | panels |
| `sunk` | `#ebe5d7` | `#0f0d0b` | wells: waveform, segmented control, meters |
| `line` | `#d6cdb8` | `#36322a` | hairlines, dividers |
| `line-strong` | `#b9ae95` | `#544e41` | control borders |
| `ink` | `#1c1a16` | `#f1ece0` | text, primary dark button |
| `ink-2` | `#4a463c` | `#c4bdac` | secondary text |
| `ink-3` | `#6b6657` | `#9a9382` | muted text, captions |
| `accent` | `#d2381a` | `#ff6a45` | primary button, selection, playhead progress |
| `accent-text` | `#b02d12` | `#ff8a6b` | accent used as *text* or link |
| `on-accent` | `#ffffff` | `#14120f` | text on `accent` |
| `accent-wash` | `#f6dfd5` | `#3a1e15` | error / drop-target background |
| `ok` / `ok-wash` | `#2f6b3e` / `#dfead9` | `#86c996` / `#1b2a1f` | success |
| `warn` / `warn-wash` | `#8a5300` / `#f3e5c4` | `#e3b25c` / `#2e2412` | warnings, "degraded" markers |

Rules:

- **One accent.** Red is for the primary action, the selection and the cut. It is not decoration.
- Accent as **text** must use `accent-text`, not `accent`.
- Never convey meaning by colour alone: the severity meter also prints its label and score; errors have an icon and text.
- `tests/contrast.test.ts` checks the pairs the UI uses against WCAG AA (4.5:1 text, 7:1 for body text) in both themes. Add new pairs there.

## Type

| Role | Font | Use |
| --- | --- | --- |
| Display | Instrument Serif (`font-display`) | headlines, file names, big numbers |
| UI | Geist Variable (`font-sans`) | everything else |
| Data | JetBrains Mono Variable (`font-mono`) | timecodes, file names in lists, captions, kbd |

All self-hosted through `@fontsource` packages (no font CDN). Timecodes always use mono with tabular numerals so digits do not jitter while playing.

Scale (Tailwind): captions `text-[11px]`/`text-xs`, body `text-sm`/`text-[15px]`, lead `text-lg`, display `text-3xl`...`text-7xl` in the serif.

`.eyebrow`: 11 px mono, uppercase, wide tracking; used for field labels and section kickers.

## Shape and spacing

- Radius: `3px` (`rounded-cut`). Nothing is pill-shaped except small chips.
- Borders: 1 px `line` for structure, `line-strong` for controls. No box shadows.
- **Crop marks** (`.crop`): L-shaped corners in `ink`, used once, on the landing figure.
- **Cut line** (`.cutline`): dashed `line-strong` rule to separate stages inside a panel.
- Panels (`.panel`, `.panel-head`, `.panel-body`) are the only container.
- Content width: `max-w-5xl` for the app, `max-w-3xl` for prose pages.

## Components (classes in `index.css`)

| Class | Notes |
| --- | --- |
| `.btn` | 36 px high, hairline border. Modifiers: `.btn-primary` (accent), `.btn-ink` (solid ink), `.btn-quiet` (no border), `.btn-danger`, `.btn-sm`, `.btn-icon`, `.btn-lg` |
| `.field` | text/number input, mono |
| `.segmented` | grouped toggle; selected state via `aria-selected` / `aria-pressed` |
| `.chip` | small status tag |
| `.panel*` | container |
| `.prose-doc` | long-form pages (Guide, Capabilities, About) |

Primary actions are red; at most one red button per view region. Destructive actions are quiet buttons with red text, never red-filled.

## Touch and mobile

- `@media (pointer: coarse)` raises every button and field to **44 px** (40 px for `.btn-sm`), and enlarges sliders and checkboxes.
- Layouts stack below `sm` (640 px). Start/End stay side by side; the export bar is `sticky bottom-0` so the main action is always one thumb away.
- The page never scrolls sideways. The waveform area uses `touch-action: pan-y` so dragging a selection does not fight page scroll.
- Fullscreen is offered only where `document.fullscreenEnabled` (not iPhone).

## Motion

- One signature animation: the landing figure (a razor sweeps a waveform, the track splits into parts and rejoins, 10 s loop, pure CSS in `index.css`).
- Page content fades up 8 px once (`.fade-up`). Controls transition colour only.
- `prefers-reduced-motion`: the loop stops on its "already cut" frame and fade-ups are disabled.

## Voice

Plain and specific. Say what will happen ("You get 3 files in one ZIP"), not what the tool is ("powerful, seamless"). No exclamation marks, no emoji, no filler adjectives. Errors say what went wrong and what to try.

## Logo

A five-bar waveform with a red razor line through it (`src/components/Logo.tsx`, mirrored in `public/favicon.svg`).
