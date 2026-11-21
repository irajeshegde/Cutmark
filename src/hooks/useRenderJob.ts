import { useCallback, useEffect, useRef, useState } from 'react';
import { JobState, OutputBundle } from '../types';
import { AbortError } from '../services/ffmpegService';

export interface JobContext {
  signal: AbortSignal;
  /** Report progress; `message` is also appended to the activity log. */
  report: (percent: number, message: string) => void;
}

const IDLE: JobState = { status: 'idle', percent: 0, message: '', logs: [], bundle: null };
const MAX_LOG_LINES = 40;

/**
 * Runs one render job (Editor export or Equal Split) and tracks its progress,
 * result, error and cancellation. The finished bundle is held until reset() so
 * the result view can offer playback and a single download action.
 */
export function useRenderJob() {
  const [state, setState] = useState<JobState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async (task: (ctx: JobContext) => Promise<OutputBundle>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'running', percent: 1, message: 'Starting…', logs: ['Starting…'], bundle: null });

    const report = (percent: number, message: string) => {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        percent: Math.max(prev.percent, Math.min(100, Math.round(percent))),
        message,
        logs: prev.logs[prev.logs.length - 1] === message ? prev.logs : [...prev.logs, message].slice(-MAX_LOG_LINES),
      }));
    };

    try {
      const bundle = await task({ signal: controller.signal, report });
      if (controller.signal.aborted) throw new AbortError();
      setState((prev) => ({ ...prev, status: 'done', percent: 100, message: 'Done.', bundle }));
    } catch (err) {
      if (err instanceof AbortError || controller.signal.aborted) {
        setState((prev) => ({ ...prev, status: 'cancelled', message: 'Cancelled.' }));
        return;
      }
      const message = (err as Error).message || 'Something went wrong while processing the audio.';
      console.error('Render job failed:', err);
      setState((prev) => ({ ...prev, status: 'error', error: message, logs: [...prev.logs, `Error: ${message}`].slice(-MAX_LOG_LINES) }));
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(IDLE);
  }, []);

  return { job: state, run, cancel, reset };
}
