'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from './AppProvider';
import { PHOTOGRAPHERS } from '@/lib/data';
import { VoyageurMark, CrownIcon } from './Icons';

const LINKS = [
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
  const { userState } = useApp();
  const isActive = (to) => pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <>
      {userState === 'customer' && (
        <div style={{ background: 'var(--fg)', color: 'var(--bg)', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <VoyageurMark size={8} />
            <span>Voyageur · Pim Asanachinda</span>
            <span style={{ opacity: .6, marginLeft: 12, letterSpacing: '.1em' }} className="th">— ส่งภาพเข้าหมวด Voyageurs · ฤดูกาล Spring 2026</span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ opacity: .6, fontFamily: 'var(--mono)' }}>TODAY 0/1 · RESETS 00:00 ICT</span>
            <Link href="/upload" style={{ borderBottom: '1px solid var(--bg)', paddingBottom: 1 }}>Upload photo →</Link>
            <Link href="/for-customers" style={{ opacity: .7 }}>Programme</Link>
          </div>
        </div>
      )}
      {userState === 'photographer' && (
        <div style={{ background: 'var(--cream)', color: 'var(--fg)', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid var(--rule)' }}>
          <div>★ Photographer · Kanthorn Aroonrat</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <span style={{ opacity: .55, fontFamily: 'var(--mono)' }}>TODAY 0/1</span>
            <Link href="/upload" style={{ borderBottom: '1px solid var(--fg)', paddingBottom: 1 }}>Upload</Link>
          </div>
        </div>
      )}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            {LINKS.slice(0, 3).map(l => (
              <Link key={l.to} href={l.to} className={'nav-link ' + (isActive(l.to) ? 'active' : '')}>{l.label}</Link>
            ))}
          </div>
          <Link href="/" className="logo">
            <span className="mark">G</span>
            <span>GOGRAPHY</span>
            <small>Photo Awards</small>
          </Link>
          <div className="nav-right">
            {LINKS.slice(3).map(l => (
              <Link key={l.to} href={l.to} className={'nav-link ' + (isActive(l.to) ? 'active' : '')}>{l.label}</Link>
            ))}
            <button className="nav-link" onClick={() => router.push('/search')}>Search</button>
            {userState === 'guest' ? (
              <Link href="/login" className="btn btn-sm" style={{ marginLeft: 8 }}>Sign in</Link>
            ) : (
              <Link href="/me" style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden' }}>
                  <img src={PHOTOGRAPHERS.find(p => p.username === (userState === 'customer' ? 'pim.travels' : 'kanthorn'))?.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
