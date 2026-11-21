import React from 'react';
import { PageShell, Step } from './PageShell';
import { routeHref } from '../hooks/useHashRoute';

export const GuidePage: React.FC = () => (
  <PageShell
    kicker="How to use it"
    title={<>Cut a song in <em className="text-accent-text">two minutes</em>.</>}
    intro="The short version: open a file, drag across the part you want, keep it, export it. The rest of this page covers the details."
  >
    <h2>The basic cut</h2>
    <ol className="space-y-7 !pl-0">
      <Step n={1} title="Open a file">
        <p>
          Drop an audio file on the home page, or press the drop area to choose one. MP3, WAV, M4A, FLAC and OGG all work, as do most
          other audio formats. Files up to 1&nbsp;GB are accepted; above 512&nbsp;MB you get a memory warning.
        </p>
      </Step>
      <Step n={2} title="Select the part you want">
        <p>
          In <strong>Manual Editor</strong>, drag across the waveform. Press <kbd>Space</kbd> to listen. To be exact, type times into
          <strong> Start</strong> and <strong>End</strong>, or press the pin button beside a box to take the current playhead position.
        </p>
        <p>
          Use the nudge buttons (<code>−1s</code>, <code>−100ms</code>, <code>−10ms</code> and the forward equivalents) to move the
          playhead until the cut sounds right. On a keyboard: <kbd>←</kbd>/<kbd>→</kbd> moves 100&nbsp;ms, with <kbd>Shift</kbd> 1&nbsp;s,
          with <kbd>Alt</kbd> 10&nbsp;ms.
        </p>
      </Step>
      <Step n={3} title="Keep it, or delete it">
        <p>
          <strong>Keep selection</strong> adds the range to your clip list. <strong>Delete selection</strong> removes the range from the
          track and keeps the rest. <strong>Split here</strong> cuts at the playhead. Everything is undoable.
        </p>
      </Step>
      <Step n={4} title="Check the clips">
        <p>
          Press play on any clip to hear just that part. The pencil re-trims it on the waveform. Each clip has its own gain
          (−20 to +20&nbsp;dB). Reorder with the arrows. Tick <strong>Join into one file</strong> if you want a single result.
        </p>
      </Step>
      <Step n={5} title="Export and download">
        <p>
          Press <strong>Export</strong>. When it finishes you can play the result before saving it. One file downloads directly.
          Several files come as one ZIP. Nothing downloads until you press the button.
        </p>
      </Step>
    </ol>

    <h2>Finding an exact cut point</h2>
    <p>
      <strong>Find Timestamp</strong> is for when you need the precise moment, say the downbeat of a dance track. It does not export.
      Play, pause on the beat, pin the playhead as Start, do the same for End, and press <strong>Add range</strong>. Then either
      <strong> Cut these in the editor</strong> (your ranges become clips) or <strong>Copy all</strong> to keep the
      <code>mm:ss.mmm</code> list somewhere else.
    </p>

    <h2>Pasting timestamps</h2>
    <p>
      In the editor, open <strong>Paste timestamps</strong> and paste one range per line. These all work:
    </p>
    <ul>
      <li><code>3:16-5:14</code> and <code>3.16-5.14</code> (minutes and seconds)</li>
      <li><code>03:16.245-05:14.000</code> (with milliseconds)</li>
      <li><code>[12/03, 9:41] Asha: 8.02 - 8.55</code> (chat text around the range is ignored)</li>
    </ul>

    <h2>Splitting into equal parts</h2>
    <p>
      <strong>Equal Split</strong> cuts a long recording into parts of a fixed length (18 minutes by default). There is no waveform, so it
      handles long files that would be heavy to draw. It copies the audio without re-encoding when the format allows, so there is no
      quality loss. If the track is shorter than one part you simply get one file.
    </p>

    <h2>Sharing a preview: spoil the audio</h2>
    <p>
      Say you want to send someone a clip to approve, without handing over a clean copy. Open <strong>Spoil the audio</strong>, turn on
      <strong> Apply to export</strong>, and pick a preset or set the three sliders:
    </p>
    <ul>
      <li><strong>Muffle</strong> cuts the high frequencies.</li>
      <li><strong>Wobble</strong> adds a slow pitch flutter.</li>
      <li><strong>Hiss</strong> mixes in low-level noise.</li>
    </ul>
    <p>
      Press play on the waveform and use the <strong>Original / Spoilt</strong> switch (or press <kbd>B</kbd>) to flip between the clean
      and the damaged sound while it plays. The <strong>How spoilt</strong> meter gives a rough rating, from barely noticeable to hard
      to listen to. The live version is a close preview; after exporting you can play the real file before downloading it.
    </p>
    <p>
      Spoilt files are named with <code>_spoilt</code> so nobody mixes them up with the clean ones.
    </p>

    <h2>How exported files are named</h2>
    <p>The pattern is the original name, the date, then optional parts:</p>
    <ul>
      <li><code>My_Song_2026-11-21.mp3</code>: a single file, nothing extra</li>
      <li><code>My_Song_2026-11-21_part01.mp3</code>, <code>_part02</code>…: several files (only then does a part number appear)</li>
      <li><code>My_Song_2026-11-21_v2.mp3</code>: the second export of the same song on the same day in this session</li>
      <li><code>My_Song_2026-11-21_spoilt.mp3</code>: spoil was applied</li>
    </ul>

    <h2>Tips</h2>
    <ul>
      <li>Zoom in on the waveform before nudging; at full zoom-out one pixel can be a second or more.</li>
      <li>Exports are re-encoded (192&nbsp;kbps for MP3 and AAC), so avoid chaining many exports of the same file if quality matters.</li>
      <li>On a phone, the Export button stays pinned to the bottom of the screen.</li>
      <li>
        Going somewhere without signal? Press <strong>Save for offline use</strong> in the footer once, while you’re online, or install
        the app. Cutting, exporting and downloading then work with no connection.
      </li>
      <li>Closing or reloading the tab discards your clips. Copy your timestamps first if you want to keep them.</li>
    </ul>

    <p>
      Not sure it can do what you need? <a href={routeHref('capabilities')}>See what it can and can’t do</a>.
    </p>
  </PageShell>
);
