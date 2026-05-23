'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const AppContext = createContext({
  theme: 'light',
  setTheme: () => {},
  mode: 'atelier',
  setMode: () => {},
  userState: 'guest',
  setUserState: () => {},
  bannerPhotoId: 'p010',
  setBannerPhotoId: () => {},
  heroPhotoId: 'auto',
  setHeroPhotoId: () => {},
  sideMenuOpen: false,
  setSideMenuOpen: () => {},
  toggleSideMenu: () => {},
  authUser: null,
  authLoading: true,
  signOut: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('atelier');
  const [userState, setUserState] = useState('guest');
  const [bannerPhotoId, setBannerPhotoId] = useState('p010');
  const [heroPhotoId, setHeroPhotoId] = useState('auto');
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const toggleSideMenu = () => setSideMenuOpen((v) => !v);

  // Supabase auth — null until first session check completes.
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gpa-prefs') || '{}');
      if (saved.theme) setTheme(saved.theme);
      if (saved.mode) setMode(saved.mode);
      if (saved.userState) setUserState(saved.userState);
      if (saved.bannerPhotoId) setBannerPhotoId(saved.bannerPhotoId);
      if (saved.heroPhotoId) setHeroPhotoId(saved.heroPhotoId);
    } catch {}
  }, []);

  // Subscribe to Supabase auth state. No-ops if env vars are missing.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setAuthLoading(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem('gpa-prefs', JSON.stringify({ theme, mode, userState, bannerPhotoId, heroPhotoId }));
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-mode', mode);
    }
  }, [theme, mode, userState, bannerPhotoId, heroPhotoId]);

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      mode, setMode,
      userState, setUserState,
      bannerPhotoId, setBannerPhotoId,
      heroPhotoId, setHeroPhotoId,
      sideMenuOpen, setSideMenuOpen, toggleSideMenu,
      authUser, authLoading, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}
