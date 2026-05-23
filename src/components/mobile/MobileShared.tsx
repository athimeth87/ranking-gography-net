// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PHOTOGRAPHERS, voyageurUsernames } from '@/lib/data';

const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function MobileNav() {
  const { theme, setTheme, toggleSideMenu, authUser } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';
  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : 'GO';
  const onToggleTheme = () => setTheme(dark ? 'light' : 'dark');
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: dark ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    }}>
      <div style={{
        height: 56, padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <button onClick={toggleSideMenu} aria-label="Menu" style={{
          width: 44, height: 44, padding: 0, background: 'transparent',
          border: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginLeft: -8, color: c,
        }}>
          <svg width="20" height="14" viewBox="0 0 20 14">
            <rect y="0" width="20" height="1.5" fill={c} />
            <rect y="6" width="20" height="1.5" fill={c} />
            <rect y="12" width="14" height="1.5" fill={c} />
          </svg>
        </button>
        <Link href="/" className="wordmark" style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 20, letterSpacing: '-0.01em', color: c, textDecoration: 'none',
        }}>GOGRAPHY</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onToggleTheme} aria-label="Toggle theme" style={{
            width: 44, height: 28, padding: 0,
            border: `1px solid ${c}`, background: 'transparent',
            display: 'inline-flex', position: 'relative', cursor: 'pointer',
          }}>
            <span style={{
              position: 'absolute', top: 2, bottom: 2,
              left: dark ? 'calc(50% + 1px)' : 2,
              width: 'calc(50% - 4px)', background: c, transition: 'left .2s',
            }} />
            <span style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? c : '#fff', fontSize: 10, zIndex: 1,
            }}>☀</span>
            <span style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? '#000' : c, fontSize: 9, zIndex: 1,
            }}>☾</span>
          </button>
          <Link href={authUser ? '/me' : '/login'} style={{
            width: 32, height: 32, marginLeft: 4,
            background: dark ? '#222' : '#f1efe9',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600,
            color: c, border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
            textDecoration: 'none',
          }}>{initials}</Link>
        </div>
      </div>
    </header>
  );
}

export function MobileFooter() {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const cols = [
    { h: 'Awards',    items: [['Hall of Fame','/hall-of-fame'], ['Season 04','/explore'], ['Voyageurs','/photographers/voyageurs'], ['Ambassadors','/ambassadors']] },
    { h: 'Discover',  items: [['Explore','/explore'], ['Photographers','/photographers'], ['Categories','/explore'], ['Search','/search']] },
    { h: 'Customers', items: [['Cashback','/for-customers'], ['Rewards','/for-customers'], ['Rules','/for-customers'], ['How it works','/for-customers']] },
    { h: 'About',     items: [['Mission','/about'], ['Team','/about'], ['Press','/about'], ['Contact','/about']] },
  ];
  return (
    <footer style={{
      background: dark ? '#000' : 'var(--cream)',
      color: dark ? '#fff' : 'var(--fg)',
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'var(--rule)'}`,
    }}>
      <div style={{ padding: '40px 16px 24px' }}>
        <div className="wordmark" style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 28,
          letterSpacing: '-0.01em', marginBottom: 4,
        }}>GOGRAPHY</div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6 }}>
          Photo Awards · Season 04
        </div>
        <p className="th" style={{ marginTop: 18, fontSize: 13, lineHeight: 1.6, opacity: 0.78, maxWidth: '34ch' }}>
          เวทีรางวัลภาพถ่ายไทยรายฤดูกาล สำหรับช่างภาพอิสระและนักเดินทาง
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px 16px', marginTop: 32 }}>
          {cols.map((c) => (
            <div key={c.h}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontWeight: 500, opacity: 0.6, marginBottom: 10,
              }}>{c.h}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {c.items.map(([label, href]) => (
                  <li key={label} style={{ fontSize: 13 }}>
                    <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.1)' : 'var(--rule)', margin: '32px 0 14px' }} />
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '0.1em', opacity: 0.55, textTransform: 'uppercase',
        }}>
          <span>© 2026 Gography</span>
          <span>Bangkok · Thailand</span>
        </div>
      </div>
    </footer>
  );
}

export function MobileMarquee({ text = '★ Pulse rising ★ Season 04 ★ Submissions open until 12.31 ★' }) {
  const { theme } = useApp();
  const dark = theme === 'dark';
  return (
    <div style={{
      overflow: 'hidden', whiteSpace: 'nowrap',
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'var(--rule)'}`,
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'var(--rule)'}`,
      padding: '14px 0',
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
      letterSpacing: '0.18em', textTransform: 'uppercase',
    }}>
      <div style={{ animation: 'mobileMarquee 30s linear infinite', display: 'inline-block' }}>
        {Array(4).fill(text).join('   ')}
      </div>
    </div>
  );
}

export function MobileSectionHeader({ num, title, link, href }: { num?: string; title: string; link?: string; href?: string }) {
  return (
    <div>
      {num && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          color: 'var(--fg-soft)', letterSpacing: '0.16em',
        }}>— {num}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
        marginTop: num ? 6 : 0,
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>{title}</div>
        {link && (
          <Link href={href || '#'} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'var(--fg)', whiteSpace: 'nowrap',
            borderBottom: '1px solid var(--fg)', paddingBottom: 2,
            textDecoration: 'none',
          }}>{link} →</Link>
        )}
      </div>
    </div>
  );
}

export function FeedTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';
  const muted = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const tabs = [
    { id: 'foryou', label: 'For You' },
    { id: 'following', label: 'Following' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28,
      padding: '14px 16px 12px',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      background: dark ? '#0a0a0a' : '#fff',
      position: 'sticky', top: 56, zIndex: 20,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 0, padding: '4px 2px',
            cursor: 'pointer', position: 'relative',
            fontFamily: "'Inter', sans-serif",
            fontSize: on ? 17 : 15, fontWeight: on ? 600 : 500,
            color: on ? c : muted,
            letterSpacing: '-0.01em',
          }}>
            {t.label}
            {on && (
              <span style={{
                position: 'absolute', left: '50%', bottom: -3,
                transform: 'translateX(-50%)',
                width: 28, height: 2, background: '#b08e54',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function BottomNavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const stroke = 1.7;
  const icons: Record<string, JSX.Element> = {
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
    explore: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </svg>
    ),
    pulse: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    ),
    profile: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

export function BottomNav({ active }: { active?: 'home' | 'explore' | 'pulse' | 'profile' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, authUser } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';
  const muted = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const bg = dark ? 'rgba(10,10,10,0.96)' : 'rgba(255,255,255,0.96)';

  const items = [
    { id: 'home',    icon: 'home',    label: 'Home',    href: '/' },
    { id: 'explore', icon: 'explore', label: 'Explore', href: '/explore' },
    { id: 'profile', icon: 'profile', label: 'Me',      href: authUser ? '/me' : '/login' },
  ];
  const resolvedActive = active
    ?? (pathname === '/' ? 'home'
      : pathname?.startsWith('/explore') ? 'explore'
      : pathname?.startsWith('/me') ? 'profile'
      : undefined);

  return (
    <nav style={{
      position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: bg, backdropFilter: 'blur(12px)',
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      paddingTop: 8, paddingBottom: 10,
      fontFamily: "'Inter', sans-serif",
    }}>
      <NavBtn item={items[0]} on={resolvedActive === 'home'} c={c} muted={muted} onClick={() => router.push(items[0].href)} />
      <NavBtn item={items[1]} on={resolvedActive === 'explore'} c={c} muted={muted} onClick={() => router.push(items[1].href)} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={() => alert('Submit · Coming soon')} aria-label="Submit a frame" style={{
          width: 52, height: 52, padding: 0,
          background: c, color: dark ? '#000' : '#fff',
          border: 0, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -22,
          boxShadow: dark
            ? '0 6px 18px rgba(255,255,255,0.18), 0 0 0 4px #0a0a0a'
            : '0 6px 18px rgba(0,0,0,0.18), 0 0 0 4px #fff',
          position: 'relative',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span style={{
            position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: c, whiteSpace: 'nowrap',
          }}>Submit</span>
        </button>
      </div>
      <NavBtn item={{ id: 'pulse', icon: 'pulse', label: 'Pulse', href: '/explore' }} on={resolvedActive === 'pulse'} c={c} muted={muted} onClick={() => router.push('/explore')} />
      <NavBtn item={items[2]} on={resolvedActive === 'profile'} c={c} muted={muted} onClick={() => router.push(items[2].href)} />
    </nav>
  );
}

function NavBtn({ item, on, c, muted, onClick }: { item: { icon: string; label: string }; on: boolean; c: string; muted: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 0, cursor: 'pointer',
      padding: '4px 0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      color: on ? c : muted,
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      minHeight: 44,
    }}>
      <BottomNavIcon name={item.icon} />
      <span style={{ fontWeight: on ? 600 : 400 }}>{item.label}</span>
    </button>
  );
}

function usePhotoLike(photoId: string) {
  const { authUser } = useApp();
  const [liked, setLiked] = useState<boolean>(false);

  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      setLiked(Boolean(map[photoId]));
    } catch {}
  }, [photoId]);

  useEffect(() => {
    // Prevent 400 Bad Request when photoId is a mock ID (e.g. 'p015') instead of a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId);
    if (!SUPABASE_CONFIGURED || !authUser?.id || !isUuid) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    supabase
      .from('favorites')
      .select('photo_id')
      .eq('user_id', authUser.id)
      .eq('photo_id', photoId)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setLiked(Boolean(data)); });
    return () => { cancelled = true; };
  }, [photoId, authUser?.id]);

  const toggle = async () => {
    const next = !liked;
    setLiked(next);
    try {
      if (typeof window !== 'undefined') {
        const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
        map[photoId] = next;
        localStorage.setItem('gpa-liked', JSON.stringify(map));
      }
    } catch {}

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId);
    if (SUPABASE_CONFIGURED && authUser?.id && isUuid) {
      const supabase = getSupabaseBrowserClient();
      if (next) {
        await supabase.from('favorites').upsert({ user_id: authUser.id, photo_id: photoId });
      } else {
        await supabase.from('favorites').delete().eq('user_id', authUser.id).eq('photo_id', photoId);
      }
    }
  };

  return { liked, toggle };
}

export function FeedCard({ photo }: { photo: any }) {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const author = photographer?.name || photo.by;
  const location = photographer?.loc;
  const voyageur = voyageurUsernames.has(photo.by);
  const curator = Array.isArray(photo.picks) && photo.picks.includes('editor');
  const c = dark ? '#fff' : '#000';
  const { liked, toggle } = usePhotoLike(photo.id);
  const [bookmark, setBookmark] = useState(false);

  return (
    <article style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        onClick={() => router.push(`/photo/${photo.id}`)}
        style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: 'var(--tile)', cursor: 'pointer' }}
      >
        <img src={photo.src} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          {curator && (
            <div style={{
              width: 36, height: 28,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.25)',
            }} title="Curator pick">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 4h8v3a4 4 0 1 1-8 0V4zM5 6h3M16 6h3M9 13v3h6v-3M8 20h8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); setBookmark(!bookmark); }} aria-label="Bookmark" style={{
            width: 28, height: 36, padding: 0, border: 0, cursor: 'pointer',
            background: bookmark ? '#fff' : 'rgba(255,255,255,0.92)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)',
            display: 'inline-flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={bookmark ? '#b08e54' : 'none'}
              stroke="#b08e54" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M12 2l2.9 6.5 7.1.8-5.3 4.9 1.5 7-6.2-3.6L5.8 21l1.5-7L2 9.3l7.1-.8z" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <Link href={`/photographer/${photo.by}`} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, color: 'inherit', textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, flexShrink: 0,
            background: dark ? '#222' : '#f1efe9',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600,
            color: c, overflow: 'hidden',
          }}>
            {photographer?.avatar
              ? <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : author.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {author}{voyageur && <span style={{ marginLeft: 6, color: '#b08e54' }}>◆</span>}
            </div>
            {(location || photo.likes !== undefined) && (
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                color: 'var(--fg-soft)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginTop: 1,
              }}>
                {location}{photo.likes !== undefined ? ` · ♥ ${photo.likes}` : ''}
              </div>
            )}
          </div>
        </Link>
        <button onClick={toggle} aria-label="Like" style={{
          width: 36, height: 36, padding: 0, background: 'transparent',
          border: 0, cursor: 'pointer', color: c,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="20" viewBox="0 0 24 22"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="1.6">
            <path d="M12 20s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 2.6C20 14.8 12 20 12 20z" />
          </svg>
        </button>
      </div>
    </article>
  );
}
