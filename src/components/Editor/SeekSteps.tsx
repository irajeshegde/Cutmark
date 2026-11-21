import React from 'react';
import { COARSE_STEP_SEC, DEFAULT_STEP_SEC, FINE_STEP_SEC } from '../../utils/constants';

interface SeekStepsProps {
  onStep: (deltaSec: number) => void;
}

const STEPS = [COARSE_STEP_SEC, DEFAULT_STEP_SEC, FINE_STEP_SEC];

export function stepLabel(step: number): string {
  return step < 0.1 ? `${Math.round(step * 1000)}ms` : step < 1 ? `${Math.round(step * 1000)}ms` : `${step}s`;
}

function modifier(step: number): string {
  return step === FINE_STEP_SEC ? 'Alt+' : step === COARSE_STEP_SEC ? 'Shift+' : '';
}

/** Nudge buttons: -1s -100ms -10ms | +10ms +100ms +1s. */
export const SeekSteps: React.FC<SeekStepsProps> = ({ onStep }) => (
  <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Nudge the playhead">
    {[...STEPS].reverse().map((step) => (
      <button
        key={`back-${step}`}
        type="button"
        onClick={() => onStep(-step)}
        title={`Back ${stepLabel(step)} (${modifier(step)}←)`}
        aria-label={`Back ${stepLabel(step)}`}
        className="btn btn-sm font-mono"
      >
        −{stepLabel(step)}
      </button>
    ))}
    <span className="mx-0.5 h-5 w-px bg-line-strong" aria-hidden="true" />
    {STEPS.map((step) => (
      <button
        key={`fwd-${step}`}
        type="button"
        onClick={() => onStep(step)}
        title={`Forward ${stepLabel(step)} (${modifier(step)}→)`}
        aria-label={`Forward ${stepLabel(step)}`}
        className="btn btn-sm font-mono"
      >
        +{stepLabel(step)}
      </button>
    ))}
  </div>
);
