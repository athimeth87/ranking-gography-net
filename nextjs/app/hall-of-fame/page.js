'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/hall-of-fame.jsx =====
// Hall of Fame — past Best Photo of Season winners
// Per founder R8 = "both" — showcase + cashback program in single page.

function PageHallOfFame() {
  return (
    <div className="page-fade">
      <PageCover
        photoId="p010"
        eyebrow="Awards Archive"
        title="Hall of Fame"
        subtitle="ทุก 4 เดือน GOGRAPHY คัดเลือกภาพแห่งฤดูกาลในแต่ละหมวด — ผู้ชนะรับ Voucher 50,000 THB และที่ใน Hall of Fame ตลอดไป"
      />

      {/* Cashback program ribbon */}
      <section style={{ padding: '48px 0', background: 'var(--cream)' }} className="rule-top rule-bot">
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48 }}>
            <CashbackTier rank="1" label="Best Photo" detail="Voucher 50,000 THB ต่อหมวด" />
            <CashbackTier rank="2–3" label="Cashback 15%" detail="ส่วนลดทริปครั้งถัดไป" />
            <CashbackTier rank="4–10" label="Cashback 3–10%" detail="ส่วนลดทริปครั้งถัดไป" />
          </div>
          <p className="th" style={{ marginTop: 32, fontSize: 12, color: 'var(--fg-soft)', maxWidth: 720, lineHeight: 1.7 }}>
            รางวัลเฉพาะลูกค้าทริป GOGRAPHY ที่ได้รับการรับรองโดยEditorial team — ตรวจสอบสถานะลูกค้าได้ที่หน้าโปรไฟล์ของคุณ
          </p>
        </div>
      </section>

      {/* Seasons */}
      <section style={{ padding: '80px 0' }}>
        <div className="wrap">
          {SEASONS.map((season, idx) => (
            <div key={season.id} style={{ marginBottom: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 24, marginBottom: 32, borderBottom: '1px solid var(--fg)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55 }}>{String(idx + 1).padStart(2,'0')}</span>
                  <h2 style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }}>{season.name}</h2>
                  <span className="caps th" style={{ opacity: .55 }}>{season.range}</span>
                </div>
                <div>
                  {season.status === 'live'
                    ? <span className="pick solid">● Live now</span>
                    : <span className="caps" style={{ opacity: .55 }}>Closed</span>}
                </div>
              </div>

              {season.status === 'live' ? (
                <div style={{ padding: '64px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 18, color: 'var(--fg-soft)', maxWidth: 520, margin: '0 auto' }} className="th">
                    ฤดูกาลปัจจุบันยังเปิดอยู่ — ผลรางวัลจะประกาศในเดือนเมษายน 2569
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
                  {Object.entries(season.winners).map(([cat, w], wi) => {
                    const photo = PHOTOS.find(p => p.id === w.photoId);
                    const photographer = PHOTOGRAPHERS.find(g => g.username === photo?.by);
                    if (!photo) return null;
                    return (
                      <div key={cat} style={{ cursor: 'pointer' }}>
                        <div style={{ aspectRatio: '4/5', background: 'var(--tile)', overflow: 'hidden', position: 'relative' }}>
                          <img src={photo.src} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', top: 12, left: 12, background: 'var(--bg)', padding: '6px 10px' }}>
                            <div className="caps" style={{ fontSize: 9 }}>{cat === 'BW' ? 'Black & White' : cat}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 20 }}>
                          <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>Winner</div>
                          <h3 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-.015em', margin: 0 }} className="th">{photo.title}</h3>
                          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div style={{ fontSize: 13, color: 'var(--fg-soft)' }}>{photographer?.name}</div>
                            <div className="mono" style={{ fontSize: 11, opacity: .6 }}>{w.voucher}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CashbackTier({ rank, label, detail }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55 }}>Rank {rank}</div>
      <div style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', marginTop: 12, lineHeight: 1.1 }}>{label}</div>
      <div className="th" style={{ fontSize: 13, color: 'var(--fg-soft)', marginTop: 12, lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageHallOfFame />; }
