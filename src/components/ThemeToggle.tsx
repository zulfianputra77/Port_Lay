import React from 'react';
import { Moon, Sun } from 'lucide-react';

export type PortalTheme = 'light' | 'dark';

interface ThemeToggleProps {
  theme: PortalTheme;
  onChangeTheme: (theme: PortalTheme) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onChangeTheme }) => {
  return (
    <div
      role="group"
      aria-label="Pilih mode tampilan Light atau Night"
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
    >
      <button
        type="button"
        onClick={() => onChangeTheme('light')}
        aria-pressed={theme === 'light'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          theme === 'light'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeTheme('dark')}
        aria-pressed={theme === 'dark'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          theme === 'dark'
            ? 'bg-slate-900 text-white shadow-xs border border-slate-700'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
        <span>Night</span>
      </button>
    </div>
  );
};
