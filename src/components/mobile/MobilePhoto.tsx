// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, COMMENTS, voyageurUsernames } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileFooter, BottomNav } from './MobileShared';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function MobilePhoto({ id }: { id: string }) {
  const router = useRouter();
  const { theme, authUser, toggleSideMenu } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';

  const photo = PHOTOS.find(p => p.id === id) || PHOTOS[0];
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const comments = (COMMENTS as any)[photo.id] || (COMMENTS as any).default || [];
  const more = PHOTOS.filter(p => p.by === photo.by && p.id !== photo.id).slice(0, 4);
  const isVoyageur = voyageurUsernames.has(photo.by);

  const [liked, setLiked] = useState(false);
  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      setLiked(Boolean(map[photo.id]));
    } catch {}
  }, [photo.id]);
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    supabase.from('prototype_likes').select('photo_id').eq('user_id', authUser.id).eq('photo_id', photo.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setLiked(Boolean(data)); });
    return () => { cancelled = true; };
  }, [photo.id, authUser?.id]);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      map[photo.id] = next;
      localStorage.setItem('gpa-liked', JSON.stringify(map));
    } catch {}
    if (SUPABASE_CONFIGURED && authUser?.id) {
      const supabase = getSupabaseBrowserClient();
      if (next) await supabase.from('prototype_likes').upsert({ user_id: authUser.id, photo_id: photo.id });
      else await supabase.from('prototype_likes').delete().eq('user_id', authUser.id).eq('photo_id', photo.id);
    }
  };

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Slim top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: dark ? 'rgba(10,10,10,0.96)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52, padding: '0 14px',
      }}>
        <button onClick={() => router.back()} aria-label="Back" style={{
          width: 36, height: 36, background: 'transparent', border: 0, cursor: 'pointer', color: c, padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65,
        }}>Rank #{String(photo.rank || '—').padStart(3, '0')} · {photo.cat}</div>
        <button onClick={toggleSideMenu} aria-label="Menu" style={{
          width: 36, height: 36, background: 'transparent', border: 0, cursor: 'pointer', color: c, padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="14" viewBox="0 0 22 14">
            <rect y="1"  width="22" height="1.6" fill={c} />
            <rect y="6"  width="22" height="1.6" fill={c} />
            <rect y="11" width="14" height="1.6" fill={c} />
          </svg>
        </button>
      </header>

      {/* Photo */}
      <div style={{ background: 'var(--tile)' }}>
        <img src={photo.src} alt={photo.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {/* Title + actions */}
      <section style={{ padding: '20px 16px 0' }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>"{photo.title}"</h1>
        {photo.caption && (
          <p style={{
            fontFamily: "'Noto Sans Thai', sans-serif",
            fontSize: 14, lineHeight: 1.6,
            color: 'var(--fg-soft)', marginTop: 12, maxWidth: '40ch',
          }}>{photo.caption}</p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={toggleLike} style={{
            flex: 1, minHeight: 44, padding: '0 14px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: `1px solid ${c}`,
            background: liked ? c : 'transparent',
            color: liked ? (dark ? '#000' : '#fff') : c,
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            <svg width="16" height="14" viewBox="0 0 24 22" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 2.6C20 14.8 12 20 12 20z" />
            </svg>
            {liked ? 'Liked' : 'Like'}
          </button>
          <button onClick={() => {
            if (typeof navigator !== 'undefined' && (navigator as any).share) {
              (navigator as any).share({ title: photo.title, url: typeof window !== 'undefined' ? window.location.href : '' }).catch(() => {});
            }
          }} style={{
            flex: 1, minHeight: 44, padding: '0 14px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${c}`, background: 'transparent', color: c,
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
          }}>Share</button>
        </div>
      </section>

      {/* Photographer card */}
      <section style={{ padding: '24px 16px 0' }}>
        <Link
          href={`/photographer/${photo.by}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: 14, border: '1px solid var(--rule)',
            color: 'inherit', textDecoration: 'none',
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--tile)', flexShrink: 0 }}>
            {photographer?.avatar && <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>
              {photographer?.name || photo.by}
              {isVoyageur && <span style={{ marginLeft: 6, color: '#b08e54' }}>◆</span>}
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--fg-soft)', marginTop: 2,
            }}>{photographer?.loc}</div>
          </div>
          <span style={{ fontSize: 18, opacity: 0.6 }}>→</span>
        </Link>
      </section>

      {/* Stats */}
      <section style={{ padding: '24px 16px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          border: '1px solid var(--rule-strong)',
        }}>
          {[
            [photo.likes?.toLocaleString() || '0', 'Likes'],
            [photo.favorites?.toLocaleString() || '0', 'Favorites'],
            [photo.comments?.toString() || '0', 'Comments'],
            [photo.hours?.toString() || '—', 'Hours posted'],
          ].map(([n, l], i) => (
            <div key={l} style={{
              padding: '16px 14px',
              borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 0,
              borderBottom: i < 2 ? '1px solid var(--rule)' : 0,
            }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 500,
                letterSpacing: '-0.02em', lineHeight: 1, display: 'block',
              }}>{n}</span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--fg-soft)', marginTop: 6, display: 'block',
              }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* EXIF */}
      {photo.exif && (
        <section style={{ padding: '24px 16px 0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--fg-soft)', marginBottom: 8,
          }}>EXIF</div>
          <dl style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
            {[
              ['Camera', photo.exif.camera],
              ['Lens', photo.exif.lens],
              ['Focal', photo.exif.focal],
              ['Aperture', photo.exif.aperture],
              ['Shutter', photo.exif.shutter],
              ['ISO', photo.exif.iso],
            ].map(([k, v]) => v && (
              <div key={k as string} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderTop: '1px solid var(--rule)',
              }}>
                <dt style={{ color: 'var(--fg-soft)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</dt>
                <dd style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* More from this photographer */}
      {more.length > 0 && (
        <section style={{ padding: '40px 16px 0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--fg-soft)',
          }}>More from {photographer?.name}</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {more.map(p => (
              <div
                key={p.id}
                onClick={() => router.push(`/photo/${p.id}`)}
                style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
              >
                <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <section style={{ padding: '40px 16px 0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--fg-soft)', marginBottom: 12,
          }}>{comments.length} Comments</div>
          {comments.slice(0, 6).map((cm: any, i: number) => (
            <div key={i} style={{
              padding: '14px 0',
              borderTop: '1px solid var(--rule)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{cm.by}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--fg-soft)' }}>{cm.when}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-soft)' }}>{cm.text}</p>
            </div>
          ))}
        </section>
      )}

      <div style={{ height: 56 }} />
      <MobileFooter />
    </div>
  );
}
