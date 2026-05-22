'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PhotographerCard } from '@/components/Shared';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/photographers.jsx =====
// All photographers index — public directory of every photographer on the platform
// Reachable from: Landing "View all photographers", "View all Voyageurs"

function PagePhotographers({ initialFilter }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState(['all','voyageurs','ambassadors','general'].includes(initialFilter) ? initialFilter : 'all');
  const [sort, setSort] = React.useState('featured');

  let list = PHOTOGRAPHERS.slice();
  if (filter === 'voyageurs') list = list.filter(p => p.isCustomer);
  if (filter === 'ambassadors') list = list.filter(p => p.isAmbassador);
  if (filter === 'general') list = list.filter(p => !p.isCustomer && !p.isAmbassador);

  if (sort === 'followers') list.sort((a,b) => b.followers - a.followers);
  else if (sort === 'photos') list.sort((a,b) => b.photos - a.photos);
  else if (sort === 'newest') list.sort((a,b) => b.joined.localeCompare(a.joined));

  return (
    <div className="page-fade">
      <PageCover
        photoId="p018"
        eyebrow="Directory"
        title="All photographers"
        subtitle="รวมช่างภาพและ Voyageurs ที่อยู่บนเวที GOGRAPHY Photo Awards — แยกตามสถานะหรือเรียงตามที่คุณต้องการ"
      />

      {/* Filter / Sort bar */}
      <section style={{ padding: '32px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {/* Filter chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { v: 'all', l: 'All', n: PHOTOGRAPHERS.length },
                { v: 'voyageurs', l: 'Voyageurs ◆', n: PHOTOGRAPHERS.filter(p => p.isCustomer).length },
                { v: 'ambassadors', l: 'Ambassadors ★', n: PHOTOGRAPHERS.filter(p => p.isAmbassador).length },
                { v: 'general', l: 'Photographers', n: PHOTOGRAPHERS.filter(p => !p.isCustomer && !p.isAmbassador).length },
              ].map(f => {
                const active = filter === f.v;
                return (
                  <button
                    key={f.v}
                    onClick={() => setFilter(f.v)}
                    style={{
                      padding: '9px 16px',
                      border: '1px solid ' + (active ? 'var(--fg)' : 'var(--rule)'),
                      background: active ? 'var(--fg)' : 'transparent',
                      color: active ? 'var(--bg)' : 'var(--fg)',
                      fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}>
                    <span>{f.l}</span>
                    <span style={{ opacity: .55, fontFamily: 'var(--mono)' }}>{f.n}</span>
                  </button>
                );
              })}
            </div>
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="caps" style={{ opacity: .55 }}>Sort</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{
                padding: '8px 12px', border: '1px solid var(--rule)', background: 'transparent', color: 'var(--fg)',
                font: 'inherit', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
                <option value="featured">Featured</option>
                <option value="followers">Most followers</option>
                <option value="photos">Most photos</option>
                <option value="newest">Newest joined</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '56px 0 96px' }}>
        <div className="wrap">
          {list.length === 0 ? (
            <div style={{ padding: '120px 0', textAlign: 'center', color: 'var(--fg-soft)' }} className="th">ไม่พบช่างภาพในตัวกรองนี้</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {list.map(p => (
                <PhotographerCard key={p.username} photographer={p} variant={p.isCustomer ? 'voyageur' : 'general'} />
              ))}
            </div>
          )}

          {/* Footer count */}
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mono">
            <span style={{ fontSize: 11, opacity: .55, letterSpacing: '.14em' }}>SHOWING {list.length} OF {PHOTOGRAPHERS.length} PHOTOGRAPHERS</span>
            <button onClick={() => router.push('/explore')} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid var(--rule)', paddingBottom: 4, opacity: .65 }}>
              Browse photos instead →
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PagePhotographers initialFilter={'all'} />; }
