'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { useApp } from '@/components/AppProvider';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/me.jsx =====
// User Account pages (/me/*) — wraps all sub-pages with a sticky left sidebar
// Sub-routes: dashboard, photos, favorites, galleries, stats, settings
// Renders different blocks based on userState tweak: 'user' | 'voyageur' | 'photographer'

function PageMe({ section = 'dashboard', userState = 'user' }) {
  const router = useRouter();

  // Map tweak userState → who we render as
  const personaUsername = userState === 'customer' ? 'pim.travels' : userState === 'photographer' ? 'kanthorn' : 'pim.travels';
  const persona = PHOTOGRAPHERS.find(p => p.username === personaUsername);
  const isVoyageur = !!persona.isCustomer;
  const isPhotographer = userState === 'photographer';

  const myPhotos = PHOTOS.filter(p => p.by === persona.username);

  const sections = [
    { id: 'dashboard', label: 'Dashboard', path: '/me' },
    { id: 'photos', label: 'My Photos', path: '/me/photos', count: myPhotos.length, gated: !isPhotographer && !isVoyageur ? 'no-uploads' : null },
    { id: 'favorites', label: 'Favorites', path: '/me/favorites', count: 28 },
    { id: 'galleries', label: 'Galleries', path: '/me/galleries', count: 3 },
    { id: 'stats', label: 'Stats', path: '/me/stats' },
    { id: 'settings', label: 'Settings', path: '/me/settings' },
  ];

  return (
    <div className="page-fade">
      <PageCover
        photoId="p013"
        eyebrow="Your account"
        title="Your dashboard"
        subtitle="ภาพของคุณ คะแนน favorites ทริปกับ GOGRAPHY — รวมที่เดียว"
        height="38vh"
        minHeight={300}
        maxHeight={420}
      />
      <div className="wrap" style={{ padding: '48px 40px 96px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 56, alignItems: 'start' }}>
        {/* ============ SIDEBAR ============ */}
        <aside style={{ position: 'sticky', top: 96, alignSelf: 'start' }}>
          {/* Identity card */}
          <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--rule)', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden', marginBottom: 14 }}>
              <img src={persona.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {isVoyageur && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 7px', background: '#b08e54', color: '#fff', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500, alignSelf: 'flex-start' }}>
                  <VoyageurMark size={7} /> Voyageur
                </span>
              )}
              {isPhotographer && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 7px', background: 'var(--fg)', color: 'var(--bg)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500, alignSelf: 'flex-start' }}>
                  ★ Photographer
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-.005em' }}>{persona.name}</div>
            <div className="caps" style={{ opacity: .55, marginTop: 4 }}>@{persona.username}</div>
            <button onClick={() => router.push(`/photographer/${persona.username}`)} className="caps" style={{ marginTop: 14, cursor: 'pointer', borderBottom: '1px solid var(--rule)', paddingBottom: 3, opacity: .65 }}>
              View public profile →
            </button>
          </div>

          {/* Sidebar nav */}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {sections.map(s => {
              const active = s.id === section;
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(s.path)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', margin: '0 -16px',
                    cursor: 'pointer',
                    background: active ? 'var(--cream)' : 'transparent',
                    borderLeft: '2px solid ' + (active ? 'var(--fg)' : 'transparent'),
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    letterSpacing: active ? '-.005em' : '0',
                    color: active ? 'var(--fg)' : 'var(--fg-soft)',
                    transition: 'background .15s, color .15s',
                  }}>
                  <span>{s.label}</span>
                  {s.count != null && <span className="mono" style={{ fontSize: 11, opacity: .55 }}>{s.count}</span>}
                </button>
              );
            })}
          </nav>

          {/* Upload CTA (photographers + voyageurs only) */}
          {(isPhotographer || isVoyageur) && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
              <button className="btn btn-solid btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push('/upload')}>
                Upload photo
              </button>
              <div className="mono" style={{ fontSize: 10, opacity: .55, marginTop: 12, textAlign: 'center', lineHeight: 1.6 }}>
                TODAY 0/1 · RESETS 00:00 ICT
              </div>
            </div>
          )}

          {/* Apply CTA for plain users */}
          {!isPhotographer && !isVoyageur && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
              <button className="btn btn-sm btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push('/apply-photographer')}>
                Apply as photographer
              </button>
            </div>
          )}

          {/* Sign out */}
          <button onClick={() => router.push('/')} className="caps" style={{ marginTop: 32, opacity: .45, cursor: 'pointer' }}>
            Sign out
          </button>
        </aside>

        {/* ============ CONTENT ============ */}
        <main>
          {section === 'dashboard' && <MeDashboard persona={persona} isVoyageur={isVoyageur} isPhotographer={isPhotographer} myPhotos={myPhotos} />}
          {section === 'photos' && <MePhotos persona={persona} myPhotos={myPhotos} isPhotographer={isPhotographer || isVoyageur} />}
          {section === 'favorites' && <MeFavorites />}
          {section === 'galleries' && <MeGalleries persona={persona} myPhotos={myPhotos} />}
          {section === 'stats' && <MeStats persona={persona} myPhotos={myPhotos} />}
          {section === 'settings' && <MeSettings persona={persona} isVoyageur={isVoyageur} />}
        </main>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function MeDashboard({ persona, isVoyageur, isPhotographer, myPhotos }) {
  const router = useRouter();
  const totalLikes = myPhotos.reduce((s,p) => s + p.likes, 0);
  const totalFav = myPhotos.reduce((s,p) => s + p.favorites, 0);
  const totalPulse = myPhotos.reduce((s,p) => s + p.pulse, 0);
  const editorPicks = myPhotos.filter(p => p.picks.includes('editor')).length;

  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 16 }}>Welcome back</div>
      <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">{persona.name.split(' ')[0]}</h1>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 48, border: '1px solid var(--rule)' }}>
        <DashStat n={myPhotos.length} l="Photos" />
        <DashStat n={totalLikes.toLocaleString()} l="Likes received" border />
        <DashStat n={totalFav.toLocaleString()} l="Favorites" border />
        <DashStat n={totalPulse.toFixed(0)} l="Total Pulse" border />
      </div>

      {/* Voyageur eligibility card */}
      {isVoyageur && (
        <div style={{ marginTop: 32, padding: '28px 32px', background: 'var(--cream)', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
            <div>
              <div className="caps" style={{ opacity: .55, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <VoyageurMark size={9} /> Voyageurs Awards · Spring 2026
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-.01em', margin: 0 }} className="th">
                คุณอยู่อันดับ <strong style={{ fontWeight: 600 }}>#7</strong> ในหมวด Landscape
              </h3>
              <p className="th" style={{ marginTop: 12, fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.7, maxWidth: 480 }}>
                ส่งภาพอีก 5 ภาพในฤดูกาลนี้เพื่อขึ้น Top 5 · เหลือเวลา 42 วัน ก่อนปิดประกวด
              </p>
            </div>
            <div style={{ textAlign: 'right', minWidth: 140 }}>
              <div className="mono" style={{ fontSize: 11, opacity: .55 }}>CASHBACK TIER</div>
              <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-.025em', marginTop: 6, color: '#b08e54' }}>5%</div>
              <button onClick={() => router.push('/for-customers')} className="caps" style={{ marginTop: 14, opacity: .6, borderBottom: '1px solid var(--rule)', paddingBottom: 3, cursor: 'pointer' }}>
                How to reach 10% →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photographer pick alert */}
      {isPhotographer && editorPicks > 0 && (
        <div style={{ marginTop: 32, padding: '24px 28px', background: 'var(--cream)', border: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>★ Editorial recognition</div>
            <div style={{ fontSize: 17, fontWeight: 500 }} className="th">
              คุณได้รับ Editor's Pick {editorPicks} ครั้งในฤดูกาลนี้ — ติดอันดับ Top 10 ของ Pulse Leaderboard
            </div>
          </div>
          <button onClick={() => router.push('/me/stats')} className="btn btn-sm">View stats</button>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ marginTop: 56 }}>
        <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Quick actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <ActionCard title="ส่งภาพใหม่" sub="อัพได้วันละ 1 ภาพ" onClick={() => router.push('/upload')} />
          <ActionCard title="ตอบความเห็น" sub="3 ความเห็นรอตอบ" onClick={() => router.push('/me/photos')} />
          <ActionCard title="โหวต & favorite" sub="ค้นพบภาพใหม่" onClick={() => router.push('/explore')} />
        </div>
      </div>

      {/* Recent photos */}
      {myPhotos.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <div className="caps" style={{ opacity: .55 }}>Your photos this season</div>
            <button onClick={() => router.push('/me/photos')} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid var(--rule)', paddingBottom: 3, opacity: .65 }}>
              See all →
            </button>
          </div>
          <PhotoGrid photos={myPhotos.slice(0, 4)} cols={4} uniform={true} />
        </div>
      )}

      {/* Activity feed */}
      <div style={{ marginTop: 56 }}>
        <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Recent activity</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, lineHeight: 1.7 }}>
          {[
            ['12 นาทีที่แล้ว', <span>ภาพ <strong style={{ fontWeight: 500 }}>"Morning fog, Doi Inthanon"</strong> ได้รับ 24 likes ใหม่</span>],
            ['3 ชม.ที่แล้ว', <span>Phimlapas Suwanlapa บันทึกMy photosเป็น favorite</span>],
            ['เมื่อวาน', <span>Editor's Pick: ภาพ <strong style={{ fontWeight: 500 }}>"His hands"</strong> ติด Pulse #2</span>],
            ['2 วันก่อน', <span>Ambassador Kanthorn Aroonrat follow คุณ</span>],
          ].map(([time, body], i) => (
            <li key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 24, padding: '14px 0', borderBottom: '1px solid var(--rule)' }} className="th">
              <span className="mono" style={{ fontSize: 11, opacity: .55, letterSpacing: '.08em', paddingTop: 2 }}>{String(time).toUpperCase()}</span>
              <span>{body}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DashStat({ n, l, border }) {
  return (
    <div style={{ padding: '24px 24px', borderLeft: border ? '1px solid var(--rule)' : 'none' }}>
      <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1, fontFamily: 'var(--mono)' }}>{n}</div>
      <div className="caps" style={{ opacity: .55, marginTop: 8 }}>{l}</div>
    </div>
  );
}

function ActionCard({ title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '24px 24px', border: '1px solid var(--rule)', textAlign: 'left',
      background: 'transparent', color: 'var(--fg)', cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      transition: 'border-color .15s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--fg)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--rule)'}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-.005em' }} className="th">{title}</div>
        <div className="th" style={{ fontSize: 12, color: 'var(--fg-soft)', marginTop: 4 }}>{sub}</div>
      </div>
      <span style={{ fontSize: 18, opacity: .35 }}>→</span>
    </button>
  );
}

// ============ MY PHOTOS ============
function MePhotos({ persona, myPhotos, isPhotographer }) {
  const router = useRouter();
  const [tab, setTab] = React.useState('all');
  if (!isPhotographer) {
    return <EmptyMe title="คุณยังไม่ได้ลงทะเบียนเป็นช่างภาพ" body="สมัครเป็น Photographer เพื่อเริ่มอัพโหลดภาพ" cta="Apply as photographer" onClick={() => router.push('/apply-photographer')} />;
  }
  // Demo: 1 photo marked hidden
  const visible = myPhotos.slice(0, Math.max(myPhotos.length - 1, 0));
  const hidden = myPhotos.slice(-1);
  const display = tab === 'all' ? myPhotos : tab === 'public' ? visible : tab === 'hidden' ? hidden : [];

  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>My photos</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 24 }}>
        <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">My photos</h1>
        <button className="btn btn-solid btn-sm" onClick={() => router.push('/upload')}>Upload photo</button>
      </div>

      <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid var(--rule)', marginTop: 16 }}>
        {[['all', 'All', myPhotos.length], ['public', 'Public', visible.length], ['hidden', 'Hidden', hidden.length]].map(([id, label, n]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '14px 0', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase',
              borderBottom: active ? '2px solid var(--fg)' : '2px solid transparent', marginBottom: -1,
              cursor: 'pointer', opacity: active ? 1 : .55, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span>{label}</span>
              <span style={{ opacity: .55, fontFamily: 'var(--mono)' }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '32px 0' }}>
        {display.length > 0 ? <PhotoGrid photos={display} cols={3} uniform={true} /> :
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-soft)' }} className="th">ไม่มีภาพในแท็บนี้</div>
        }
      </div>
    </div>
  );
}

// ============ FAVORITES ============
function MeFavorites() {
  const fav = PHOTOS.slice(0, 8);
  const [isPublic, setIsPublic] = React.useState(false);
  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Saved by you</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">Favorites</h1>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ accentColor: 'var(--fg)' }} />
          <span className="caps" style={{ fontSize: 11, opacity: isPublic ? 1 : .55 }}>Show on public profile</span>
        </label>
      </div>
      <p className="th" style={{ marginTop: 16, fontSize: 13, color: 'var(--fg-soft)', maxWidth: 600, lineHeight: 1.7 }}>
        ภาพที่คุณบันทึกไว้ — โดยปกติเป็นส่วนตัว สามารถเปิดให้สาธารณะเห็นได้บน profile ของคุณ
      </p>
      <div style={{ marginTop: 32 }}>
        <PhotoGrid photos={fav} cols={3} uniform={true} />
      </div>
    </div>
  );
}

// ============ GALLERIES ============
function MeGalleries({ persona, myPhotos }) {
  const galleries = [
    { id: 'g1', title: 'Mae Hong Son Loop', count: 18, cover: myPhotos[0]?.src || PHOTOS[0].src, isPublic: true },
    { id: 'g2', title: 'Studio sessions', count: 12, cover: PHOTOS.find(p => p.cat === 'Portrait')?.src, isPublic: false },
    { id: 'g3', title: 'B/W only', count: 8, cover: PHOTOS.find(p => p.cat === 'BW')?.src, isPublic: true },
  ];
  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Curated collections</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">Galleries</h1>
        <button className="btn btn-sm">+ New gallery</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 40 }}>
        {galleries.map(g => (
          <div key={g.id} style={{ cursor: 'pointer' }}>
            <div style={{ aspectRatio: '4/3', background: 'var(--tile)', overflow: 'hidden', position: 'relative' }}>
              <img src={g.cover} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--bg)', padding: '4px 8px' }}>
                <div className="caps" style={{ fontSize: 9 }}>{g.isPublic ? 'Public' : 'Private'}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-.01em' }}>{g.title}</div>
              <span className="mono" style={{ fontSize: 11, opacity: .55 }}>{g.count} photos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ STATS ============
function MeStats({ persona, myPhotos }) {
  const totalLikes = myPhotos.reduce((s,p) => s + p.likes, 0);
  const totalFav = myPhotos.reduce((s,p) => s + p.favorites, 0);
  const avgPulse = myPhotos.length ? (myPhotos.reduce((s,p) => s + p.pulse, 0) / myPhotos.length).toFixed(0) : 0;
  // Synthesize 14-day pulse trend
  const trend = Array.from({ length: 14 }, (_, i) => {
    const base = avgPulse;
    const noise = Math.sin(i * 0.8) * 8 + Math.cos(i * 0.4) * 4;
    return Math.max(5, base * (0.6 + i / 30) + noise);
  });
  const max = Math.max(...trend);

  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Analytics</div>
      <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">Stats</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 40, border: '1px solid var(--rule)' }}>
        <DashStat n={myPhotos.length} l="Photos" />
        <DashStat n={totalLikes.toLocaleString()} l="Likes (90d)" border />
        <DashStat n={totalFav.toLocaleString()} l="Favorites" border />
        <DashStat n={avgPulse} l="Avg Pulse" border />
      </div>

      {/* Pulse trend chart */}
      <div style={{ marginTop: 56 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div className="caps" style={{ opacity: .55 }}>Pulse trend · 14 days</div>
          <div className="mono" style={{ fontSize: 11, opacity: .55 }}>Peak {max.toFixed(0)}</div>
        </div>
        <div style={{ position: 'relative', height: 240, border: '1px solid var(--rule)', padding: '24px 16px 32px' }}>
          <svg viewBox={`0 0 ${trend.length * 40} 200`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => (
              <line key={t} x1="0" y1={200 * t} x2={trend.length * 40} y2={200 * t} stroke="currentColor" strokeOpacity={t === 1 || t === 0 ? .15 : .08} strokeWidth="1" />
            ))}
            {/* Line */}
            <path d={trend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * 40 + 20} ${200 - (v / max) * 180}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" />
            {/* Dots */}
            {trend.map((v, i) => (
              <circle key={i} cx={i * 40 + 20} cy={200 - (v / max) * 180} r="3" fill="currentColor" />
            ))}
          </svg>
          {/* X labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: 8, left: 24, right: 24, fontFamily: 'var(--mono)', fontSize: 9, opacity: .45, letterSpacing: '.1em' }}>
            <span>14D AGO</span>
            <span>7D AGO</span>
            <span>TODAY</span>
          </div>
        </div>
      </div>

      {/* Top performing photos */}
      <div style={{ marginTop: 56 }}>
        <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Top performing this season</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--fg)' }}>
              <th className="caps" style={{ textAlign: 'left', padding: '12px 0', opacity: .55 }}>Photo</th>
              <th className="caps" style={{ textAlign: 'right', padding: '12px 0', opacity: .55 }}>Pulse</th>
              <th className="caps" style={{ textAlign: 'right', padding: '12px 0', opacity: .55 }}>Likes</th>
              <th className="caps" style={{ textAlign: 'right', padding: '12px 0', opacity: .55 }}>Fav</th>
              <th className="caps" style={{ textAlign: 'right', padding: '12px 0', opacity: .55 }}>Rank</th>
            </tr>
          </thead>
          <tbody className="mono" style={{ fontSize: 13 }}>
            {myPhotos.slice(0, 6).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--tile)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={p.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 14 }} className="th">{p.title}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 500 }}>{p.pulse.toFixed(0)}</td>
                <td style={{ textAlign: 'right' }}>{p.likes}</td>
                <td style={{ textAlign: 'right' }}>{p.favorites}</td>
                <td style={{ textAlign: 'right' }}>#{p.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ SETTINGS ============
function MeSettings({ persona, isVoyageur }) {
  // localStorage-backed form state
  const [form, setForm] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('gpa-settings') || '{}'); } catch { return {}; }
  });
  const set = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    try { localStorage.setItem('gpa-settings', JSON.stringify(next)); } catch {}
  };
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Account</div>
      <h1 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">Settings</h1>

      {/* Profile */}
      <SettingsBlock title="Profile">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden' }}>
            <img src={persona.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <button className="btn btn-sm btn-ghost">Change photo</button>
        </div>
        <Row2><Field3 label="Display name"><input className="input" defaultValue={persona.name} /></Field3>
              <Field3 label="Username"><input className="input" defaultValue={persona.username} /></Field3></Row2>
        <Field3 label="Bio"><textarea className="input" rows="3" defaultValue={persona.bio}></textarea></Field3>
        <Row2><Field3 label="Location"><input className="input" defaultValue={persona.loc} /></Field3>
              <Field3 label="Website"><input className="input" placeholder="https://..." /></Field3></Row2>
        <button className="btn btn-solid btn-sm" style={{ marginTop: 24 }}>Save profile</button>
      </SettingsBlock>

      {/* Notifications */}
      <SettingsBlock title="Notifications">
        <Toggle3 label="Email — Likes & favorites" sub="ส่งทุก 24 ชม. (digest)" value={form.email_likes !== false} onChange={v => set('email_likes', v)} />
        <Toggle3 label="Email — Editor's Pick" sub="ส่งทันทีเมื่อภาพคุณถูกเลือก" value={form.email_picks !== false} onChange={v => set('email_picks', v)} />
        <Toggle3 label="Email — Voyageurs Awards updates" sub="เฉพาะ Voyageur" value={form.email_voyageur === true} onChange={v => set('email_voyageur', v)} disabled={!isVoyageur} />
        <Toggle3 label="Email — Newsletter" sub="เดือนละ 1 ครั้ง" value={form.email_news === true} onChange={v => set('email_news', v)} />
      </SettingsBlock>

      {/* Privacy */}
      <SettingsBlock title="Privacy">
        <Toggle3 label="Public favorites" sub="แสดงภาพที่บันทึกไว้บน profile public" value={form.fav_public === true} onChange={v => set('fav_public', v)} />
        <Toggle3 label="Show in directory" sub="ให้ปรากฏในหน้า /photographers" value={form.in_directory !== false} onChange={v => set('in_directory', v)} />
        <Toggle3 label="Allow comments" sub="ให้ผู้อื่นแสดงความเห็นบนภาพคุณ" value={form.allow_comments !== false} onChange={v => set('allow_comments', v)} />
      </SettingsBlock>

      {/* Display */}
      <SettingsBlock title="Display">
        <div style={{ padding: '14px 16px', background: 'var(--cream)', border: '1px solid var(--rule)', fontSize: 12, lineHeight: 1.6 }} className="th">
          ตั้งค่า dark mode และ visual direction ได้ผ่าน <strong>Tweaks panel</strong> ที่มุมล่างขวา — ค่าจะ persist อัตโนมัติ
        </div>
      </SettingsBlock>

      {/* Danger zone */}
      <SettingsBlock title="Danger zone" danger>
        <div style={{ padding: '18px 22px', border: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }} className="th">ลบบัญชีทั้งหมด</div>
              <p className="th" style={{ fontSize: 12, color: 'var(--fg-soft)', marginTop: 6, lineHeight: 1.6, maxWidth: 480 }}>
                ภาพทุกภาพ ความเห็น และ favorites จะถูกลบถาวร — ไม่สามารถกู้คืนได้
              </p>
            </div>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="btn btn-sm" style={{ borderColor: 'var(--fg)', flexShrink: 0 }}>Delete account</button>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setConfirmDelete(false)} className="btn btn-sm btn-ghost">Cancel</button>
                <button className="btn btn-sm" style={{ background: '#a83232', color: '#fff', borderColor: '#a83232' }}>Confirm delete</button>
              </div>
            )}
          </div>
        </div>
      </SettingsBlock>
    </div>
  );
}

function SettingsBlock({ title, children, danger }) {
  return (
    <section style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h3 style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, margin: 0, opacity: .55, color: danger ? '#a83232' : 'var(--fg)' }}>{title}</h3>
        <div style={{ flex: 1, height: 1, background: 'var(--rule)' }}></div>
      </div>
      {children}
    </section>
  );
}

function Field3({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 20 }}>
      <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>{label}</div>
      {children}
    </label>
  );
}

function Row2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>{children}</div>;
}

function Toggle3({ label, sub, value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--rule)', opacity: disabled ? .4 : 1 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }} className="th">{label}</div>
        <div className="th" style={{ fontSize: 12, color: 'var(--fg-soft)', marginTop: 4 }}>{sub}</div>
      </div>
      <button
        disabled={disabled}
        onClick={() => !disabled && onChange(!value)}
        style={{
          width: 44, height: 24,
          background: value ? 'var(--fg)' : 'var(--rule)',
          border: 0, borderRadius: 12, position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background .15s',
          flexShrink: 0,
        }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--bg)', transition: 'left .15s ease',
        }}></span>
      </button>
    </div>
  );
}

function EmptyMe({ title, body, cta, onClick }) {
  return (
    <div style={{ padding: '120px 40px', textAlign: 'center', border: '1px dashed var(--rule)' }}>
      <h2 className="th" style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: 0 }}>{title}</h2>
      <p className="th" style={{ marginTop: 16, color: 'var(--fg-soft)', maxWidth: 440, margin: '16px auto 32px', lineHeight: 1.7 }}>{body}</p>
      {cta && <button className="btn btn-solid" onClick={onClick}>{cta}</button>}
    </div>
  );
}



// ===== Next.js page wrapper =====
function PageWrapper({ params }) { const { userState } = useApp(); return <PageMe section={params.section?.[0] || 'dashboard'} userState={userState} />; }
export default PageWrapper;
