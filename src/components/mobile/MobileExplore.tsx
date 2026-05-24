// @ts-nocheck
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, pulseScore } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

// Masonry photo tile with heart overlay — used in 3-col masonry grid
export function MasonryTile({ photo }: { photo: any }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const { authUser } = useApp();
  const aspect = photo.w && photo.h ? `${photo.w} / ${photo.h}` : '4 / 5';

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

  return (
    <div
      onClick={() => router.push(`/photo/${photo.id}`)}
      style={{
        position: 'relative', breakInside: 'avoid', WebkitColumnBreakInside: 'avoid',
        marginBottom: 6, cursor: 'pointer', overflow: 'hidden', background: 'var(--tile)',
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
      <button
        onClick={toggleLike}
        aria-label={liked ? 'Unlike' : 'Like'}
        style={{
          position: 'absolute', right: 6, bottom: 6,
          width: 32, height: 32, padding: 0, border: 0,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: liked ? '#ff5d75' : '#fff',
          borderRadius: 999,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

const CATS = ['All', 'Landscape', 'Portrait', 'BW'] as const;

export function MobileExplore() {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const [sort, setSort] = useState<'Hirest' | 'Fresh'>('Fresh');
  const [cat, setCat] = useState<typeof CATS[number]>('All');
  const [visible, setVisible] = useState(8);

  const filtered = useMemo(() => {
    const base = cat === 'All' ? PHOTOS : PHOTOS.filter(p => p.cat === cat);
    return sort === 'Hirest'
      ? base.slice().sort((a, b) => pulseScore(b) - pulseScore(a))
      : base.slice().sort((a, b) => a.hours - b.hours);
  }, [sort, cat]);
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
          {filtered.length} of {PHOTOS.length} frames. Updated continuously.
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

      {/* Photo grid — 3-col masonry (Pinterest-style) */}
      <div style={{ padding: '16px 6px 0' }}>
        <div style={{
          columnCount: 3,
          columnGap: 6,
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

      <MobileMarquee text={`◆ ${PHOTOS.length} frames ◆ Season 04 ◆ Updated continuously ◆`} />
      <MobileFooter />
    </div>
  );
}
