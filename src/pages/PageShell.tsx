import React from 'react';
import { routeHref } from '../hooks/useHashRoute';

interface PageShellProps {
  kicker: string;
  title: React.ReactNode;
  intro: string;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ kicker, title, intro, children }) => (
  <article className="fade-up mx-auto max-w-3xl pb-6 pt-6 sm:pt-10">
    <p className="eyebrow">{kicker}</p>
    <h1 className="mt-3 font-display text-5xl leading-[1.05] text-ink sm:text-6xl">{title}</h1>
    <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-2">{intro}</p>
    <div className="prose-doc">{children}</div>
    <div className="cutline mt-14 pt-6">
      <a href={routeHref('home')} className="btn btn-primary">Open a file</a>
    </div>
  </article>
);

export const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <li className="relative list-none! pl-12">
    <span className="absolute left-0 top-0 font-display text-4xl leading-none text-accent-text">{String(n).padStart(2, '0')}</span>
    <h3 className="mt-0!">{title}</h3>
    {children}
  </li>
);
