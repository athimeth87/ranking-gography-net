// @ts-nocheck
'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PHOTOS, PHOTOGRAPHERS, pulseScore } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

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

      {/* Photo grid — 2-col */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {grid.map(p => {
            const photographer = PHOTOGRAPHERS.find(ph => ph.username === p.by);
            return (
              <article
                key={p.id}
                onClick={() => router.push(`/photo/${p.id}`)}
                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'var(--tile)', overflow: 'hidden' }}>
                  <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
                <div style={{ paddingTop: 10 }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {photographer?.name || p.by}
                  </div>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    color: 'var(--fg-soft)', letterSpacing: '0.08em',
                    marginTop: 2, textTransform: 'uppercase',
                  }}>
                    {photographer?.loc} · ♥ {p.likes}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {visible < filtered.length && (
          <button onClick={() => setVisible(v => v + 8)} style={{
            width: '100%', marginTop: 28,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 44, padding: '0 18px',
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            border: `1px solid ${dark ? '#fff' : '#000'}`,
            background: 'transparent', color: dark ? '#fff' : '#000',
            cursor: 'pointer',
          }}>Load more</button>
        )}
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
