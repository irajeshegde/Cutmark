import React from 'react';
import { PageShell } from './PageShell';
import { BRAND, REPO_LINKS } from '../brand';

export const CapabilitiesPage: React.FC = () => (
  <PageShell
    kicker="Capabilities"
    title={<>What it does, and where it <em className="text-accent-text">stops</em>.</>}
    intro="What it does and what it doesn’t, so you can tell quickly whether it fits your job."
  >
    <h2>What it can do</h2>
    <h3>Cutting</h3>
    <ul>
      <li>Select a range on a zoomable waveform, or type exact times to the millisecond.</li>
      <li>Keep ranges, delete ranges, split at the playhead, reorder, re-trim and undo (up to 30 steps).</li>
      <li>Per-clip gain from −20 to +20&nbsp;dB.</li>
      <li>Export clips separately or join them into one file.</li>
      <li>Add many clips at once by pasting <code>mm:ss-mm:ss</code> lists.</li>
    </ul>
    <h3>Finding cut points</h3>
    <ul>
      <li>Nudge the playhead in 1&nbsp;s, 100&nbsp;ms and 10&nbsp;ms steps, by button or keyboard.</li>
      <li>Mark start/end pairs, audition each one, copy them as text or send them to the editor.</li>
    </ul>
    <h3>Splitting</h3>
    <ul>
      <li>Fixed-length parts from 1 to 180 minutes, without drawing a waveform.</li>
      <li>Lossless stream copy where the container allows it; automatic re-encode where it doesn’t.</li>
    </ul>
    <h3>Spoiling (Protect Original)</h3>
    <ul>
      <li>Three degradations: muffle, wobble, hiss, with Subtle / Medium / Heavy presets.</li>
      <li>Live Original/Spoilt switch while playing, and a how-spoilt rating.</li>
      <li>Spoilt exports are named <code>_spoilt</code> and can be auditioned before download.</li>
    </ul>
    <h3>Downloading</h3>
    <ul>
      <li>One output file downloads as itself, with no ZIP.</li>
      <li>Several output files download as a single ZIP with a small <code>manifest.txt</code>.</li>
      <li>Names include the date, a version number from the second export on, and part numbers only when there are several files.</li>
    </ul>

    <h3>Working offline</h3>
    <ul>
      <li>Install it from the popup or the footer and it opens like an app, with or without a connection.</li>
      <li>The page itself is saved on first visit. The 32&nbsp;MB audio engine is saved the first time you open the editor, or when you press <strong>Save for offline use</strong> in the footer.</li>
      <li>New versions download in the background and wait. Nothing reloads until you say so, so an update never wipes an edit in progress.</li>
    </ul>

    <h2>Formats</h2>
    <p>
      Input: MP3, M4A, AAC, WAV, FLAC, OGG, Opus, WebM, AIFF, MKA, MP4 audio and others that FFmpeg and your browser can read. Output
      keeps the input format where the bundled encoder supports it (MP3, M4A/AAC, WAV, AIFF, FLAC, OGG, Opus, WebM). Anything else
      comes out as MP3.
    </p>

    <h2>Limits</h2>
    <ul>
      <li>
        <strong>File size.</strong> The hard limit is 1&nbsp;GB, with a warning above 512&nbsp;MB. The work happens in the memory of one
        browser tab, and the Editor and Find Timestamp also decode the whole track to draw the waveform, which takes several times
        the file size. For very long recordings, Equal Split is the safer tool.
      </li>
      <li>
        <strong>Re-encoding.</strong> Editor exports are re-encoded, not copied, so lossy formats lose a little quality each generation.
        Equal Split without spoil is the exception.
      </li>
      <li>
        <strong>Spoil preview is approximate.</strong> The live preview uses the browser’s audio filters, the export uses FFmpeg’s. They
        use the same settings and sound alike, but are not identical, which is why you can play the real export before saving.
      </li>
      <li>
        <strong>It is a cutter, not a DAW.</strong> No fades, crossfades, multi-track mixing, tagging, loudness normalisation or noise
        removal.
      </li>
      <li>
        <strong>Your work isn’t saved.</strong> There is no account, and your audio and clips are never stored. Reloading the page
        discards them.
      </li>
      <li>
        <strong>Browsers.</strong> Developed and tested in Chromium-based browsers. Firefox and Safari should work but get less testing,
        and fullscreen isn’t available on iPhone.
      </li>
      <li>
        <strong>The engine is a 32&nbsp;MB download, once.</strong> Offline use needs it saved first, so open the editor or press
        <strong> Save for offline use</strong> while you are connected. If your browser clears site data, it downloads again.
      </li>
      <li>
        <strong>Installing depends on your browser.</strong> Chrome, Edge and Android browsers show an install prompt. On iPhone and iPad
        use Share, then Add to Home Screen. Desktop Firefox can’t install web apps, though the offline copy still works in a tab.
      </li>
    </ul>

    <h2>Privacy</h2>
    <p>
      Your audio is read by the page and processed by {BRAND.name}’s own copy of FFmpeg running in your browser. It is never uploaded.
      The only analytics is Vercel Web Analytics: anonymous, cookieless page-view counts that never include your audio, file names or
      anything you do in the editor. Fonts and the audio engine are served from the same site. Your browser keeps a copy of
      the app and the audio engine so it can run offline, plus your light/dark choice and whether you closed the install
      suggestion. Your audio is never among them. You can check any of this in the{' '}
      <a href={BRAND.repoUrl} target="_blank" rel="noopener noreferrer">source code</a> or your browser’s network tab.
    </p>

    <h2>Something missing?</h2>
    <p>
      It’s open source. <a href={REPO_LINKS.newIssue} target="_blank" rel="noopener noreferrer">Suggest a feature</a> or{' '}
      <a href={REPO_LINKS.contributing} target="_blank" rel="noopener noreferrer">send a pull request</a>.
    </p>
  </PageShell>
);
