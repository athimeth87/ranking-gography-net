'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { RoleRibbon } from './RoleRibbon';
import { NotificationsBell } from './NotificationsBell';

const CENTER_LINKS: { to: string; label: string }[] = [
  { to: '/hall-of-fame', label: 'Hall of Fame' },
  { to: '/photographers', label: 'Photographers' },
  { to: '/for-customers', label: 'For Voyageurs' },
  { to: '/about', label: 'About' },
];

export function Nav() {
  const pathname = usePathname();
  const { authUser, toggleSideMenu } = useApp();

  const isActive = (to: string) =>
    pathname === to || (to !== '/' && pathname.startsWith(to));

  const avatarSrc = authUser?.user_metadata?.avatar_url || '';
  const displayName = authUser?.user_metadata?.full_name || authUser?.email || 'User';

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <RoleRibbon />
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <button
              className="nav-toggle"
              onClick={toggleSideMenu}
              aria-label="Open menu"
              title="Menu"
            >
              <svg viewBox="0 0 18 18" stroke="currentColor" strokeWidth="1.4" fill="none">
                <line x1="2" y1="5" x2="16" y2="5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13" x2="16" y2="13" />
              </svg>
            </button>
            <Link href="/" className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.png" alt="" aria-hidden className="logo-img" />
              <span>GOGRAPHY</span>
            </Link>
          </div>

          <div className="nav-center">
            {CENTER_LINKS.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={'nav-link ' + (isActive(l.to) ? 'active' : '')}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="nav-right">
            {authUser && <NotificationsBell />}
            {!authUser ? (
              <Link href="/login" className="nav-link nav-signin whitespace-nowrap">
                Sign in
              </Link>
            ) : (
              <Link href="/me" className="ml-1 flex items-center">
                <div className="w-7 h-7 rounded-full bg-tile overflow-hidden flex items-center justify-center border border-rule">
                  {avatarSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarSrc}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="caps text-[10px] opacity-65">{displayName.charAt(0)}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
