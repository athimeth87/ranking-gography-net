'use client';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from './AppProvider';

const PRIMARY = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/hall-of-fame', label: 'Hall of Fame' },
  { to: '/photographers', label: 'Photographers' },
];

const CATEGORIES = [
  { to: '/explore/landscape', label: 'Landscape' },
  { to: '/explore/portrait', label: 'Portrait' },
  { to: '/explore/bw', label: 'Black & White' },
];

const CURATION = [
  { to: '/ambassadors', label: 'Ambassadors' },
  { to: '/about-ranking', label: 'Pulse Score' },
];

const ABOUT = [
  { to: '/for-customers', label: 'For Voyageurs' },
  { to: '/about', label: 'About' },
  { to: '/search', label: 'Search' },
];

export function SideMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { sideMenuOpen, setSideMenuOpen, theme, setTheme, userState } = useApp();

  // Close on ESC + lock body scroll while open
  useEffect(() => {
    if (!sideMenuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setSideMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sideMenuOpen, setSideMenuOpen]);

  const go = (to) => {
    setSideMenuOpen(false);
    router.push(to);
  };

  const isActive = (to) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sidemenu-backdrop ${sideMenuOpen ? 'is-open' : ''}`}
        onClick={() => setSideMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`sidemenu ${sideMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!sideMenuOpen}
      >
        <div className="sidemenu-inner">

          {/* Top chrome — 3 dots (decorative) + close */}
          <div className="sidemenu-chrome">
            <div className="sidemenu-dots">
              <span className="dot d1" />
              <span className="dot d2" />
              <span className="dot d3" />
            </div>
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

          {/* Identity */}
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

          {/* CTA — sign in or go to account */}
          {userState === 'guest' ? (
            <button className="sidemenu-cta" onClick={() => go('/login')}>
              <span>Sign in with Gmail</span>
              <span className="arr">→</span>
            </button>
          ) : (
            <button className="sidemenu-cta" onClick={() => go('/me')}>
              <span>Open your dashboard</span>
              <span className="arr">→</span>
            </button>
          )}

          {/* Group: Primary */}
          <Group title="Browse">
            {PRIMARY.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={l.label} />
            ))}
          </Group>

          {/* Group: Categories */}
          <Group title="Categories">
            {CATEGORIES.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={l.label} />
            ))}
          </Group>

          {/* Group: Curation */}
          <Group title="Curation">
            {CURATION.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={l.label} />
            ))}
          </Group>

          {/* Group: About + utility */}
          <Group title="About">
            {ABOUT.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={l.label} />
            ))}
          </Group>

          {/* Footer — theme + version */}
          <div className="sidemenu-footer">
            <div className="sidemenu-theme">
              <span className="caps" style={{ opacity: 0.55 }}>Theme</span>
              <div className="sidemenu-theme-toggle">
                <button
                  className={theme === 'light' ? 'is-on' : ''}
                  onClick={() => setTheme('light')}
                >
                  Light
                </button>
                <button
                  className={theme === 'dark' ? 'is-on' : ''}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>
            <div className="sidemenu-version mono">GOGRAPHY PHOTO AWARDS · 2026</div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Group({ title, children }) {
  return (
    <div className="sidemenu-group">
      <div className="sidemenu-group-title caps">{title}</div>
      <div className="sidemenu-group-rows">{children}</div>
    </div>
  );
}

function MenuRow({ label, active, onClick }) {
  return (
    <button className={`sidemenu-row ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="sidemenu-row-label">{label}</span>
      <span className="sidemenu-row-arr">→</span>
    </button>
  );
}
