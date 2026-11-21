# Contributing to Cutmark

Thanks for helping. Cutmark is open source (MIT) and any change that makes it more reliable, more accessible or more useful is welcome: bug reports, fixes, features, docs, translations, testing on other browsers.

## Ways to help

- **Report a bug.** Include the browser and version, the audio format (and roughly how long the file is), what you did, what you expected and what happened. A short sample file helps if you can share one. [Open an issue](https://github.com/irajeshegde/Cutmark/issues/new/choose).
- **Suggest a feature.** Say what you are trying to do, not only the feature. Small, focused tools beat big ones here.
- **Test on other browsers and devices.** The project is developed in Chromium; Firefox, Safari and real phones need more eyes.
- **Improve accessibility.** Screen-reader passes and keyboard-only passes are especially valuable.
- **Send code.** See below.

## Set up

Node 20 or newer.

```bash
git clone https://github.com/irajeshegde/Cutmark.git
cd Cutmark
npm install
npm run dev
```

Before you send a pull request:

```bash
npm run check        # type-check, unit tests, production build
npm run test:e2e     # browser tests (first time: npx playwright install chromium)
```

## Project layout

```
src/
  brand.ts          name, links: the only place the product name lives
  lib/              pure logic, no React, fully unit-tested
    filenames.ts      output naming and per-session versions
    spoil.ts          degradation model + FFmpeg filter args + severity
    clipOps.ts        delete/split/move operations on clip lists
    downloadPlan.ts   one file -> direct, several -> ZIP
  services/         FFmpeg, ZIP, live-preview audio chain (side effects)
  hooks/            shared state (waveform session, render job, clip history)
  components/       UI: Landing/, Editor/, Finder/, Split/, shared panels
  pages/            Guide, Capabilities, About
tests/              Vitest unit + component tests
e2e/                Playwright tests against the production build
docs/               architecture, design system, review report
```

The short version of the architecture: **pure logic in `lib/`, side effects in `services/`, state in `hooks/`, rendering in `components/`.** Put new logic in `lib/` with a test whenever you can.

## Ground rules

1. **Nothing leaves the device.** No tracking beyond the existing cookieless Vercel page-view counter (off on localhost), no other third-party scripts, fonts or CDNs, no network calls with user audio. The e2e suite asserts that the page only talks to its own origin; keep it passing. Anything the service worker caches must be app files, never user audio.
2. **Keep it simple to use.** One obvious next step on every screen. Prefer removing an option to adding one. Check your change at 390 px wide, with a touch screen in mind (44 px targets).
3. **Accessible by default.** Real buttons and labels, visible focus, keyboard operation, `aria-live` for status changes, no colour-only meaning. Contrast is tested; if you add a colour pair, add it to `tests/contrast.test.ts`.
4. **Use the design tokens.** Semantic classes (`bg-paper`, `text-ink-2`, `border-line`, `.btn`, `.panel`); never raw hex in components. See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). Dark mode then comes for free.
5. **Copy is plain.** Say what happens. No hype words, no filler, no emoji.
6. **Test behaviour.** A bug fix needs a test that fails without it. A new feature needs tests for its logic and, if it changes what a user sees or downloads, an e2e case.
7. **Small pull requests.** One concern each, with a description of what changed, why, and how you tested it. For anything large, open an issue first so we can agree on the approach.

## Renaming the product

All names and links come from `src/brand.ts`. The static copies are `package.json` (`name`), `index.html` (title, meta, theme-key script) and `public/favicon.svg`. Also the PWA manifest in `vite.config.ts` (name, short_name), the generated images (`npm run brand-images`) and the Vercel/GitHub project names. Search for `cutmark` and `Cutmark` to be sure.

## Using AI tools

Fine and welcome; this project was largely built that way. The standard is the same either way: **you** are responsible for what you submit. Read the diff, run it, understand why it works, and say in the PR description if AI wrote a significant part. Reviewers may ask you to explain a change.

## Code of conduct

Be kind and assume good faith. Harassment and personal attacks are not tolerated. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

By contributing you agree that your contribution is licensed under the [MIT license](LICENSE).
