import { useCallback, useEffect, useState } from 'react';
import { BRAND } from '../brand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = `${BRAND.slug}-theme`;

function readStored(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null; // storage blocked (private mode, strict settings)
  }
}

function getInitialTheme(): Theme {
  return readStored() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggleTheme };
}
