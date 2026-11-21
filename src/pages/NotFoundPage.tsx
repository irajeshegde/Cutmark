import React from 'react';
import { ArrowRight } from 'lucide-react';
import { NotFoundArt } from '../components/NotFoundArt';
import { routeHref } from '../hooks/useHashRoute';

export const NotFoundPage: React.FC = () => (
  <article className="fade-up mx-auto max-w-3xl pb-6 pt-6 sm:pt-10">
    <p className="eyebrow">Error 404</p>
    <h1 className="mt-3 font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
      That cut <em className="text-accent-text">doesn&rsquo;t exist</em>.
    </h1>
    <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-2">
      There is no page at this address. It may have moved, or the link may have a typo.
    </p>

    <figure className="crop mt-10 border border-line bg-surface px-3 pb-4 pt-6 sm:px-6">
      <NotFoundArt />
    </figure>

    <div className="mt-8 flex flex-wrap gap-2">
      <a href={routeHref('home')} className="btn btn-primary">
        Open a file <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
      <a href={routeHref('guide')} className="btn">How to use it</a>
      <a href={routeHref('capabilities')} className="btn">What it can do</a>
    </div>
  </article>
);
