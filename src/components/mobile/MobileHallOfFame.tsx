// @ts-nocheck
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PHOTOS, pulseScore, PHOTOGRAPHERS } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee } from './MobileShared';

const LB_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCloseShort(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${LB_MONTHS[m - 1]} ${y}`;
}

function useMobileCountdown(endIso) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (now === null || !endIso) return null;
  const end = new Date(`${endIso}T23:59:59`).getTime();
  const diff = Math.max(0, end - now);
  return {
    over: diff <= 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

function Crown({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" />
    </svg>
  );
}

function ProBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 5px', borderRadius: 3, background: 'var(--fg)', color: 'var(--bg)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1, marginLeft: 6 }}>
      PRO
    </span>
  );
}

export function MobileHallOfFame({
  realSeasons = [],
  realAllPhotos = [],
  realPhotographers = [],
  photographersRanking = []
}: {
  realSeasons?: any[];
  realAllPhotos?: any[];
  realPhotographers?: any[];
  photographersRanking?: any[];
}) {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const inkBg = dark ? '#fff' : '#000';
  const inkFg = dark ? '#000' : '#fff';
  const tileBg = 'var(--tile)';
  const fgColor = 'var(--fg)';
  const bgRule = 'var(--rule)';

  const coverPhoto = realAllPhotos.find(p => p.id === 'p010') || PHOTOS.find(p => p.id === 'p010') || PHOTOS[0];

  const liveSeason = (realSeasons || []).find(s => s.status === 'live');
  const lbEndDate = liveSeason?.endDate || '2026-09-30';
  const countdown = useMobileCountdown(lbEndDate);

  const lookupName = (by) =>
    (realPhotographers.find(p => p.username === by) || PHOTOGRAPHERS.find(p => p.username === by))?.name || by;

  const resolvePhotographer = (username) => realPhotographers.find(p => p.username === username) || PHOTOGRAPHERS.find(p => p.username === username);

  const rankingEntries = useMemo(() => {
    return (photographersRanking || []).map(r => {
      const owner = resolvePhotographer(r.username);
      return {
        ...r,
        cover_url: r.cover_url || owner?.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        is_customer: owner?.isCustomer ?? false,
      };
    });
  }, [photographersRanking, realPhotographers]);

  const [lbTab, setLbTab] = useState('classic');

  const filteredRanking = useMemo(() => {
    return lbTab === 'classic'
      ? rankingEntries.filter(e => !e.is_customer)
      : rankingEntries.filter(e => e.is_customer);
  }, [lbTab, rankingEntries]);

  const top3 = filteredRanking.slice(0, 3);
  const pack = filteredRanking.slice(3, 10);

  const mono = "'IBM Plex Mono', monospace";
  const thai = "'Noto Sans Thai', sans-serif";
  const serif = "'Playfair Display', serif";

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--fg)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* ── Cinematic Hero Header ── */}
      <section className="relative overflow-hidden bg-black h-[42vh] min-h-[340px] max-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverPhoto.src}
          alt="Hall of Fame"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.32)_0%,rgba(0,0,0,.06)_38%,rgba(0,0,0,.74)_100%)]" />

        {/* content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="pb-8 px-4">
            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/75">
                 <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 align-middle" />
                 {liveSeason?.name || 'LIVE SEASON'}
              </span>
              <span className="h-px w-8 bg-white/30" />
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/55 tabular-nums">
                {countdown ? countdown.days : '—'} DAYS LEFT
              </span>
            </div>
            {/* title */}
            <h1 className="text-white font-light text-[40px] leading-[.9] tracking-[-.04em] m-0">
              Hall of Fame
            </h1>
            <p className="th text-white/75 text-[14px] leading-[1.6] mt-4 mb-0 max-w-[460px]">
              The best photographers. One global stage. <br/>
              ค้นพบภาพถ่ายและช่างภาพยอดเยี่ยมประจำฤดูกาล
            </p>
          </div>
        </div>
      </section>

      {/* ── Coming Soon State ── */}
      <section style={{ padding: '80px 20px 100px', textAlign: 'center' }}>
        <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: fgColor, marginBottom: 16 }}>Season Ranking</div>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>Coming Soon</h2>
        <p style={{ fontFamily: thai, fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.6 }}>
          การจัดอันดับ Hall of Fame จะแสดงผลและประกาศรางวัลเมื่อสิ้นสุดฤดูกาล<br/>
          มาร่วมส่งผลงานและสะสม Pulse Score เพื่อก้าวสู่ระดับโลกไปด้วยกัน
        </p>
      </section>

      <div style={{ height: 48, background: 'var(--cream)' }} />
      <MobileMarquee text="◆ Season 1 is live ◆ Be the first legend ◆" />
      <MobileFooter />
    </div>
  );
}
