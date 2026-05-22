'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { PHOTOS, PHOTOGRAPHERS, voyageurUsernames } from '@/lib/data';
import { PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, RewardIcon } from '@/components/Icons';
import { ViewfinderFrame } from '@/components/ViewfinderFrame';
import { useApp } from '@/components/AppProvider';

function CategoryChips({ value, onChange, showVoyageurs = false }) {
  const router = useRouter();
  const cats = [
    { v: 'All', l: 'All' },
    { v: 'Landscape', l: 'Landscape' },
    { v: 'Portrait', l: 'Portrait' },
    { v: 'BW', l: 'Black & White' },
  ];
  if (showVoyageurs) cats.push({ v: 'Voyageurs', l: 'Voyageurs', luxury: true });
  const GOLD = '#b08e54';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {cats.map(c => {
          const active = value === c.v;
          const lux = c.luxury;
          const bg = active ? (lux ? GOLD : 'var(--fg)') : 'transparent';
          const border = lux ? GOLD : (active ? 'var(--fg)' : 'var(--rule)');
          const fg = active ? (lux ? '#fff' : 'var(--bg)') : (lux ? GOLD : 'var(--fg)');
          return (
            <div key={c.v} style={{ display: 'flex' }}>
              <button onClick={() => onChange(c.v)} style={{ padding: '9px 14px', border: '1px solid ' + border, background: bg, color: fg, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {lux && <CrownIcon />}<span>{c.l}</span>
              </button>
              {active && c.v !== 'All' && (
                <button onClick={() => router.push(c.v === 'Voyageurs' ? '/photographers/voyageurs' : `/explore/${c.v.toLowerCase()}`)} style={{ padding: '9px 10px', border: '1px solid ' + (lux ? GOLD : 'var(--fg)'), borderLeft: 0, background: lux ? GOLD : 'var(--fg)', color: lux ? '#fff' : 'var(--bg)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer' }}>↗</button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mono" style={{ fontSize: 10.5, opacity: .55, letterSpacing: '.1em' }}>↗ OPENS FULL CATEGORY PAGE</div>
    </div>
  );
}

function PhotographerCard({ photographer, variant = 'general' }) {
  const router = useRouter();
  const theirPhotos = PHOTOS.filter(p => p.by === photographer.username).slice(0, 4);
  while (theirPhotos.length < 4) theirPhotos.push(PHOTOS[0]);
  const lastTrip = photographer.customerTrips?.[0];
  return (
    <div onClick={() => router.push(`/photographer/${photographer.username}`)} style={{ cursor: 'pointer', background: variant === 'voyageur' ? 'var(--cream)' : 'transparent', border: '1px solid var(--rule)', padding: 16, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {theirPhotos.slice(0, 4).map((p, i) => (
          <div key={p.id + i} style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
            <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          </div>
        ))}
        <div style={{ position: 'absolute', left: '50%', bottom: -28, transform: 'translateX(-50%)', width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '3px solid ' + (variant === 'voyageur' ? 'var(--cream)' : 'var(--bg)'), background: 'var(--tile)' }}>
          <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      <div style={{ paddingTop: 40, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {variant === 'voyageur' && (
          <div className="caps" style={{ opacity: .7, fontSize: 10, marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <VoyageurMark /><span>Voyageur</span>
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-.005em', marginBottom: 4 }}>{photographer.name}</div>
        <div className="caps" style={{ opacity: .55, fontSize: 10 }}>{photographer.loc}</div>
        {variant === 'voyageur' && lastTrip && (
          <div className="mono" style={{ marginTop: 14, fontSize: 10, letterSpacing: '.06em', opacity: .55, lineHeight: 1.5 }}>◇ {lastTrip}</div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); router.push(`/photographer/${photographer.username}`); }}>
            {variant === 'voyageur' ? 'View collection' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RewardBadge({ icon, label, sub }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', border: '1px solid var(--rule)', minWidth: 180 }}>
      <div style={{ paddingTop: 2 }}><RewardIcon kind={icon} size={20} /></div>
      <div style={{ textAlign: 'left' }}>
        <div className="mono" style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-.01em', lineHeight: 1.1 }}>{label}</div>
        <div className="caps" style={{ opacity: .55, fontSize: 9.5, marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
}

function Step({ n, t, b }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55 }}>{n}</div>
      <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.01em', margin: '12px 0 0', lineHeight: 1.25 }} className="th">{t}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--fg-soft)', marginTop: 14 }} className="th">{b}</p>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { bannerPhotoId, heroPhotoId } = useApp();
  const top = (heroPhotoId !== 'auto' && PHOTOS.find(p => p.id === heroPhotoId)) || PHOTOS[0];
  const banner = PHOTOS.find(p => p.id === bannerPhotoId) || PHOTOS.find(p => p.id === 'p010') || PHOTOS[0];

  const [leaderCat, setLeaderCat] = useState('All');
  let leaderboardSource;
  if (leaderCat === 'All') leaderboardSource = PHOTOS.slice(0);
  else if (leaderCat === 'Voyageurs') leaderboardSource = PHOTOS.filter(p => voyageurUsernames.has(p.by));
  else leaderboardSource = PHOTOS.filter(p => p.cat === leaderCat);
  const leaderboard = leaderboardSource.slice(0, 8);

  const computeAlltime = (p) => p.likes + p.favorites * 2;
  const [alltimeCat, setAlltimeCat] = useState('All');
  let alltimeSource;
  if (alltimeCat === 'All') alltimeSource = PHOTOS.slice();
  else if (alltimeCat === 'Voyageurs') alltimeSource = PHOTOS.filter(p => voyageurUsernames.has(p.by));
  else alltimeSource = PHOTOS.filter(p => p.cat === alltimeCat);
  alltimeSource = alltimeSource.slice().map(p => ({ ...p, _allTimeScore: computeAlltime(p) }));
  alltimeSource.sort((a,b) => b._allTimeScore - a._allTimeScore);
  alltimeSource = alltimeSource.map((p, i) => ({ ...p, rank: i + 1, pulse: p._allTimeScore / 10 }));
  const alltimeBoard = alltimeSource.slice(0, 8);

  const [voyageurCat, setVoyageurCat] = useState('All');
  const allVoyageurPhotos = PHOTOS.filter(p => voyageurUsernames.has(p.by));
  const voyageurLeaderboard = (voyageurCat === 'All' ? allVoyageurPhotos : allVoyageurPhotos.filter(p => p.cat === voyageurCat)).slice(0, 4);

  return (
    <div className="page-fade">
      {/* HERO — 2-tier */}
      <section style={{ position: 'relative' }}>
        <div style={{ position: 'relative', height: '68vh', minHeight: 520, maxHeight: 760, overflow: 'hidden', background: '#000' }}>
          <img src={banner.src} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.08) 35%, rgba(0,0,0,.1) 65%, rgba(0,0,0,.65) 100%)' }} />
          <div style={{ position: 'absolute', top: 32, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', color: '#fff' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', opacity: .85 }}>GOGRAPHY Photo Awards</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', opacity: .85 }}>Spring 2026 · Live</div>
          </div>
          <div style={{ position: 'absolute', left: 40, right: 40, bottom: 48, color: '#fff' }}>
            <div className="wrap" style={{ padding: 0, maxWidth: 'none' }}>
              <h1 className="th" style={{ fontSize: 'clamp(64px, 8vw, 128px)', fontWeight: 300, letterSpacing: '-.035em', margin: 0, lineHeight: .92, color: '#fff', maxWidth: '14ch' }}>
                Photographs<br />that tell stories
              </h1>
              <div style={{ marginTop: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
                <p className="th" style={{ fontSize: 16, lineHeight: 1.55, maxWidth: 460, color: 'rgba(255,255,255,.85)', margin: 0 }}>
                  A photography ranking platform by photographers and travellers — vote, discover, and help choose the photo of the season.
                </p>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => router.push('/explore')} style={{ padding: '12px 22px', background: '#fff', color: '#000', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500, border: 0 }}>Explore the gallery</button>
                  <button onClick={() => router.push('/about-ranking')} style={{ padding: '12px 22px', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500, border: '1px solid rgba(255,255,255,.45)' }}>How Pulse works</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 40, color: 'rgba(255,255,255,.55)' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase' }}>
              Banner: "{banner.title}" by {PHOTOGRAPHERS.find(p => p.username === banner.by)?.name}
            </div>
          </div>
        </div>

        {/* Cover of the week — viewfinder treatment on black */}
        <div style={{ background: '#000', color: '#fff', padding: '80px 0' }}>
          {/* Viewfinder top strip — frame/aperture/shutter metadata */}
          <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 24, color: 'rgba(255,255,255,.65)' }}>
            <div className="caps" style={{ opacity: .85 }}>Cover of the week</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase' }}>★ #1 PULSE {top.pulse.toFixed(0)}</div>
          </div>

          {/* Viewfinder frame — corner brackets only, no grid / crosshair / HUD text */}
          <div className="wrap" style={{ paddingBottom: 28 }}>
            <ViewfinderFrame
              showGrid={false}
              showCrosshair={false}
              showAF={false}
              onClick={() => router.push(`/photo/${top.id}`)}
            >
              <img src={top.src} alt={top.title} style={{ width: '100%', height: 'auto', maxHeight: '78vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </ViewfinderFrame>
          </div>

          <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40 }}>
            <div>
              <h2 className="th" style={{ fontSize: 'clamp(36px, 4.4vw, 64px)', fontWeight: 400, letterSpacing: '-.02em', margin: 0, lineHeight: 1.05, color: '#fff' }}>"{top.title}"</h2>
              <div style={{ marginTop: 16, display: 'flex', gap: 20, alignItems: 'center' }} className="caps">
                <span style={{ opacity: .8 }}>by {PHOTOGRAPHERS.find(p => p.username === top.by)?.name}</span>
                <span style={{ opacity: .4 }}>·</span>
                <span style={{ opacity: .6 }}>{top.exif.camera} · {top.exif.focal}</span>
              </div>
            </div>
            <button onClick={() => router.push(`/photo/${top.id}`)} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.85)', paddingBottom: 4, flexShrink: 0, color: '#fff' }}>View photo →</button>
          </div>
        </div>
      </section>

      {/* Pulse Leaderboard */}
      <section style={{ padding: '40px 0 80px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--rule)' }}>
            <div>
              <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>This week</div>
              <h2 className="th" style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }}>Pulse Leaderboard</h2>
            </div>
            <button onClick={() => router.push(leaderCat === 'Voyageurs' ? '/photographers/voyageurs' : leaderCat === 'All' ? '/explore' : `/explore/${leaderCat.toLowerCase()}`)} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid var(--fg)', paddingBottom: 4 }}>
              See all →
            </button>
          </div>
          <CategoryChips value={leaderCat} onChange={setLeaderCat} showVoyageurs />
          <div style={{ marginTop: 32 }}>
            <PhotoGrid photos={leaderboard} cols={4} showRank showRankDelta uniform />
          </div>
        </div>
      </section>

      {/* All-time */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--rule)' }}>
            <div>
              <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Beyond this week</div>
              <h2 className="th" style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }}>All-time</h2>
              <p className="th" style={{ marginTop: 14, fontSize: 13, color: 'var(--fg-soft)', maxWidth: 540, lineHeight: 1.6 }}>
                Photos older than 1 week — ranked by lifetime engagement (likes + favorites), without time decay
              </p>
            </div>
            <button onClick={() => router.push('/explore')} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid var(--fg)', paddingBottom: 4 }}>See archive →</button>
          </div>
          <CategoryChips value={alltimeCat} onChange={setAlltimeCat} showVoyageurs />
          <div style={{ marginTop: 32 }}>
            <PhotoGrid photos={alltimeBoard} cols={4} showRank showRankDelta uniform pulseLabel="Total" />
          </div>
        </div>
      </section>

      {/* Featured Photographers */}
      <section style={{ padding: '40px 0 96px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 28, marginBottom: 32, borderBottom: '1px solid var(--rule)' }}>
            <div>
              <div className="caps" style={{ opacity: .55, marginBottom: 12 }}>Featured Photographers · Week 12</div>
              <h2 className="th" style={{ fontSize: 'clamp(36px, 4.2vw, 56px)', fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }}>Featured Photographers</h2>
            </div>
            <button onClick={() => router.push('/photographers')} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid var(--fg)', paddingBottom: 4 }}>
              View all photographers →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {PHOTOGRAPHERS.filter(p => !p.isCustomer).slice(0, 4).map(p => (
              <PhotographerCard key={p.username} photographer={p} variant="general" />
            ))}
          </div>
        </div>
      </section>

      {/* Voyageurs activation */}
      <section style={{ padding: '96px 0', background: 'var(--cream)' }} className="rule-top rule-bot">
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 32, borderBottom: '1px solid var(--rule)', marginBottom: 56 }}>
            <div className="caps" style={{ opacity: .55, display: 'flex', alignItems: 'center', gap: 8 }}>
              <VoyageurMark size={9} /> The Voyageurs Programme
            </div>
            <div className="mono" style={{ fontSize: 11, opacity: .55 }}>EXCLUSIVE · CUSTOMERS ONLY</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <h2 className="th" style={{ fontSize: 'clamp(40px, 4.6vw, 64px)', fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1.05 }}>
                Travelled with us?<br />Become a <em style={{ fontStyle: 'normal', fontWeight: 500 }}>Voyageur</em>
              </h2>
              <p style={{ marginTop: 28, fontSize: 17, lineHeight: 1.65, color: 'var(--fg-soft)', maxWidth: 520 }} className="th">
                Customers who have travelled with GOGRAPHY earn <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Voyageur</strong> status — eligible to submit photos in a customer-only category. Each season the winner receives a 50,000 THB voucher, and the top 10 receive cashback on their next trip.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
                <RewardBadge icon="voucher" label="50,000 THB" sub="Voucher · ต่อหมวด" />
                <RewardBadge icon="cashback" label="3–15%" sub="Cashback · Top 10" />
                <RewardBadge icon="star" label="Voyageur" sub="Public badge · ตลอดชีพ" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
                <button className="btn btn-solid" onClick={() => router.push('/for-customers')}>How to join Voyageurs</button>
                <Link href="/hall-of-fame" className="btn">Past winners</Link>
              </div>
            </div>
            <div>
              <div style={{ position: 'relative' }}>
                <div className="pimg" style={{ aspectRatio: '4/5', overflow: 'hidden', cursor: 'pointer' }} onClick={() => router.push('/photo/p015')}>
                  <img src={PHOTOS.find(p => p.id === 'p015').src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--bg)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <VoyageurMark size={8} />
                  <div className="caps" style={{ fontSize: 9 }}>Voyageur Pick</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 80, paddingTop: 56, borderTop: '1px solid var(--rule)' }}>
            <div className="caps" style={{ opacity: .55, marginBottom: 32 }}>How it works · 3 steps</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 56 }}>
              <Step n="01" t="รับการยืนยันสถานะ" b="หลังจบทริป ทีม GOGRAPHY จะ mark บัญชีของคุณเป็น Voyageur ภายใน 7 วัน" />
              <Step n="02" t="อัพโหลดภาพจากทริป" b="ส่งได้วันละ 1 รูปต่อบัญชี · ส่งสะสมต่อเนื่องตลอดฤดูกาล (4 เดือน)" />
              <Step n="03" t="ลุ้นรางวัล" b="ปลายฤดูกาล ทีมงานเลือกภาพดีที่สุดต่อหมวด — ผู้ชนะ 50,000 THB voucher และ Top 10 ได้ cashback 3–15%" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
