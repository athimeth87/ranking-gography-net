'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PageCover } from '@/components/PageCover';
import { TrendingPhotographers } from '@/components/TrendingPhotographers';
import { MobileExplore } from '@/components/mobile/MobileExplore';

// ===== Ported from pages/explore.jsx =====
// Explore page — masonry grid + filters (category, sort, time range)
// Same component handles /explore and /explore/:category

function PageExplore({ category }) {
  const [sort, setSort] = React.useState('pulse');
  const [timeRange, setTimeRange] = React.useState('week');
  const [showPicksOnly, setShowPicksOnly] = React.useState(false);

  const catKey = category ? (
    category === 'landscape' ? 'Landscape' :
    category === 'portrait' ? 'Portrait' :
    category === 'bw' ? 'BW' : null
  ) : null;

  let photos = catKey ? PHOTOS.filter(p => p.cat === catKey) : PHOTOS.slice();
  if (showPicksOnly) photos = photos.filter(p => p.picks.length > 0);

  if (sort === 'recent') photos.sort((a,b) => a.hours - b.hours);
  else photos.sort((a,b) => b.pulse - a.pulse);

  const tabs = [
    { id: null, label: 'All' },
    { id: 'landscape', label: 'Landscape' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'bw', label: 'Black & White' },
  ];
  const router = useRouter();

  const coverPhotoId = catKey === 'Landscape' ? 'p010' : catKey === 'Portrait' ? 'p004' : catKey === 'BW' ? 'p002' : 'p013';
  const coverTitle = catKey === 'BW' ? 'Black & White' : (catKey || 'Every photo');
  const coverSubtitle = catKey
    ? `เลือกชมหมวด ${catKey === 'BW' ? 'Black & White' : catKey} — เรียงตามอันดับ ภาพล่าสุด หรือยอดโหวต`
    : 'เลือกชมภาพถ่ายทั้งหมด — กรองตามหมวด เวลา และอันดับ';

  return (
    <>
    <div className="md:hidden"><MobileExplore /></div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId={coverPhotoId}
        eyebrow={catKey ? 'Category' : 'Explore'}
        title={coverTitle}
        subtitle={coverSubtitle}
      />
      {/* Header */}
      <section className="py-8 md:py-12 lg:py-16">
        <div className="wrap">
          <div className="flex flex-wrap justify-between items-baseline gap-4 pb-6 md:pb-8">
            <div>
              <div className="caps mb-3 md:mb-3.5" style={{ opacity: .55 }}>Explore</div>
              <h1 className="display-hero m-0 text-[clamp(32px,8vw,72px)]" style={{ letterSpacing: '-.025em' }}>
                {catKey === 'BW' ? 'Black & White' : (catKey || 'Every photo')}
              </h1>
            </div>
            <div className="mono text-[11px] text-right" style={{ opacity: .55, lineHeight: 1.7 }}>
              {photos.length * 7} PHOTOS<br />SORTED BY {sort.toUpperCase()}<br />{timeRange.toUpperCase()}
            </div>
          </div>

          {/* Category tabs — horizontal scroll on mobile */}
          <div className="flex gap-5 md:gap-7 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--rule)' }}>
            {tabs.map(t => {
              const active = (catKey === null && t.id === null) || (catKey && catKey.toLowerCase() === t.id);
              return (
                <button key={t.id || 'all'}
                  onClick={() => router.push(t.id ? `/explore/${t.id}` : '/explore')}
                  style={{
                    padding: '16px 0',
                    fontSize: 13,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    borderBottom: active ? '2px solid var(--fg)' : '2px solid transparent',
                    marginBottom: -1,
                    cursor: 'pointer',
                    opacity: active ? 1 : .55,
                    fontWeight: 500,
                  }}>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Block sort toggle — prominent 2-option selector */}
          <SortBlocks value={sort} onChange={setSort} />

          {/* Filter bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 py-4 md:py-5" style={{ borderBottom: '1px solid var(--rule)' }}>
            <div className="flex gap-5 md:gap-8 items-center flex-wrap">
              <FilterDropdown label="Time" value={timeRange} options={[
                { v: 'day', l: '24 hours' },
                { v: 'week', l: 'This week' },
                { v: 'month', l: 'This month' },
                { v: 'season', l: 'Spring 2026' },
                { v: 'all', l: 'All time' },
              ]} onChange={setTimeRange} />
              <label className="flex items-center gap-2 cursor-pointer text-[12px] uppercase" style={{ letterSpacing: '.12em', opacity: showPicksOnly ? 1 : .65 }}>
                <input type="checkbox" checked={showPicksOnly} onChange={e => setShowPicksOnly(e.target.checked)} style={{ accentColor: 'var(--fg)' }} />
                Picks only
              </label>
            </div>
            <div className="mono text-[11px] hidden md:block" style={{ opacity: .55 }}>
              Press <span className="px-1.5 py-0.5" style={{ border: '1px solid var(--rule)' }}>J</span> <span className="px-1.5 py-0.5" style={{ border: '1px solid var(--rule)' }}>K</span> to navigate
            </div>
          </div>
        </div>
      </section>

      {/* Grid — with Trending Photographers sidebar */}
      <section style={{ padding: '40px 0 80px' }}>
        <div className="wrap">
          <div className="with-trending">
            <div className="with-trending-main">
              {photos.length === 0 ? (
                <EmptyState />
              ) : (
                <PhotoGrid photos={photos} cols={2} showRank={sort === 'pulse'} />
              )}
            </div>
            <TrendingPhotographers limit={10} title="Trending now" />
          </div>
        </div>
      </section>

      {/* Load more (visual) */}
      {photos.length > 0 && (
        <section style={{ padding: '40px 0 80px', textAlign: 'center' }}>
          <button className="btn btn-ghost" disabled>Loading more — infinite scroll</button>
        </section>
      )}

      <Footer />
    </div>
    </>
  );
}

// Tablet portrait: switch to grid-cols-2 so the category filter chips above
// don't crowd the page. Phone keeps 2-col as well (small but tappable).
function SortBlocks({ value, onChange }) {
  const BLOCKS = [
    {
      v: 'pulse',
      label: 'Hirest',
      sub: 'คะแนนสูงสุด · Highest Pulse score',
      // Trophy/peak symbol
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          <path d="M3 19 L9 9 L13 14 L16 10 L21 19 Z" />
        </svg>
      ),
    },
    {
      v: 'recent',
      label: 'Fresh',
      sub: 'รูปภาพใหม่ · Newest uploads',
      // Spark / sun-burst
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.5 5.5 L6.9 6.9 M17.1 17.1 L18.5 18.5 M5.5 18.5 L6.9 17.1 M17.1 6.9 L18.5 5.5" />
        </svg>
      ),
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3 pt-5 md:pt-6">
      {BLOCKS.map((b) => {
        const active = value === b.v;
        return (
          <button
            key={b.v}
            onClick={() => onChange(b.v)}
            className="flex items-center gap-3 md:gap-4 p-4 md:p-5 text-left transition-colors"
            style={{
              border: '1px solid ' + (active ? 'var(--fg)' : 'var(--rule)'),
              background: active ? 'var(--fg)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--fg)',
              cursor: 'pointer',
            }}
          >
            <span className="flex-shrink-0" style={{ opacity: active ? 1 : .8 }}>{b.icon}</span>
            <span className="flex flex-col gap-1 min-w-0">
              <span className="text-[15px] md:text-[18px] font-medium" style={{ letterSpacing: '-.01em' }}>{b.label}</span>
              <span className="th text-[10px] md:text-[11px]" style={{ letterSpacing: '.06em', opacity: active ? .75 : .55 }}>
                {b.sub}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const current = options.find(o => o.v === value);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>
        <span style={{ opacity: .55 }}>{label}</span>
        <span style={{ fontWeight: 500 }}>{current?.l}</span>
        <span style={{ fontSize: 9, opacity: .55 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, background: 'var(--bg)', border: '1px solid var(--fg)', minWidth: 200, zIndex: 10 }}>
          {options.map(o => (
            <button key={o.v}
              onClick={() => { onChange(o.v); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 13, cursor: 'pointer', background: o.v === value ? 'var(--cream)' : 'transparent' }}>
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '120px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 300, letterSpacing: '-.02em', marginBottom: 16 }} className="th">No photos in this category yet</div>
      <p style={{ fontSize: 15, color: 'var(--fg-soft)', maxWidth: 400, margin: '0 auto 32px' }} className="th">เป็นคนแรกที่อัพโหลด — หรือชวนช่างภาพในเครือข่ายมาร่วมเวที</p>
      <button className="btn">Upload a photo</button>
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageExplore />; }
