// @ts-nocheck
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, pulseScore } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

// Masonry photo tile with avatar+username overlay (left) and like button (right)
export function MasonryTile({ photo }: { photo: any }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const { authUser } = useApp();
  const aspect = photo.w && photo.h ? `${photo.w} / ${photo.h}` : '4 / 5';

  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const avatarUrl = photo.avatarUrl || photographer?.avatar;

  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      setLiked(Boolean(map[photo.id]));
    } catch {}
  }, [photo.id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      map[photo.id] = next;
      localStorage.setItem('gpa-liked', JSON.stringify(map));
    } catch {}
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photo.id);
    if (authUser?.id && isUuid) {
      const supabase = getSupabaseBrowserClient();
      if (next) {
        await supabase.from('favorites').upsert({ user_id: authUser.id, photo_id: photo.id });
      } else {
        await supabase.from('favorites').delete().eq('user_id', authUser.id).eq('photo_id', photo.id);
      }
    }
  };

  const baseLikes = photo.likes || 0;
  const likesShown = baseLikes + (liked ? 1 : 0);
  const likesLabel = likesShown >= 1000 ? `${(likesShown / 1000).toFixed(1)}k` : likesShown;

  return (
    <div
      onClick={() => router.push(`/photo/${photo.slug || photo.id}`)}
      style={{
        position: 'relative', breakInside: 'avoid',
        marginBottom: 8, cursor: 'pointer', overflow: 'hidden', background: 'var(--tile)',
      }}
    >
      <div style={{ width: '100%', aspectRatio: aspect, overflow: 'hidden' }}>
        <img
          src={photo.src}
          alt={photo.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </div>
      {/* Bottom gradient for legibility */}
      <div style={{
        position: 'absolute', inset: 'auto 0 0 0', height: 56,
        background: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.25), transparent)',
        pointerEvents: 'none',
      }} />
      {/* Avatar + username — bottom-left */}
      <div style={{
        position: 'absolute', left: 10, bottom: 10,
        display: 'flex', alignItems: 'center', gap: 7,
        maxWidth: 'calc(100% - 70px)',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
        }}>
          {avatarUrl && (
            <img src={avatarUrl} alt={photo.by} style={{
              width: '100%', height: '100%', objectFit: 'cover',
            }} />
          )}
        </div>
        <span style={{
          color: '#fff', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}>{photo.by}</span>
      </div>
      {/* Like button — bottom-right (clickable) */}
      <button
        onClick={toggleLike}
        aria-label={liked ? 'Unlike' : 'Like'}
        style={{
          position: 'absolute', right: 10, bottom: 10,
          padding: 0, border: 0, background: 'transparent', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: liked ? '#ff5d75' : '#fff',
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{likesLabel}</span>
      </button>
    </div>
  );
}

const CATS = ['All', 'Landscape', 'Portrait', 'BW'] as const;

export function MobileExplore({ initialCategory = 'All', dbPhotos = [] }: { initialCategory?: typeof CATS[number], dbPhotos?: any[] }) {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const [sort, setSort] = useState<'Hirest' | 'Fresh'>('Fresh');
  const [cat, setCat] = useState<typeof CATS[number]>(initialCategory);
  const [visible, setVisible] = useState(8);

  const dataSource = dbPhotos.length > 0 ? dbPhotos : PHOTOS;

  const filtered = useMemo(() => {
    const base = cat === 'All' ? dataSource : dataSource.filter(p => p.cat === cat || p.cat.toLowerCase() === cat.toLowerCase());
    return sort === 'Hirest'
      ? base.slice().sort((a, b) => (b.pulse !== undefined ? b.pulse : pulseScore(b)) - (a.pulse !== undefined ? a.pulse : pulseScore(a)))
      : base.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sort, cat, dataSource]);
  const grid = filtered.slice(0, visible);

  const trending = PHOTOGRAPHERS
    .map(p => ({
      ...p,
      pulse: Math.round(PHOTOS.filter(ph => ph.by === p.username).reduce((s, ph) => s + pulseScore(ph), 0)),
    }))
    .sort((a, b) => b.pulse - a.pulse)
    .slice(0, 6);

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* Tight cover */}
      <div style={{ padding: '32px 16px 0' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', color: 'var(--fg-soft)',
        }}>— Explore</div>
        <h1 style={{
          margin: '8px 0 14px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.02em',
        }}>This season's frames</h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-soft)', margin: 0, maxWidth: '36ch' }}>
          {filtered.length} of {dataSource.length} frames. Updated continuously.
        </p>
      </div>

      {/* SortBlocks — 2-col */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          border: '1px solid var(--rule-strong)',
        }}>
          {([
            { k: 'Hirest', sub: 'Top pulse' },
            { k: 'Fresh',  sub: 'Newest first' },
          ] as const).map((s, i) => {
            const active = sort === s.k;
            return (
              <button key={s.k} onClick={() => setSort(s.k)} style={{
                padding: '16px 14px', cursor: 'pointer',
                background: active ? (dark ? '#fff' : '#000') : 'transparent',
                color: active ? (dark ? '#000' : '#fff') : (dark ? '#fff' : '#000'),
                border: 0, borderRight: i === 0 ? '1px solid var(--rule-strong)' : 0,
                textAlign: 'left', fontFamily: 'inherit',
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 22, letterSpacing: '-0.01em', lineHeight: 1,
                }}>{s.k}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  marginTop: 8, opacity: 0.7,
                }}>{s.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category chips — horizontal scroll */}
      <div className="mobile-h-scroll" style={{ marginTop: 16 }}>
        {CATS.map(c => {
          const active = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)} style={{
              height: 36, padding: '0 14px',
              border: `1px solid ${active ? (dark ? '#fff' : '#000') : 'var(--rule-strong)'}`,
              background: active ? (dark ? '#fff' : '#000') : 'transparent',
              color: active ? (dark ? '#000' : '#fff') : (dark ? '#fff' : '#000'),
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', flex: '0 0 auto', whiteSpace: 'nowrap',
            }}>{c === 'BW' ? 'B&W' : c}</button>
          );
        })}
      </div>

      {/* Photo grid — 2-col masonry (Pinterest-style) */}
      <div style={{ padding: '16px 6px 0' }}>
        <div style={{
          columnCount: 2,
          columnGap: 8,
        }}>
          {filtered.map(p => (
            <MasonryTile key={p.id} photo={p} />
          ))}
        </div>
      </div>

      {/* Trending — moved below grid */}
      <section style={{ padding: '56px 0 0', background: dark ? '#131310' : 'var(--cream)' }}>
        <div style={{ padding: '32px 16px 0' }}>
          <MobileSectionHeader num="—" title="Trending photographers" link="All" href="/photographers" />
        </div>
        <div className="mobile-h-scroll" style={{ marginTop: 18, padding: '0 16px 32px' }}>
          {trending.map(p => (
            <div
              key={p.username}
              onClick={() => router.push(`/photographer/${p.username}`)}
              style={{ width: 140, flex: '0 0 140px', cursor: 'pointer' }}
            >
              <div style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                {p.avatar && <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
              </div>
              <div style={{
                marginTop: 10, fontSize: 13, fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{p.name}</div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                letterSpacing: '0.08em', color: 'var(--fg-soft)',
                marginTop: 2, textTransform: 'uppercase',
              }}>Pulse {p.pulse}</div>
            </div>
          ))}
        </div>
      </section>

      <MobileMarquee text={`◆ ${dataSource.length} frames ◆ Season 04 ◆ Updated continuously ◆`} />
      <MobileFooter />
    </div>
  );
}
