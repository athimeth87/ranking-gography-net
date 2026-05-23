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

// ===== Ported from pages/photographer.jsx =====
// Photographer profile — cover + bio + tabbed gallery
// Tabs: Photos / Galleries / Favorites (public) / About — per founder R5 = 4 tabs

function PagePhotographer({ username }) {
  const photographer = PHOTOGRAPHERS.find(p => p.username === username) || PHOTOGRAPHERS[0];
  const myPhotos = PHOTOS.filter(p => p.by === photographer.username);
  const [tab, setTab] = React.useState('photos');
  const [catFilter, setCatFilter] = React.useState('all');
  const router = useRouter();

  // Photos tab — category filter (chips). Mirrors the Explore filter logic.
  const catCounts = {
    all: myPhotos.length,
    Landscape: myPhotos.filter(p => p.cat === 'Landscape').length,
    Portrait: myPhotos.filter(p => p.cat === 'Portrait').length,
    BW: myPhotos.filter(p => p.cat === 'BW').length,
  };
  const filteredPhotos = catFilter === 'all'
    ? myPhotos
    : myPhotos.filter(p => p.cat === catFilter);

  // Favorites = photos this photographer has liked.
  // Until Supabase is wired we mock with a deterministic slice of PHOTOS
  // (excluding their own work).
  const likedPhotos = PHOTOS.filter(p => p.by !== photographer.username).slice(0, 9);

  const eyebrowParts = [
    photographer.isAmbassador ? 'Ambassador' : null,
    photographer.isCustomer ? 'Voyageur' : 'Photographer',
    `@${photographer.username}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="page-fade">
      <PageCover
        src={photographer.cover}
        eyebrow={eyebrowParts}
        title={photographer.name}
        subtitle={photographer.bio}
        credit={`${photographer.loc} · ${myPhotos.length} photos · ${photographer.followers.toLocaleString()} followers`}
        height="50vh"
        minHeight={380}
        maxHeight={560}
      />
      {/* Identity header — typography-first */}
      <section className="py-8 md:py-12 lg:py-16" style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="wrap">
          {/* Top eyebrow row */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-8 md:mb-12">
            <div className="flex items-center gap-2.5 flex-wrap">
              {photographer.isAmbassador && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] uppercase font-medium" style={{ background: '#b08e54', color: '#fff', letterSpacing: '.16em' }}>
                  <CrownIcon /> Ambassador
                </span>
              )}
              {photographer.isCustomer && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] uppercase font-medium" style={{ background: 'var(--fg)', color: 'var(--bg)', letterSpacing: '.16em' }}>
                  <VoyageurMark size={7} /> Voyageur
                </span>
              )}
              <span className="mono text-[11px] uppercase" style={{ letterSpacing: '.18em', opacity: .55 }}>@{photographer.username}</span>
            </div>
            <div className="flex gap-2.5">
              <button className="btn btn-sm">Message</button>
              <button className="btn btn-sm btn-solid">Follow</button>
            </div>
          </div>

          {/* Big name + avatar composition */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-start md:items-end">
            <div>
              <h1 className="th text-[clamp(40px,11vw,128px)] m-0 font-light" style={{ letterSpacing: '-.035em', lineHeight: .92 }}>
                {photographer.name}
              </h1>
              <div className="caps mt-4 md:mt-6 flex gap-3 md:gap-7 items-center flex-wrap">
                <span style={{ opacity: .65 }}>{photographer.loc}</span>
                <span style={{ opacity: .35 }}>·</span>
                <span style={{ opacity: .65 }}>Joined {photographer.joined}</span>
                <span style={{ opacity: .35 }}>·</span>
                <span style={{ opacity: .65 }}>{photographer.cameras[0]}</span>
              </div>
            </div>
            <div className="w-24 h-24 md:w-[140px] md:h-[140px] rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--tile)' }}>
              <img src={photographer.avatar} alt="" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Bio */}
          <p className="th mt-5 md:mt-7 text-[15px] md:text-[17px] mb-0" style={{ lineHeight: 1.55, maxWidth: 720, color: 'var(--fg-soft)' }}>
            {photographer.bio}
          </p>
        </div>
      </section>

      {/* Stat strip + tabs */}
      <section>
        <div className="wrap">

          {/* Stat strip — 2-col on phone with Pulse spanning both, 5-col on desktop */}
          <div
            className="mono grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-8 py-6 md:py-8 [&>*:nth-child(4)]:col-span-2 [&>*:nth-child(4)]:sm:col-span-1"
            style={{ borderBottom: '1px solid var(--rule)' }}
          >
            <ProfileStat label="Photos" val={photographer.photos} />
            <ProfileStat label="Followers" val={photographer.followers.toLocaleString()} />
            <ProfileStat label="Following" val="142" />
            <ProfileStat label="Pulse avg" val={myPhotos.length ? (myPhotos.reduce((s,p) => s+p.pulse, 0)/myPhotos.length).toFixed(0) : '—'} />
            <ProfileStat label="Editor picks" val={myPhotos.filter(p => p.picks.includes('editor')).length} />
          </div>

          {/* Tabs — horizontal scroll on small screens */}
          <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid var(--rule)' }}>
            {[
              ['photos', 'Photos', myPhotos.length],
              ['favorites', 'Favorites', likedPhotos.length],
              ['about', 'About', null],
            ].map(([id, label, count]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: '20px 0',
                fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase',
                borderBottom: tab === id ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                opacity: tab === id ? 1 : .55,
                fontWeight: 500,
              }}>
                {label} {count !== null && <span style={{ opacity: .55, marginLeft: 6 }}>{count}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab content */}
      <section style={{ padding: '48px 0 80px' }}>
        <div className="wrap">
          {tab === 'photos' && (
            myPhotos.length > 0 ? (
              <>
                {/* Category filter chips — same pattern as Explore */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                  {[
                    { v: 'all', l: 'All' },
                    { v: 'Landscape', l: 'Landscape' },
                    { v: 'Portrait', l: 'Portrait' },
                    { v: 'BW', l: 'Black & White' },
                  ].map(c => {
                    const active = catFilter === c.v;
                    const n = catCounts[c.v];
                    if (c.v !== 'all' && n === 0) return null;
                    return (
                      <button
                        key={c.v}
                        onClick={() => setCatFilter(c.v)}
                        style={{
                          padding: '9px 16px',
                          border: '1px solid ' + (active ? 'var(--fg)' : 'var(--rule)'),
                          background: active ? 'var(--fg)' : 'transparent',
                          color: active ? 'var(--bg)' : 'var(--fg)',
                          fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <span>{c.l}</span>
                        <span style={{ opacity: .55, fontFamily: 'var(--mono)' }}>{n}</span>
                      </button>
                    );
                  })}
                </div>
                {filteredPhotos.length > 0
                  ? <PhotoGrid photos={filteredPhotos} cols={3} />
                  : <ProfileEmpty msg="ยังไม่มีภาพในหมวดนี้" />}
              </>
            ) : <ProfileEmpty msg="ยังไม่มีภาพในโปรไฟล์นี้" />
          )}

          {tab === 'favorites' && (
            <div>
              <p className="th" style={{ fontSize: 14, color: 'var(--fg-soft)', marginTop: 0, marginBottom: 32, maxWidth: 600 }}>
                ภาพที่ {photographer.name.split(' ')[0]} กด Like ไว้ — แสดงรสนิยมและสายตาในการดูภาพของช่างภาพคนนี้
              </p>
              {likedPhotos.length > 0
                ? <PhotoGrid photos={likedPhotos} cols={3} />
                : <ProfileEmpty msg="ยังไม่มีภาพที่ Like" />}
            </div>
          )}

          {tab === 'about' && (
            <div>
              {photographer.isCustomer && (
                <div
                  className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 md:gap-12 items-start lg:items-center p-6 md:p-9 mb-8 md:mb-12"
                  style={{ background: 'var(--cream)', border: '1px solid var(--rule)' }}
                >
                  <div>
                    <div className="caps mb-3 flex items-center gap-2" style={{ opacity: .55 }}><VoyageurMark size={9} /> Voyageur</div>
                    <h3 className="th text-[22px] md:text-[26px] m-0 font-normal" style={{ letterSpacing: '-.015em', lineHeight: 1.25 }}>
                      ลูกค้าทริป GOGRAPHY — มีสิทธิ์ลุ้นรางวัล Voyageurs Awards
                    </h3>
                    <div className="mono mt-5 text-[12px]" style={{ lineHeight: 1.9 }}>
                      <div className="mb-2" style={{ opacity: .55 }}>TRIPS COMPLETED</div>
                      {(photographer.customerTrips || []).map(t => (
                        <div key={t}>· {t}</div>
                      ))}
                    </div>
                  </div>
                  <div className="lg:pl-8 lg:border-l pt-6 lg:pt-0" style={{ borderColor: 'var(--rule)', borderTop: '1px solid var(--rule)' }}>
                    <div className="caps mb-3" style={{ opacity: .55 }}>Voyageurs · Spring 2026</div>
                    <div className="th text-[13px]" style={{ lineHeight: 1.7 }}>
                      <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--rule)' }}>
                        <span>Photos submitted</span><span className="mono font-medium">3</span>
                      </div>
                      <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--rule)' }}>
                        <span>Current rank (Landscape)</span><span className="mono font-medium">#7</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Cashback tier</span><span className="mono font-medium">5% ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-20 pt-4">
                <div>
                  <h3 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-.015em', margin: '0 0 20px' }} className="th">เกี่ยวกับ {photographer.name}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--fg-soft)' }} className="th">{photographer.bio}</p>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--fg-soft)', marginTop: 16 }} className="th">
                    ในฤดูกาลที่ผ่านมาเริ่มหันมาทำงานในรูปแบบยาว — สนใจกระบวนการของแสง การรอ และการสะสมภาพในที่เดียวเป็นเวลาหลายปี
                  </p>
                </div>
                <div>
                  <div className="caps" style={{ opacity: .55, marginBottom: 16 }}>Gear</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="mono">
                    {photographer.cameras.map(c => (
                      <li key={c} style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)', fontSize: 13 }}>{c}</li>
                    ))}
                  </ul>
                  <div className="caps" style={{ opacity: .55, marginBottom: 16, marginTop: 32 }}>Categories</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="mono">
                    {[...new Set(myPhotos.map(p => p.cat))].map(c => (
                      <li key={c} style={{ padding: '12px 0', borderBottom: '1px solid var(--rule)', fontSize: 13 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ProfileStat({ label, val }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-.015em' }}>{val}</div>
      <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ProfileEmpty({ msg }) {
  return <div style={{ padding: '120px 0', textAlign: 'center', color: 'var(--fg-soft)' }} className="th">{msg}</div>;
}



// ===== Next.js page wrapper =====
export default function Page({ params }) { return <PagePhotographer username={params.username} />; }
