'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { getPhotographer } from '@/lib/data';
import { RoleRibbon } from './RoleRibbon';

const LINKS: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/hall-of-fame', label: 'Hall of Fame' },
  { to: '/for-customers', label: 'For Customers' },
  { to: '/about-ranking', label: 'Pulse Score' },
  { to: '/about', label: 'About' },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { userState, toggleSideMenu } = useApp();

  const isActive = (to: string) =>
    pathname === to || (to !== '/' && pathname.startsWith(to));

  const avatarSrc = getPhotographer(
    userState === 'customer' ? 'pim.travels' : 'kanthorn'
  )?.avatar;

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
            {LINKS.slice(0, 3).map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={'nav-link ' + (isActive(l.to) ? 'active' : '')}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <Link href="/" className="logo">
            <span className="mark">G</span>
            <span>GOGRAPHY</span>
            <small>Photo Awards</small>
          </Link>
          <div className="nav-right">
            {LINKS.slice(3).map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={'nav-link ' + (isActive(l.to) ? 'active' : '')}
              >
                {l.label}
              </Link>
            ))}
            <button className="nav-link" onClick={() => router.push('/search')}>
              Search
            </button>
            {userState === 'guest' ? (
              <Link href="/login" className="btn btn-sm ml-2">
                Sign in
              </Link>
            ) : (
              <Link href="/me" className="ml-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-tile overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
