import { describe, expect, it } from 'vitest';
import { shouldIgnoreShortcut } from '../src/hooks/useSeekShortcuts';

const press = (tag: string, code: string, attrs: Record<string, string> = {}, mods = {}) => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return shouldIgnoreShortcut({ code, target: el, ctrlKey: false, metaKey: false, ...mods });
};

describe('shouldIgnoreShortcut', () => {
  it('lets Space and arrows control the player from the page body', () => {
    expect(press('div', 'Space')).toBe(false);
    expect(press('div', 'ArrowLeft')).toBe(false);
  });
  it('never hijacks typing', () => {
    expect(press('input', 'Space')).toBe(true);
    expect(press('textarea', 'ArrowLeft')).toBe(true);
    expect(press('select', 'ArrowRight')).toBe(true);
  });
  it('Space on a focused button presses the button, not play/pause', () => {
    expect(press('button', 'Space')).toBe(true);
    expect(press('a', 'Space')).toBe(true);
  });
  it('but arrows on a button still step the playhead', () => {
    expect(press('button', 'ArrowRight')).toBe(false);
  });
  it('arrows belong to tabs and sliders', () => {
    expect(press('button', 'ArrowRight', { role: 'tab' })).toBe(true);
    expect(press('div', 'ArrowRight', { role: 'slider' })).toBe(true);
  });
  it('leaves browser shortcuts alone', () => {
    expect(press('div', 'Space', {}, { ctrlKey: true })).toBe(true);
    expect(press('div', 'ArrowLeft', {}, { metaKey: true })).toBe(true);
  });
});
