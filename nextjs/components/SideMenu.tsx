'use client';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from './AppProvider';

// ---------- Icons (inline so menu is self-contained) ----------
const Icon = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const HomeIcon = () => <Icon><path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z" /></Icon>;
const ExploreIcon = () => <Icon><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></Icon>;
const TrophyIcon = () => <Icon><path d="M8 4 H16 V11 A4 4 0 0 1 8 11 Z" /><path d="M4 6 H8 V10 A2 2 0 0 1 4 10 Z" /><path d="M16 6 H20 V10 A2 2 0 0 1 16 10 Z" /><path d="M10 16 H14 V20 H10 Z" /><path d="M7 20 H17" /></Icon>;
const PeopleIcon = () => <Icon><circle cx="9" cy="9" r="3" /><path d="M3 19 C3 15 6 13 9 13 C12 13 15 15 15 19" /><circle cx="17" cy="8" r="2.5" /><path d="M14.5 14 C18 14 21 16 21 19" /></Icon>;
const MountainIcon = () => <Icon><path d="M3 19 L9 9 L13 14 L16 10 L21 19 Z" /><circle cx="17" cy="6" r="1.5" /></Icon>;
const PortraitIcon = () => <Icon><circle cx="12" cy="9" r="3.5" /><path d="M5 20 C5 16 8 14 12 14 C16 14 19 16 19 20" /></Icon>;
const ContrastIcon = () => <Icon><circle cx="12" cy="12" r="8" /><path d="M12 4 V20 A8 8 0 0 0 12 4 Z" fill="currentColor" /></Icon>;
const StarIcon = () => <Icon><path d="M12 3 L14.5 9 L21 9.5 L16 14 L17.5 20.5 L12 17 L6.5 20.5 L8 14 L3 9.5 L9.5 9 Z" /></Icon>;
const DiamondIcon = () => <Icon><path d="M12 3 L20 12 L12 21 L4 12 Z" /></Icon>;
const InfoIcon = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 8 L12 8.1" /><path d="M12 11 L12 17" /></Icon>;
const SearchIcon = () => <Icon><circle cx="11" cy="11" r="6" /><path d="M16 16 L21 21" /></Icon>;
const LogoutIcon = () => <Icon><path d="M14 4 H6 V20 H14" /><path d="M11 12 H21" /><path d="M18 9 L21 12 L18 15" /></Icon>;
const LoginIcon = () => <Icon><path d="M10 4 H18 V20 H10" /><path d="M3 12 H13" /><path d="M6 9 L3 12 L6 15" /></Icon>;
const MoonIcon = () => <Icon size={14}><path d="M20 14 A8 8 0 0 1 10 4 A8 8 0 1 0 20 14 Z" /></Icon>;
const SunIcon = () => <Icon size={14}><circle cx="12" cy="12" r="4" /><path d="M12 2 V4 M12 20 V22 M2 12 H4 M20 12 H22 M5 5 L6.5 6.5 M17.5 17.5 L19 19 M5 19 L6.5 17.5 M17.5 6.5 L19 5" /></Icon>;

// ---------- Menu structure ----------
const SECTIONS = [
  {
    title: 'Browse',
    items: [
      { to: '/', label: 'Home', icon: HomeIcon },
      { to: '/explore', label: 'Explore', icon: ExploreIcon },
      { to: '/hall-of-fame', label: 'Hall of Fame', icon: TrophyIcon },
      { to: '/photographers', label: 'Photographers', icon: PeopleIcon },
    ],
  },
  {
    title: 'Categories',
    items: [
      { to: '/explore/landscape', label: 'Landscape', icon: MountainIcon },
      { to: '/explore/portrait', label: 'Portrait', icon: PortraitIcon },
      { to: '/explore/bw', label: 'Black & White', icon: ContrastIcon },
    ],
  },
  {
    title: 'Curation',
    items: [
      { to: '/ambassadors', label: 'Ambassadors', icon: StarIcon },
    ],
  },
  {
    title: 'About',
    items: [
      { to: '/for-customers', label: 'For Voyageurs', icon: DiamondIcon },
      { to: '/about', label: 'About', icon: InfoIcon },
      { to: '/search', label: 'Search', icon: SearchIcon },
    ],
  },
];

export function SideMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { sideMenuOpen, setSideMenuOpen, theme, setTheme, userState } = useApp();

  // Close on ESC — leave body scroll alone so the page underneath stays scrollable
  useEffect(() => {
    if (!sideMenuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setSideMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sideMenuOpen, setSideMenuOpen]);

  const go = (to) => {
    setSideMenuOpen(false);
    router.push(to);
  };

  const isActive = (to) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <>
      <div
        className={`sidemenu-backdrop ${sideMenuOpen ? 'is-open' : ''}`}
        onClick={() => setSideMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`sidemenu ${sideMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!sideMenuOpen}
      >
        <div className="sidemenu-inner">

          {/* Top chrome — brand logo + close */}
          <div className="sidemenu-chrome">
            <button
              className="sidemenu-brand"
              onClick={() => go('/')}
              aria-label="GOGRAPHY home"
            >
              <span className="sidemenu-brand-mark" />
              <span className="sidemenu-brand-name">GOGRAPHY</span>
              <span className="sidemenu-brand-sub mono">Photo Awards</span>
            </button>
            <button
              className="sidemenu-close"
              onClick={() => setSideMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>

          {/* Identity card */}
          <div className="sidemenu-identity">
            <div className="sidemenu-avatar">
              {userState === 'guest' ? (
                <span className="caps" style={{ fontSize: 10, opacity: 0.65 }}>G</span>
              ) : (
                <img src="https://picsum.photos/seed/av-kanthorn/120/120" alt="" />
              )}
            </div>
            <div className="sidemenu-identity-meta">
              <div className="sidemenu-identity-name">
                {userState === 'guest' ? 'Guest' : userState === 'customer' ? 'Pim Asanachinda' : userState === 'photographer' ? 'Kanthorn Aroonrat' : 'Pim Asanachinda'}
              </div>
              <div className="sidemenu-identity-sub mono">
                {userState === 'guest' ? 'Not signed in' : userState === 'customer' ? '◇ VOYAGEUR' : userState === 'photographer' ? '★ PHOTOGRAPHER' : 'REGISTERED'}
              </div>
            </div>
          </div>

          {/* Menu sections — scrollable */}
          <div className="sidemenu-scroll">
            {SECTIONS.map((section) => (
              <div key={section.title} className="sidemenu-group">
                <div className="sidemenu-group-title caps">{section.title}</div>
                <div className="sidemenu-group-rows">
                  {section.items.map((item) => {
                    const Ico = item.icon;
                    const active = isActive(item.to);
                    return (
                      <button
                        key={item.to}
                        className={`sidemenu-row ${active ? 'is-active' : ''}`}
                        onClick={() => go(item.to)}
                      >
                        <span className="sidemenu-row-icon"><Ico /></span>
                        <span className="sidemenu-row-label">{item.label}</span>
                        {active && <span className="sidemenu-row-pin" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Auth row — sign in / logout */}
            <div className="sidemenu-group">
              <div className="sidemenu-group-rows">
                {userState === 'guest' ? (
                  <button className="sidemenu-row" onClick={() => go('/login')}>
                    <span className="sidemenu-row-icon"><LoginIcon /></span>
                    <span className="sidemenu-row-label">Sign in</span>
                  </button>
                ) : (
                  <button className="sidemenu-row" onClick={() => go('/me')}>
                    <span className="sidemenu-row-icon"><LogoutIcon /></span>
                    <span className="sidemenu-row-label">Your dashboard</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer — theme toggle row + version */}
          <div className="sidemenu-footer">
            <button
              className="sidemenu-row sidemenu-theme-row"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <span className="sidemenu-row-icon">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </span>
              <span className="sidemenu-row-label">
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </span>
              <span className={`sidemenu-switch ${theme === 'dark' ? 'is-on' : ''}`}>
                <span className="sidemenu-switch-knob" />
              </span>
            </button>
            <div className="sidemenu-version mono">GOGRAPHY PHOTO AWARDS · 2026</div>
          </div>
        </div>
      </aside>
    </>
  );
}
