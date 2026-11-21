import React from 'react';
import { Github, Moon, Sun } from 'lucide-react';
import { BRAND } from '../brand';
import { useTheme } from '../hooks/useTheme';
import { Route, routeHref } from '../hooks/useHashRoute';
import { Logo } from './Logo';

const NAV: { route: Route; label: string }[] = [
  { route: 'guide', label: 'Guide' },
  { route: 'capabilities', label: 'Capabilities' },
  { route: 'about', label: 'About' },
];

export const Header: React.FC<{ route: Route }> = ({ route }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href={routeHref('home')} className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <Logo />
          <span className="font-display text-2xl leading-none text-ink">{BRAND.name}</span>
        </a>

        <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map(({ route: r, label }) => (
            <a
              key={r}
              href={routeHref(r)}
              aria-current={route === r ? 'page' : undefined}
              className={`rounded-cut px-2 py-1.5 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm ${
                route === r ? 'bg-sunk text-ink' : 'text-ink-2 hover:bg-sunk hover:text-ink'
              }`}
            >
              {label}
            </a>
          ))}
          <a
            href={BRAND.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source code on GitHub"
            className="btn btn-quiet btn-icon ml-1"
          >
            <Github className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="btn btn-quiet btn-icon"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
};
