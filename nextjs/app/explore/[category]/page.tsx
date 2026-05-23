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
  else if (sort === 'likes') photos.sort((a,b) => b.likes - a.likes);
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
      <section style={{ padding: '64px 0 40px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 32 }}>
            <div>
              <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Explore</div>
              <h1 className="display-hero" style={{ fontSize: 'clamp(48px, 5vw, 72px)', margin: 0, letterSpacing: '-.025em' }}>
                {catKey === 'BW' ? 'Black & White' : (catKey || 'Every photo')}
              </h1>
            </div>
            <div className="mono" style={{ fontSize: 11, opacity: .55, textAlign: 'right', lineHeight: 1.7 }}>
              {photos.length * 7} PHOTOS<br />SORTED BY {sort.toUpperCase()}<br />{timeRange.toUpperCase()}
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid var(--rule)', paddingBottom: 0 }}>
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

          {/* Filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <FilterDropdown label="Sort" value={sort} options={[
                { v: 'pulse', l: 'Pulse score' },
                { v: 'recent', l: 'Most recent' },
                { v: 'likes', l: 'Most liked' },
              ]} onChange={setSort} />
              <FilterDropdown label="Time" value={timeRange} options={[
                { v: 'day', l: '24 hours' },
                { v: 'week', l: 'This week' },
                { v: 'month', l: 'This month' },
                { v: 'season', l: 'Spring 2026' },
                { v: 'all', l: 'All time' },
              ]} onChange={setTimeRange} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', opacity: showPicksOnly ? 1 : .65 }}>
                <input type="checkbox" checked={showPicksOnly} onChange={e => setShowPicksOnly(e.target.checked)} style={{ accentColor: 'var(--fg)' }} />
                Picks only
              </label>
            </div>
            <div className="mono" style={{ fontSize: 11, opacity: .55 }}>
              Press <span style={{ border: '1px solid var(--rule)', padding: '2px 6px' }}>J</span> <span style={{ border: '1px solid var(--rule)', padding: '2px 6px' }}>K</span> to navigate
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '40px 0 80px' }}>
        <div className="wrap">
          {photos.length === 0 ? (
            <EmptyState />
          ) : (
            <PhotoGrid photos={photos} cols={3} showRank={sort === 'pulse'} />
          )}
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
export default function Page({ params }) { return <PageExplore category={params.category} />; }
