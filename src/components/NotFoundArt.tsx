import React, { useMemo } from 'react';

const BARS = 64;
const PITCH = 10;
const H = 150;
const GAP = [26, 38]; // bars in this range are "missing": drawn as dashed outlines

function heights(): number[] {
  return Array.from({ length: BARS }, (_, i) => {
    const envelope = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI * 3.1 + 0.6);
    const texture = 0.5 + 0.5 * Math.sin(i * 1.7) * Math.cos(i * 0.43);
    return Math.max(8, Math.round(14 + envelope * texture * 110));
  });
}

/** Illustration for the not-found page: a waveform with a section cut out and nothing in its place. */
export const NotFoundArt: React.FC = () => {
  const hs = useMemo(heights, []);
  return (
    <svg
      viewBox={`-10 -14 ${BARS * PITCH + 20} ${H + 28}`}
      className="block h-auto w-full"
      role="img"
      aria-label="A waveform with a missing section between two cut lines"
    >
      {hs.map((h, i) => {
        const missing = i >= GAP[0] && i < GAP[1];
        return (
          <rect
            key={i}
            x={i * PITCH}
            y={(H - h) / 2}
            width={5}
            height={h}
            rx={2}
            className={missing ? undefined : 'fill-ink'}
            fill={missing ? 'none' : undefined}
            stroke={missing ? 'var(--line-strong)' : undefined}
            strokeDasharray={missing ? '3 3' : undefined}
          />
        );
      })}
      {GAP.map((g) => (
        <line key={g} x1={g * PITCH - 2.5} x2={g * PITCH - 2.5} y1={-8} y2={H + 8} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 5" />
      ))}
    </svg>
  );
};
