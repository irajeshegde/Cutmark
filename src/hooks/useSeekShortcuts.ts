import { useEffect, useRef } from 'react';
import { COARSE_STEP_SEC, DEFAULT_STEP_SEC, FINE_STEP_SEC } from '../utils/constants';

/**
 * Decides whether a key press belongs to the focused element instead of the
 * player: typing in fields, Space/Enter on buttons and links (so keyboard users
 * can still press them), arrow keys on sliders and tabs.
 */
export function shouldIgnoreShortcut(e: Pick<KeyboardEvent, 'code' | 'target' | 'ctrlKey' | 'metaKey'>): boolean {
  if (e.ctrlKey || e.metaKey) return true;
  const el = e.target as HTMLElement | null;
  if (!el || !el.tagName) return false;

  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;

  const role = el.getAttribute('role');
  if (e.code === 'Space') return tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || role === 'tab' || role === 'button';
  return role === 'tab' || role === 'slider';
}

/**
 * Space = play/pause, Left/Right = step, Shift+arrow = coarse step, Alt+arrow = fine step.
 * Handlers are read through a ref so the listener is attached once.
 */
export function useSeekShortcuts(onTogglePlay: () => void, onStep: (deltaSec: number) => void) {
  const handlers = useRef({ onTogglePlay, onStep });
  handlers.current = { onTogglePlay, onStep };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlers.current.onTogglePlay();
        return;
      }

      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        const direction = e.code === 'ArrowRight' ? 1 : -1;
        const magnitude = e.shiftKey ? COARSE_STEP_SEC : e.altKey ? FINE_STEP_SEC : DEFAULT_STEP_SEC;
        handlers.current.onStep(direction * magnitude);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
