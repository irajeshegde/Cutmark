import React, { useMemo } from 'react';

const BAR_COUNT = 80;
const BAR_PITCH = 10;
const CUTS = [27, 54]; // bar index where each cut falls
const HEIGHT = 200;

/** Deterministic pseudo-waveform: same shape every render, no random flicker. */
function barHeights(): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const envelope = 0.55 + 0.45 * Math.sin((i / BAR_COUNT) * Math.PI * 3.1 + 0.6);
    const texture = 0.5 + 0.5 * Math.sin(i * 1.7) * Math.cos(i * 0.43);
    return Math.max(10, Math.round(14 + envelope * texture * 150));
  });
}

/**
 * Animated hero figure: a razor sweeps across a waveform, the track falls apart
 * into numbered parts, then closes up and loops. Pure CSS animation (see
 * index.css); static "already cut" state under prefers-reduced-motion.
 */
export const HeroWave: React.FC = () => {
  const heights = useMemo(barHeights, []);
  const width = BAR_COUNT * BAR_PITCH;

  const segments = [
    { cls: 'seg-a', from: 0, to: CUTS[0], fill: 'fill-ink', label: 'part01' },
    { cls: 'seg-b', from: CUTS[0], to: CUTS[1], fill: 'fill-accent', label: 'part02' },
    { cls: 'seg-c', from: CUTS[1], to: BAR_COUNT, fill: 'fill-ink', label: 'part03' },
  ];

  return (
    <figure className="crop border border-line bg-surface px-3 pb-4 pt-6 sm:px-6" aria-label="Animation: a razor cuts a waveform into three parts">
      <svg
        viewBox={`-30 -10 ${width + 60} ${HEIGHT + 56}`}
        className="hero-wave block h-auto w-full"
        style={{ ['--razor-travel' as string]: `${width}px` }}
        role="img"
        aria-hidden="true"
      >
        {segments.map((seg) => (
          <g key={seg.cls} className={seg.cls}>
            {heights.slice(seg.from, seg.to).map((h, k) => {
              const i = seg.from + k;
              return <rect key={i} x={i * BAR_PITCH} y={(HEIGHT - h) / 2} width={5} height={h} rx={2} className={seg.fill} />;
            })}
          </g>
        ))}

        {CUTS.map((c) => (
          <line
            key={c}
            className="cut-guide"
            x1={c * BAR_PITCH - 2.5}
            x2={c * BAR_PITCH - 2.5}
            y1={-6}
            y2={HEIGHT + 6}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 5"
          />
        ))}

        {segments.map((seg) => (
          <text
            key={seg.label}
            className="stamp fill-ink-2 font-mono"
            x={((seg.from + seg.to) / 2) * BAR_PITCH}
            y={HEIGHT + 34}
            textAnchor="middle"
            fontSize={15}
            letterSpacing={1.5}
          >
            {seg.label}
          </text>
        ))}

        <g className="razor">
          <rect x={-1.25} y={-10} width={2.5} height={HEIGHT + 20} className="fill-accent" />
          <path d={`M -7 -10 L 7 -10 L 0 2 Z`} className="fill-accent" />
        </g>
      </svg>
    </figure>
  );
};
