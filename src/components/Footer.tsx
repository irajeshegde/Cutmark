import React from 'react';
import { BRAND, REPO_LINKS } from '../brand';
import { routeHref } from '../hooks/useHashRoute';
import { Logo } from './Logo';

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

export const Footer: React.FC = () => (
  <footer className="mt-20 border-t border-line">
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Logo className="h-6 w-6" />
          <span className="font-display text-xl leading-none">{BRAND.name}</span>
        </div>
        <p className="max-w-sm text-sm leading-6 text-ink-2">
          Your audio is processed inside this tab and never uploaded. Close the tab and it is gone.
        </p>
      </div>

      <nav aria-label="Pages" className="space-y-2 text-sm">
        <p className="eyebrow">Pages</p>
        <ul className="space-y-1.5 text-ink-2">
          <li><a className="hover:text-ink hover:underline" href={routeHref('guide')}>How to use it</a></li>
          <li><a className="hover:text-ink hover:underline" href={routeHref('capabilities')}>What it can and can’t do</a></li>
          <li><a className="hover:text-ink hover:underline" href={routeHref('about')}>About &amp; contributing</a></li>
        </ul>
      </nav>

      <nav aria-label="Project" className="space-y-2 text-sm">
        <p className="eyebrow">Open source</p>
        <ul className="space-y-1.5 text-ink-2">
          <li><a className="hover:text-ink hover:underline" href={BRAND.repoUrl} {...external}>Source on GitHub</a></li>
          <li><a className="hover:text-ink hover:underline" href={REPO_LINKS.newIssue} {...external}>Report a bug or idea</a></li>
          <li><a className="hover:text-ink hover:underline" href={REPO_LINKS.contributing} {...external}>Contribute</a></li>
          <li><a className="hover:text-ink hover:underline" href={REPO_LINKS.license} {...external}>{BRAND.license} license</a></li>
        </ul>
      </nav>
    </div>

    <div className="border-t border-line">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-5 text-xs leading-5 text-ink-3 sm:px-6">
        <p>
          <strong className="font-semibold text-ink-2">Built with AI.</strong> This site was written largely by an AI
          assistant (Claude, through Claude Code), directed and reviewed by a human maintainer. It is tested, but
          expect the occasional rough edge, and please report anything that looks wrong.
        </p>
        <p>
          Free and open source under the {BRAND.license} license. Anyone can read the code, fork it and send
          improvements. <a className="underline underline-offset-2 hover:text-ink" href={REPO_LINKS.contributing} {...external}>Start here</a>.
        </p>
      </div>
    </div>
  </footer>
);
