'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { getPhotographer } from '@/lib/data';
import { useTranslations } from 'next-intl';

interface NavLink { to: string; labelKey: string }
interface GroupProps { title: string; children: React.ReactNode }
interface MenuRowProps { label: string; active: boolean; onClick: () => void }

const DISCOVER: NavLink[] = [
  { to: '/hall-of-fame', labelKey: 'hall_of_fame' },
  { to: '/photographers', labelKey: 'photographers' },
  { to: '/ambassadors', labelKey: 'ambassadors' },
];

const CATEGORIES: NavLink[] = [
  { to: '/explore/landscape', labelKey: 'landscape' },
  { to: '/explore/portrait', labelKey: 'portrait' },
  { to: '/explore/bw', labelKey: 'bw' },
];

const ABOUT: NavLink[] = [
  { to: '/about-ranking', labelKey: 'ranking' },
  { to: '/about', labelKey: 'about' },
  { to: '/for-customers', labelKey: 'for_voyageurs' },
];

export function SideMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('SideMenu');
  const { sideMenuOpen, setSideMenuOpen, theme, setTheme, authUser, signOut } = useApp();

  // Close on ESC + lock body scroll while open
  useEffect(() => {
    if (!sideMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSideMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sideMenuOpen, setSideMenuOpen]);

  const go = (to: string) => {
    setSideMenuOpen(false);
    router.push(to);
  };

  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  const avatarSrc = authUser?.user_metadata?.avatar_url || '';
  const displayName = authUser?.user_metadata?.full_name || authUser?.email || t('registered_user');

  if (pathname?.startsWith('/admin')) {
    return null;
  }

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
        <div className="sidemenu-inner no-scrollbar">

          <div className="sidemenu-identity">
            <div className="sidemenu-avatar" style={authUser && avatarSrc ? { backgroundImage: `url(${avatarSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--rule)' } : {}}>
              {!authUser ? (
                <span className="caps text-[10px] opacity-65">G</span>
              ) : (
                !avatarSrc && <span className="caps text-[10px] opacity-65">{displayName.charAt(0)}</span>
              )}
            </div>
            <div className="sidemenu-identity-meta">
              <div className="sidemenu-identity-name">
                {!authUser ? t('guest') : displayName}
              </div>
              <div className="sidemenu-identity-sub mono">
                {!authUser ? t('not_signed_in') : t('authenticated')}
              </div>
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

          {!authUser ? (
            <button className="sidemenu-cta" onClick={() => go('/login')}>
              <span>{t('sign_in')}</span>
              <span className="arr">→</span>
            </button>
          ) : (
            <button className="sidemenu-cta" onClick={() => go('/me')}>
              <span>{t('open_dashboard')}</span>
              <span className="arr">→</span>
            </button>
          )}

          <Group title={t('discover')}>
            {DISCOVER.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={t(l.labelKey)} />
            ))}
          </Group>

          <Group title={t('categories')}>
            {CATEGORIES.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={t(l.labelKey)} />
            ))}
          </Group>

          <Group title={t('about')}>
            {ABOUT.map((l) => (
              <MenuRow key={l.to} active={isActive(l.to)} onClick={() => go(l.to)} label={t(l.labelKey)} />
            ))}
          </Group>

          {/* Footer — theme + version */}
          <div className="sidemenu-footer">
            <div className="sidemenu-theme">
              <span className="caps opacity-55">{t('theme')}</span>
              <div className="sidemenu-theme-toggle">
                <button
                  className={theme === 'light' ? 'is-on' : ''}
                  onClick={() => setTheme('light')}
                >
                  {t('light')}
                </button>
                <button
                  className={theme === 'dark' ? 'is-on' : ''}
                  onClick={() => setTheme('dark')}
                >
                  {t('dark')}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="sidemenu-version mono">GOGRAPHY RANKING · 2026</div>
              {authUser && (
                <button
                  className="text-[10px] uppercase tracking-[0.18em] opacity-55 hover:opacity-100"
                  onClick={() => { signOut?.(); setSideMenuOpen(false); }}
                >
                  {t('sign_out')}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Group({ title, children }: GroupProps) {
  return (
    <div className="sidemenu-group">
      <div className="sidemenu-group-title caps">{title}</div>
      <div className="sidemenu-group-rows">{children}</div>
    </div>
  );
}

function MenuRow({ label, active, onClick }: MenuRowProps) {
  return (
    <button className={`sidemenu-row ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="sidemenu-row-label">{label}</span>
      <span className="sidemenu-row-arr">→</span>
    </button>
  );
}
