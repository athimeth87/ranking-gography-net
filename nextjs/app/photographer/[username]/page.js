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
  const router = useRouter();

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
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--rule)' }}>
        <div className="wrap">
          {/* Top eyebrow row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {photographer.isAmbassador && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: '#b08e54', color: '#fff', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                  <CrownIcon /> Ambassador
                </span>
              )}
              {photographer.isCustomer && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: 'var(--fg)', color: 'var(--bg)', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                  <VoyageurMark size={7} /> Voyageur
                </span>
              )}
              <span className="mono" style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', opacity: .55 }}>@{photographer.username}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-sm">Message</button>
              <button className="btn btn-sm btn-solid">Follow</button>
            </div>
          </div>

          {/* Big name + avatar composition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'end' }}>
            <div>
              <h1 className="th" style={{
                fontSize: 'clamp(72px, 8.4vw, 128px)',
                fontWeight: 300,
                letterSpacing: '-.035em',
                margin: 0,
                lineHeight: .92,
              }}>{photographer.name}</h1>
              <div style={{ marginTop: 24, display: 'flex', gap: 28, alignItems: 'center' }} className="caps">
                <span style={{ opacity: .65 }}>{photographer.loc}</span>
                <span style={{ opacity: .35 }}>·</span>
                <span style={{ opacity: .65 }}>Joined {photographer.joined}</span>
                <span style={{ opacity: .35 }}>·</span>
                <span style={{ opacity: .65 }}>{photographer.cameras[0]}</span>
              </div>
            </div>
            <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', background: 'var(--tile)', flexShrink: 0 }}>
              <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          {/* Bio */}
          <p className="th" style={{ marginTop: 28, fontSize: 17, lineHeight: 1.55, maxWidth: 720, color: 'var(--fg-soft)', marginBottom: 0 }}>
            {photographer.bio}
          </p>
        </div>
      </section>

      {/* Stat strip + tabs */}
      <section>
        <div className="wrap">

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 32, padding: '32px 0', borderBottom: '1px solid var(--rule)' }} className="mono">
            <ProfileStat label="Photos" val={photographer.photos} />
            <ProfileStat label="Followers" val={photographer.followers.toLocaleString()} />
            <ProfileStat label="Following" val="142" />
            <ProfileStat label="Pulse avg" val={myPhotos.length ? (myPhotos.reduce((s,p) => s+p.pulse, 0)/myPhotos.length).toFixed(0) : '—'} />
            <ProfileStat label="Editor picks" val={myPhotos.filter(p => p.picks.includes('editor')).length} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--rule)' }}>
            {[
              ['photos', 'Photos', myPhotos.length],
              ['galleries', 'Galleries', 3],
              ['favorites', 'Favorites', 28],
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
            myPhotos.length > 0
              ? <PhotoGrid photos={myPhotos} cols={3} />
              : <ProfileEmpty msg="ยังไม่มีภาพในโปรไฟล์นี้" />
          )}

          {tab === 'galleries' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
              {[
                { title: 'Mae Hong Son Loop', count: 18, cover: myPhotos[0]?.src },
                { title: 'Studio sessions', count: 12, cover: PHOTOS.find(p => p.cat === 'Portrait')?.src },
                { title: 'B/W only', count: 8, cover: PHOTOS.find(p => p.cat === 'BW')?.src },
              ].map((g, i) => (
                <div key={i} style={{ cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '4/3', background: 'var(--tile)', overflow: 'hidden' }}>
                    {g.cover && <img src={g.cover} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-.01em' }}>{g.title}</div>
                    <span className="mono" style={{ fontSize: 11, opacity: .55 }}>{g.count} photos</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'favorites' && (
            <div>
              <p className="th" style={{ fontSize: 14, color: 'var(--fg-soft)', marginTop: 0, marginBottom: 32, maxWidth: 600 }}>
                ภาพที่ {photographer.name.split(' ')[0]} เลือกบันทึกไว้ — ตั้งเป็น public โดยช่างภาพ
              </p>
              <PhotoGrid photos={PHOTOS.slice(0, 6)} cols={3} />
            </div>
          )}

          {tab === 'about' && (
            <div>
              {photographer.isCustomer && (
                <div style={{ padding: '32px 36px', background: 'var(--cream)', border: '1px solid var(--rule)', marginBottom: 48, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48, alignItems: 'center' }}>
                  <div>
                    <div className="caps" style={{ opacity: .55, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><VoyageurMark size={9} /> Voyageur</div>
                    <h3 className="th" style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-.015em', margin: 0, lineHeight: 1.25 }}>
                      ลูกค้าทริป GOGRAPHY — มีสิทธิ์ลุ้นรางวัล Voyageurs Awards
                    </h3>
                    <div className="mono" style={{ marginTop: 20, fontSize: 12, lineHeight: 1.9 }}>
                      <div style={{ opacity: .55, marginBottom: 8 }}>TRIPS COMPLETED</div>
                      {(photographer.customerTrips || []).map(t => (
                        <div key={t}>· {t}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 32 }}>
                    <div className="caps" style={{ opacity: .55, marginBottom: 12 }}>Voyageurs · Spring 2026</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7 }} className="th">
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                        <span>Photos submitted</span><span className="mono" style={{ fontWeight: 500 }}>3</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                        <span>Current rank (Landscape)</span><span className="mono" style={{ fontWeight: 500 }}>#7</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span>Cashback tier</span><span className="mono" style={{ fontWeight: 500 }}>5% ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, paddingTop: 16 }}>
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
