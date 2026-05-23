'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Mode, Theme, UserState } from '@/lib/types';

interface AppPrefs {
  theme: Theme;
  mode: Mode;
  userState: UserState;
  bannerPhotoId: string;
  heroPhotoId: string;
}

interface AppContextValue extends AppPrefs {
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
  setUserState: (u: UserState) => void;
  setBannerPhotoId: (id: string) => void;
  setHeroPhotoId: (id: string) => void;
  sideMenuOpen: boolean;
  setSideMenuOpen: (v: boolean) => void;
  toggleSideMenu: () => void;
}

const DEFAULTS: AppPrefs = { theme: 'light', mode: 'atelier', userState: 'guest', bannerPhotoId: 'p010', heroPhotoId: 'auto' };

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useLocalStorage<AppPrefs>('gpa-prefs', DEFAULTS);
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(false);
  const patch = (p: Partial<AppPrefs>) => setPrefs({ ...prefs, ...p });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.setAttribute('data-mode', prefs.mode);
  }, [prefs.theme, prefs.mode]);

  return (
    <AppContext.Provider
      value={{
        ...prefs,
        setTheme: (theme) => patch({ theme }),
        setMode: (mode) => patch({ mode }),
        setUserState: (userState) => patch({ userState }),
        setBannerPhotoId: (bannerPhotoId) => patch({ bannerPhotoId }),
        setHeroPhotoId: (heroPhotoId) => patch({ heroPhotoId }),
        sideMenuOpen,
        setSideMenuOpen,
        toggleSideMenu: () => setSideMenuOpen((v) => !v),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
