import React from 'react';

/** A waveform with a razor cut through it. Mirrors public/favicon.svg. */
export const Logo: React.FC<{ className?: string }> = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <g className="fill-ink">
      <rect x="2" y="12" width="3" height="8" rx="1" />
      <rect x="7" y="6" width="3" height="20" rx="1" />
      <rect x="12" y="10" width="3" height="12" rx="1" />
      <rect x="22" y="9" width="3" height="14" rx="1" />
      <rect x="27" y="13" width="3" height="6" rx="1" />
    </g>
    <rect x="17.25" y="1" width="2" height="30" rx="1" className="fill-accent" />
  </svg>
);
