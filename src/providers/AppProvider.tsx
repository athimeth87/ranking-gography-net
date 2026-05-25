'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Mode, Theme, UserState } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { GlobalUploadModal } from '@/components/shared/GlobalUploadModal';

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
  authUser?: any;
  signOut?: () => void;
  isUploadModalOpen: boolean;
  setUploadModalOpen: (v: boolean) => void;
}

const DEFAULTS: AppPrefs = { theme: 'light', mode: 'atelier', userState: 'guest', bannerPhotoId: 'p010', heroPhotoId: 'auto' };

function clearAllUserData() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch (e) {
    console.error('Failed to clear web storage:', e);
  }
  // Wipe Supabase auth cookies (sb-*) at every parent path. Belt-and-suspenders
  // alongside supabase.auth.signOut() — useful when signOut fails or partial.
  try {
    document.cookie.split(';').forEach((raw) => {
      const eq = raw.indexOf('=');
      const name = (eq > -1 ? raw.slice(0, eq) : raw).trim();
      if (!name.startsWith('sb-')) return;
      const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
      const host = window.location.hostname;
      document.cookie = `${name}=; ${expire}; path=/`;
      document.cookie = `${name}=; ${expire}; path=/; domain=${host}`;
      document.cookie = `${name}=; ${expire}; path=/; domain=.${host}`;
    });
  } catch (e) {
    console.error('Failed to clear auth cookies:', e);
  }
}

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
  const [authUser, setAuthUser] = useState<any>(null);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.setAttribute('data-mode', prefs.mode);
  }, [prefs.theme, prefs.mode]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setAuthUser(null);
      clearAllUserData();
      // Full reload guarantees middleware re-evaluates protected routes and
      // server components rehydrate without the stale session.
      window.location.replace('/');
    }
  };

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
        authUser,
        signOut: handleSignOut,
        isUploadModalOpen,
        setUploadModalOpen,
      }}
    >
      {children}
      <GlobalUploadModal />
    </AppContext.Provider>
  );
}
