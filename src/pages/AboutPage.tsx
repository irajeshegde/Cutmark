import React from 'react';
import { PageShell } from './PageShell';
import { BRAND, REPO_LINKS } from '../brand';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

export const AboutPage: React.FC = () => (
  <PageShell
    kicker="About"
    title={<>Small tool, <em className="text-accent-text">open code</em>.</>}
    intro={`${BRAND.name} is a small tool for cutting audio without uploading it anywhere. It is open source and anyone can help improve it.`}
  >
    <h2>Why it exists</h2>
    <p>
      Cutting a clip out of a song or a long recording usually means installing an editor, or sending your file to a website you have to
      trust. {BRAND.name} does the job in the browser tab, and it is built around finding the cut point by ear, to the millisecond.
    </p>

    <h2>Open source</h2>
    <p>
      The code is released under the {BRAND.license} license: use it, fork it, host your own copy, change it. The source is at{' '}
      <a href={BRAND.repoUrl} {...ext}>{BRAND.repoUrl.replace('https://', '')}</a>.
    </p>

    <h2>Built with AI</h2>
    <p>
      Most of this site, the code, the tests, the design and this text, was written by an AI assistant (Claude, through Claude
      Code). A human maintainer decides what to build and reviews and tests the result. AI-written code can have mistakes that look
      convincing. This has automated tests and was checked in a real browser, but it hasn't had the years of use a mature editor has.
      If something sounds or behaves wrong, tell us.
    </p>
    <p>Contributions are welcome whether or not you use AI tools yourself. The contributing guide asks only that you understand and test what you submit.</p>

    <h2>How to contribute</h2>
    <ol>
      <li>
        <strong>Try it and report problems.</strong> A bug report with the browser, the file format and what you expected is the most
        useful contribution. <a href={REPO_LINKS.newIssue} {...ext}>Open an issue</a>.
      </li>
      <li>
        <strong>Fork and run it.</strong> You need Node 20 or newer. <code>npm install</code>, then <code>npm run dev</code>.
      </li>
      <li>
        <strong>Make a focused change</strong> on a branch, with a test if it changes behaviour. <code>npm run check</code> runs type
        checks, the tests and the build.
      </li>
      <li>
        <strong>Open a pull request</strong> describing what changed and how you tested it. For anything large, open an issue first so we
        can agree on the approach.
      </li>
    </ol>
    <p>
      The full guide, with the project layout and design rules, is in{' '}
      <a href={REPO_LINKS.contributing} {...ext}>CONTRIBUTING.md</a>. Good first areas: more output formats, translations, accessibility
      checks with screen readers, and Firefox/Safari testing.
    </p>

    <h2>Built on</h2>
    <ul>
      <li><a href="https://github.com/ffmpegwasm/ffmpeg.wasm" {...ext}>ffmpeg.wasm</a> for decoding, cutting and encoding (FFmpeg is LGPL/GPL licensed; see its project for terms)</li>
      <li><a href="https://wavesurfer.xyz" {...ext}>wavesurfer.js</a> for the waveform</li>
      <li>React, Vite, Tailwind CSS, JSZip, lucide icons</li>
      <li>Fonts: Instrument Serif, Geist and JetBrains Mono, all under the SIL Open Font License</li>
    </ul>
  </PageShell>
);
