'use client';

import { useEffect, useState } from 'react';

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('mutfak_theme', dark ? 'dark' : 'light');
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('mutfak_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDark(isDark);
    applyTheme(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-2.5 text-xs text-white/50 hover:text-white/80 transition-colors py-1 group"
      aria-label={dark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
      role="switch"
      aria-checked={dark}
    >
      <span className={`shrink-0 ${animating ? 'animate-icon-swap' : ''}`}>
        {dark ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </span>
      <span className="hidden lg:inline">{dark ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
      {/* Toggle track */}
      <span className="hidden lg:flex ml-auto shrink-0 w-7 h-4 rounded-full items-center px-0.5 transition-colors duration-200" style={{ backgroundColor: dark ? '#66aca9' : 'rgba(255,255,255,0.2)' }}>
        <span className="w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: dark ? 'translateX(12px)' : 'translateX(0)' }} />
      </span>
    </button>
  );
}
