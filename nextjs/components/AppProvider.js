'use client';
import { createContext, useContext, useEffect, useState } from 'react';

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
    <AppContext.Provider value={{ theme, setTheme, mode, setMode, userState, setUserState, bannerPhotoId, setBannerPhotoId, heroPhotoId, setHeroPhotoId, sideMenuOpen, setSideMenuOpen, toggleSideMenu }}>
      {children}
    </AppContext.Provider>
  );
}
