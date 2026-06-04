// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { useTranslations } from 'next-intl';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PHOTOGRAPHERS, voyageurUsernames } from '@/lib/data';
import { Footer } from '@/components/layout/Footer';

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
  
  // Return null to hide this mobile version since there's already a global Nav
  return null;
}

export function MobileFooter() {
  return <Footer />;
}

export function MobileMarquee({ text = '★ Pulse rising ★ Season 01 ★ Submissions open until 12.31 ★' }) {
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
  const t = useTranslations('MobileShared');
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';
  const muted = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const tabs = [
    { id: 'leaderboard', label: t('leaderboard') },
    { id: 'trendsnow', label: t('trends_now') },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28,
      padding: '14px 16px 12px',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      background: dark ? '#0a0a0a' : '#fff',
      position: 'sticky', top: 61, zIndex: 20,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'transparent', border: 0, padding: '4px 2px',
            cursor: 'pointer', position: 'relative',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: on ? 13 : 12, fontWeight: 500,
            color: on ? c : muted,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
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

type IconName = 'home' | 'explore' | 'search' | 'pulse' | 'profile' | 'heart' | 'upload';

function BottomNavIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  const s = 1.5;
  switch (name) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'explore':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </svg>
      );
    case 'search':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="20" y1="20" x2="16.5" y2="16.5" />
        </svg>
      );
    case 'pulse':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );
    case 'profile':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
      );
    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 2.6C20 14.8 12 20 12 20z" />
        </svg>
      );
    case 'upload':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
  }
}

type Slot = {
  id: string;
  label: string;
  icon: IconName;
  active: boolean;
  onClick: () => void;
};

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { authUser, setUploadModalOpen, userState } = useApp();
  const t = useTranslations('MobileShared');

  if (pathname.startsWith('/admin')) return null;

  const persona: 'guest' | 'user' | 'customer' | 'photographer' =
    !authUser ? 'guest' : (userState === 'guest' ? 'user' : userState);

  const starts = (p: string) => pathname === p || pathname.startsWith(p + '/');
  const meActive = starts('/me') && !starts('/me/favorites');
  const favActive = starts('/me/favorites');

  const slotHome: Slot = { id: 'home', label: t('home'), icon: 'home',
    active: pathname === '/', onClick: () => router.push('/') };
  const slotExplore: Slot = { id: 'explore', label: t('explore'), icon: 'explore',
    active: starts('/explore') || starts('/photographers'),
    onClick: () => router.push('/explore') };
  const slotSearch: Slot = { id: 'search', label: t('search'), icon: 'search',
    active: starts('/search'), onClick: () => router.push('/search') };
  const slotPulse: Slot = { id: 'pulse', label: t('pulse'), icon: 'pulse',
    active: starts('/hall-of-fame'), onClick: () => router.push('/hall-of-fame') };
  const slotUpload: Slot = { id: 'upload', label: t('upload'), icon: 'upload',
    active: false, onClick: () => setUploadModalOpen(true) };
  const slotFav: Slot = { id: 'fav', label: t('favorites'), icon: 'heart',
    active: favActive, onClick: () => router.push('/me/favorites') };
  const slotMe: Slot = { id: 'me', label: t('me'), icon: 'profile',
    active: meActive, onClick: () => router.push('/me') };
  const slotLogin: Slot = { id: 'login', label: t('sign_in'), icon: 'profile',
    active: starts('/login'), onClick: () => router.push('/login') };

  const slots: Slot[] =
    persona === 'photographer' ? [slotHome, slotExplore, slotUpload, slotPulse, slotMe] :
    persona === 'customer'     ? [slotHome, slotExplore, slotUpload, slotFav, slotMe] :
    persona === 'user'         ? [slotHome, slotExplore, slotUpload, slotFav, slotMe] :
                                 [slotHome, slotExplore, slotUpload, slotPulse, slotLogin];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-1 mx-4 z-40 rounded-md"
      style={{
        background: 'var(--bg-menu, rgba(255,255,255,0.32))',
        /* @ts-ignore */
        background: 'color-mix(in oklab, var(--bg) 32%, transparent)',
        backdropFilter: 'saturate(180%) blur(32px)',
        WebkitBackdropFilter: 'saturate(180%) blur(32px)',
        borderColor: 'color-mix(in oklab, var(--fg) 10%, transparent)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-5 h-[56px]">
        {slots.map((s) => {
          const isUpload = s.id === 'upload';
          const highlight = isUpload || s.active;
          return (
            <button
              key={s.id}
              onClick={s.onClick}
              aria-label={s.label}
              aria-current={s.active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 min-h-[44px] transition-opacity active:opacity-60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-fg focus-visible:-outline-offset-2"
            >
              <span className={highlight ? 'text-fg' : 'text-fg-soft'}>
                <BottomNavIcon name={s.icon} size={20} />
              </span>
              <span
                className={`caps ${highlight ? 'font-semibold text-fg' : 'text-fg-soft'}`}
                style={{ fontSize: 8 }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
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
  const { theme, authUser } = useApp();
  const dark = theme === 'dark';
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const author = photographer?.name || photo.by;
  const location = photographer?.loc;
  const voyageur = voyageurUsernames.has(photo.by);
  const curator = Array.isArray(photo.picks) && photo.picks.includes('editor');
  const c = dark ? '#fff' : '#000';
  const { liked, toggle } = usePhotoLike(photo.id);
  const [bookmark, setBookmark] = useState(false);
  const ownerId = photo.photographer_id || photo.photographerId || null;
  const isOwner = !!authUser && !!ownerId && authUser.id === ownerId;

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
          {!isOwner && (
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
          )}
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
        {!isOwner && (
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
        )}
      </div>
    </article>
  );
}
