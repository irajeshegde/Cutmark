import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DropZone } from '../DropZone';
import { HeroWave } from './HeroWave';
import { routeHref } from '../../hooks/useHashRoute';

interface LandingProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

const MODES = [
  {
    n: '01',
    title: 'Manual Editor',
    body: 'Drag a range on the waveform, set the gain, and extract it. Delete a section, split at the playhead, reorder, undo, and join the pieces into one file.',
  },
  {
    n: '02',
    title: 'Find Timestamp',
    body: 'Step through the song in 1 s, 100 ms or 10 ms nudges, stamp exact start and end points, and copy them as mm:ss.mmm ranges, or send them straight to the editor.',
  },
  {
    n: '03',
    title: 'Equal Split',
    body: 'Chop a long recording into fixed-length parts (18 minutes, say) without touching a waveform. Lossless where the format allows it.',
  },
];

export const Landing: React.FC<LandingProps> = ({ onFileSelected, isLoading, error }) => (
  <div className="fade-up">
    <section className="pt-10 sm:pt-16">
      <p className="eyebrow">Audio cutter · runs in your browser</p>
      <h1 className="mt-4 max-w-3xl font-display text-[2.75rem] leading-[1.02] text-ink sm:text-7xl">
        Cut the song <em className="text-accent-text">exactly</em> where it should end.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-ink-2">
        Trim, split and time-mark MP3, WAV, M4A and more. Pick cut points by ear with 10&nbsp;ms precision. Nothing is
        uploaded, nothing is stored, and there is no account.
      </p>

      <div className="mt-10">
        <HeroWave />
      </div>

      <div className="mt-8">
        <DropZone onFileSelected={onFileSelected} isLoading={isLoading} externalError={error} />
      </div>
    </section>

    <section className="mt-20" aria-labelledby="modes-title">
      <h2 id="modes-title" className="eyebrow">Three ways to cut</h2>
      <ol className="mt-4 divide-y divide-line border-y border-line">
        {MODES.map((m) => (
          <li key={m.n} className="grid gap-2 py-6 sm:grid-cols-[4rem_14rem_1fr] sm:gap-6">
            <span className="font-display text-4xl leading-none text-accent-text">{m.n}</span>
            <h3 className="font-display text-2xl leading-tight text-ink">{m.title}</h3>
            <p className="text-[15px] leading-7 text-ink-2">{m.body}</p>
          </li>
        ))}
      </ol>
    </section>

    <section className="mt-20 grid gap-10 md:grid-cols-2" aria-label="Privacy and sharing">
      <div>
        <h2 className="font-display text-3xl leading-tight">Your file never leaves the tab.</h2>
        <p className="mt-3 text-[15px] leading-7 text-ink-2">
          Decoding and cutting run on your own machine through FFmpeg compiled to WebAssembly. The engine, the fonts and
          the page all come from this site. While you work there are no third-party requests, only an anonymous page-view
          counter. Close the tab and the audio is gone.
        </p>
      </div>
      <div>
        <h2 className="font-display text-3xl leading-tight">Share a preview, keep the clean copy.</h2>
        <p className="mt-3 text-[15px] leading-7 text-ink-2">
          Protect Original degrades the exported audio on purpose: muffled highs, a little hiss, a slight wobble. Listen
          to the original and the spoilt version side by side, live, and see how damaged it is before you export.
        </p>
      </div>
    </section>

    <section className="mt-16 flex flex-wrap items-center justify-between gap-4 border border-line bg-sunk px-5 py-5 rounded-cut">
      <p className="max-w-md text-[15px] text-ink-2">
        New here? The guide walks through a full cut in about two minutes.
      </p>
      <div className="flex flex-wrap gap-2">
        <a className="btn btn-ink" href={routeHref('guide')}>
          Read the guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <a className="btn" href={routeHref('capabilities')}>What it can do</a>
      </div>
    </section>
  </div>
);
