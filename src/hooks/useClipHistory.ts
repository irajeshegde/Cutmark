import { useCallback, useState } from 'react';
import { EditorClip } from '../types';

const MAX_UNDO_DEPTH = 30;

interface State {
  clips: EditorClip[];
  history: EditorClip[][];
}

export function relabel(list: EditorClip[]): EditorClip[] {
  return list.map((c, i) => ({ ...c, label: `part${String(i + 1).padStart(2, '0')}` }));
}

/**
 * Clip list with undo. One state object (not two) so undo is a pure update —
 * the previous version called setClips from inside a setState updater, which
 * React StrictMode runs twice.
 */
export function useClipHistory() {
  const [state, setState] = useState<State>({ clips: [], history: [] });

  /** Apply a change and remember the previous list for undo. */
  const commit = useCallback((update: (prev: EditorClip[]) => EditorClip[]) => {
    setState((s) => {
      const next = update(s.clips);
      if (next === s.clips) return s;
      return { clips: next, history: [...s.history, s.clips].slice(-MAX_UNDO_DEPTH) };
    });
  }, []);

  /** Apply a change without an undo step (e.g. dragging a gain slider). */
  const patch = useCallback((update: (prev: EditorClip[]) => EditorClip[]) => {
    setState((s) => ({ ...s, clips: update(s.clips) }));
  }, []);

  const undo = useCallback(() => {
    setState((s) => (s.history.length === 0 ? s : { clips: s.history[s.history.length - 1], history: s.history.slice(0, -1) }));
  }, []);

  const clear = useCallback(() => setState({ clips: [], history: [] }), []);

  return { clips: state.clips, canUndo: state.history.length > 0, commit, patch, undo, clear };
}
