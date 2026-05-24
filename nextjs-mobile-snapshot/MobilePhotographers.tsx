'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PHOTOS, PHOTOGRAPHERS, pulseScore, voyageurUsernames } from '@/lib/data';
import { useApp } from '@/components/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

type FilterKey = 'all' | 'voyageurs' | 'ambassadors' | 'general';

const FILTERS: { k: FilterKey; l: string }[] = [
  { k: 'all',         l: 'All' },
  { k: 'voyageurs',   l: 'Voyageurs' },
  { k: 'ambassadors', l: 'Ambassadors' },
  { k: 'general',     l: 'Photographers' },
];

export function MobilePhotographers({ initialFilter = 'all' }: { initialFilter?: FilterKey }) {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const [filter, setFilter] = useState<FilterKey>(initialFilter);

  const filtered = (() => {
    if (filter === 'voyageurs') return PHOTOGRAPHERS.filter(p => p.isCustomer);
    if (filter === 'ambassadors') return PHOTOGRAPHERS.filter(p => p.isAmbassador);
    if (filter === 'general') return PHOTOGRAPHERS.filter(p => !p.isCustomer && !p.isAmbassador);
    return PHOTOGRAPHERS;
  })();

  const coverPhoto = PHOTOS.find(p => p.id === 'p018') || PHOTOS[0];

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* Cover */}
      <div style={{ position: 'relative', width: '100%', height: 360, overflow: 'hidden', color: '#fff' }}>
        <img src={coverPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.78) 100%)' }} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 2 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 14 }}>— Directory</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(34px, 9vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.02em', maxWidth: '16ch' }}>All photographers</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, maxWidth: '32ch', marginTop: 12 }}>
            ช่างภาพและ Voyageurs ที่อยู่บนเวที GOGRAPHY Photo Awards
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mobile-h-scroll" style={{ marginTop: 24 }}>
        {FILTERS.map(f => {
          const active = filter === f.k;
          return (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              height: 36, padding: '0 14px',
              border: `1px solid ${active ? (dark ? '#fff' : '#000') : 'var(--rule-strong)'}`,
              background: active ? (dark ? '#fff' : '#000') : 'transparent',
              color: active ? (dark ? '#000' : '#fff') : (dark ? '#fff' : '#000'),
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', flex: '0 0 auto', whiteSpace: 'nowrap',
            }}>{f.l} · {filter === f.k ? filtered.length : (
              f.k === 'all' ? PHOTOGRAPHERS.length
              : f.k === 'voyageurs' ? PHOTOGRAPHERS.filter(p => p.isCustomer).length
              : f.k === 'ambassadors' ? PHOTOGRAPHERS.filter(p => p.isAmbassador).length
              : PHOTOGRAPHERS.filter(p => !p.isCustomer && !p.isAmbassador).length
            )}</button>
          );
        })}
      </div>

      {/* Photographer list */}
      <div style={{ padding: '24px 16px 0', display: 'grid', gap: 24 }}>
        {filtered.map(p => {
          const theirPhotos = PHOTOS.filter(ph => ph.by === p.username).slice(0, 4);
          const isVoyageur = voyageurUsernames.has(p.username);
          while (theirPhotos.length < 4) theirPhotos.push(PHOTOS[0]);
          return (
            <article
              key={p.username}
              onClick={() => router.push(`/photographer/${p.username}`)}
              style={{
                border: '1px solid var(--rule)',
                padding: 16, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                background: dark ? '#0a0a0a' : 'var(--bg)',
              }}
            >
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {theirPhotos.map((ph, i) => (
                  <div key={ph.id + i} style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                    <img src={ph.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
                <div style={{
                  position: 'absolute', left: '50%', bottom: -28,
                  transform: 'translateX(-50%)', width: 56, height: 56,
                  borderRadius: '50%', overflow: 'hidden',
                  border: `3px solid ${dark ? '#0a0a0a' : 'var(--bg)'}`,
                  background: 'var(--tile)',
                }}>
                  {p.avatar && <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
              </div>
              <div style={{ paddingTop: 40, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {isVoyageur && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: '#b08e54', marginBottom: 10,
                  }}>
                    <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
                    Voyageur
                  </div>
                )}
                {p.isAmbassador && !isVoyageur && (
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    opacity: 0.7, marginBottom: 10,
                  }}>★ Ambassador</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55,
                }}>{p.loc}</div>
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ height: 56 }} />
      <MobileMarquee text={`★ ${PHOTOGRAPHERS.length} photographers ★ Season 04 ★`} />
      <MobileFooter />
      <BottomNav />
    </div>
  );
}
