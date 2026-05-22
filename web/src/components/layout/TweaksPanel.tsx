'use client';
import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { cn } from '@/lib/utils';
import type { Theme, Mode, UserState } from '@/lib/types';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const MODES: { label: string; value: Mode }[] = [
  { label: 'Atelier', value: 'atelier' },
  { label: 'Editorial', value: 'editorial' },
];

const PERSONAS: { label: string; value: UserState }[] = [
  { label: 'Guest', value: 'guest' },
  { label: 'User', value: 'user' },
  { label: 'Customer', value: 'customer' },
  { label: 'Photographer', value: 'photographer' },
];

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, mode, setMode, userState, setUserState } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      {open && (
        <div className="bg-[var(--bg)] border border-[var(--rule)] rounded-none p-4 flex flex-col gap-4 w-52">
          {/* Theme */}
          <div>
            <p className="caps text-[var(--fg-faint)] mb-2">Theme</p>
            <div className="flex gap-1">
              {THEMES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'btn btn-sm flex-1',
                    theme === value
                      ? 'bg-[var(--fg)] text-[var(--bg)]'
                      : 'border-[var(--rule)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <p className="caps text-[var(--fg-faint)] mb-2">Mode</p>
            <div className="flex gap-1">
              {MODES.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={cn(
                    'btn btn-sm flex-1',
                    mode === value
                      ? 'bg-[var(--fg)] text-[var(--bg)]'
                      : 'border-[var(--rule)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Persona */}
          <div>
            <p className="caps text-[var(--fg-faint)] mb-2">Persona</p>
            <div className="flex flex-col gap-1">
              {PERSONAS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setUserState(value)}
                  className={cn(
                    'btn btn-sm w-full justify-start',
                    userState === value
                      ? 'bg-[var(--fg)] text-[var(--bg)]'
                      : 'border-[var(--rule)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-sm"
        aria-label="Toggle tweaks panel"
      >
        <span className="caps">{open ? 'Close' : 'Tweaks'}</span>
      </button>
    </div>
  );
}
