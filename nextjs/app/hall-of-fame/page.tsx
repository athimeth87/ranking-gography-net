'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PageCover } from '@/components/PageCover';
import { MobileHallOfFame } from '@/components/mobile/MobileHallOfFame';

// ===== Ported from pages/hall-of-fame.jsx =====
// Hall of Fame — past Best Photo of Season winners
// Per founder R8 = "both" — showcase + cashback program in single page.

function PageHallOfFame() {
  return (
    <>
    <div className="md:hidden"><MobileHallOfFame /></div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId="p010"
        eyebrow="Awards Archive"
        title="Hall of Fame"
        subtitle="ทุก 4 เดือน GOGRAPHY คัดเลือกภาพแห่งฤดูกาล — 1 ภาพคะแนนสูงสุดรวมทุกหมวด ได้รับ Voucher 50,000 THB และที่ใน Hall of Fame ตลอดไป"
      />

      {/* Cashback program ribbon */}
      <section className="py-8 md:py-12 rule-top rule-bot" style={{ background: 'var(--cream)' }}>
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <CashbackTier rank="1" label="Best Photo" detail="Voucher 50,000 THB · คะแนนสูงสุดของฤดูกาล" />
            <CashbackTier rank="2–3" label="Cashback 15%" detail="ส่วนลดทริปครั้งถัดไป" />
            <CashbackTier rank="4–10" label="Cashback 3–10%" detail="ส่วนลดทริปครั้งถัดไป" />
          </div>
          <p className="th" style={{ marginTop: 32, fontSize: 12, color: 'var(--fg-soft)', maxWidth: 720, lineHeight: 1.7 }}>
            รางวัลเฉพาะลูกค้าทริป GOGRAPHY ที่ได้รับการรับรองโดยEditorial team — ตรวจสอบสถานะลูกค้าได้ที่หน้าโปรไฟล์ของคุณ
          </p>
        </div>
      </section>

      {/* Seasons */}
      <section className="py-10 md:py-16 lg:py-20">
        <div className="wrap">
          {SEASONS.map((season, idx) => (
            <div key={season.id} className="mb-12 md:mb-20">
              <div className="flex flex-wrap justify-between items-baseline gap-3 pb-4 md:pb-6 mb-6 md:mb-8" style={{ borderBottom: '1px solid var(--fg)' }}>
                <div className="flex items-baseline gap-3 md:gap-6 flex-wrap">
                  <span className="mono text-[11px] uppercase" style={{ letterSpacing: '.16em', opacity: .55 }}>{String(idx + 1).padStart(2,'0')}</span>
                  <h2 className="text-[clamp(28px,6.5vw,56px)] font-normal m-0" style={{ letterSpacing: '-.025em', lineHeight: 1 }}>{season.name}</h2>
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
              ) : (() => {
                const w = season.winner;
                const photo = w && PHOTOS.find(p => p.id === w.photoId);
                const photographer = photo && PHOTOGRAPHERS.find(g => g.username === photo.by);
                if (!photo) return null;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-14 items-start md:items-center">
                    <div className="aspect-[4/5] overflow-hidden relative cursor-pointer" style={{ background: 'var(--tile)' }}>
                      <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 px-2.5 py-1.5" style={{ background: 'var(--bg)' }}>
                        <div className="caps text-[9px]">{photo.cat === 'BW' ? 'Black & White' : photo.cat}</div>
                      </div>
                    </div>
                    <div>
                      <div className="mono text-[11px] uppercase" style={{ letterSpacing: '.18em', opacity: .55 }}>
                        Best Photo of the Season
                      </div>
                      <h3 className="th text-[clamp(28px,5vw,56px)] font-normal mt-5 mb-0" style={{ letterSpacing: '-.022em', lineHeight: 1.1 }}>
                        {photo.title}
                      </h3>
                      <div className="th mt-4 text-[14px] md:text-[16px]" style={{ color: 'var(--fg-soft)' }}>
                        by {photographer?.name}
                      </div>
                      <div className="mt-8 md:mt-9 pt-5 md:pt-6 flex justify-between items-baseline" style={{ borderTop: '1px solid var(--rule)' }}>
                        <div>
                          <div className="caps mb-1.5" style={{ opacity: .55 }}>Prize</div>
                          <div className="mono text-[18px] md:text-[22px] font-medium" style={{ letterSpacing: '-.01em' }}>{w.voucher}</div>
                        </div>
                        <div className="mono text-[11px]" style={{ opacity: .55 }}>
                          PULSE {photo.pulse.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
    </>
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
