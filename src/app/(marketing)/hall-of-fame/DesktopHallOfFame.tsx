'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getPhoto } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function useCountdown(endIso: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const end = new Date(`${endIso}T23:59:59`).getTime();
  const diff = Math.max(0, end - now);
  return {
    over: diff <= 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" />
    </svg>
  );
}

function ProBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center px-[6px] py-[2px] rounded-[4px] bg-fg text-bg text-[9px] font-bold tracking-wider leading-none", className)}>
      PRO
    </span>
  );
}

function formatCount(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

type Tab = 'classic' | 'traveller';

export function DesktopHallOfFame({
  seasons,
  allPhotos,
  photographers,
  photographersRanking,
  loading,
}: {
  seasons: Season[];
  allPhotos: Photo[];
  photographers: Photographer[];
  photographersRanking?: any[];
  loading: boolean;
}) {
  const liveSeason = seasons.find((s) => s.status === 'live');
  const archived = seasons.filter((s) => s.status === 'closed' && s.winners);

  const resolvePhoto = (photoId: string) => allPhotos.find((p) => p.id === photoId) ?? getPhoto(photoId);
  const coverSrc = '/hall-of-fame-cover.jpg'; // Background image

  // Enhance ranking with cover_url and is_customer from our pre-fetched photographers data
  const rankingEntries = useMemo(() => {
    return (photographersRanking || []).map(r => {
      const owner = photographers.find((p) => p.username === r.username);
      return {
        ...r,
        cover_url: r.cover_url || owner?.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        is_customer: owner?.isCustomer ?? false,
      };
    });
  }, [photographersRanking, photographers]);

  const countdown = useCountdown(liveSeason?.endDate ?? '2026-12-31');
  const [tab, setTab] = useState<Tab>('classic');

  const filteredRanking = useMemo(() => {
    return tab === 'classic'
      ? rankingEntries.filter(e => !e.is_customer)
      : rankingEntries.filter(e => e.is_customer);
  }, [tab, rankingEntries]);

  const top3 = filteredRanking.slice(0, 3);
  const pack = filteredRanking.slice(3, 10);

  const recentPhotos = useMemo(() => {
    return [...allPhotos].sort((a, b) => (b.pulse || 0) - (a.pulse || 0)).slice(0, 5);
  }, [allPhotos]);

  return (
    <div className="page-fade min-h-screen text-fg bg-[var(--bg)]">
      {/* ── Cinematic Hero Header ── */}
      <section className="relative overflow-hidden bg-black h-[42vh] min-h-[340px] max-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt="Hall of Fame"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.32)_0%,rgba(0,0,0,.06)_38%,rgba(0,0,0,.74)_100%)]" />

        {/* content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="wrap pb-10 md:pb-16">
            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/75">
                 <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 align-middle" />
                 {liveSeason?.name ?? 'LIVE SEASON'}
              </span>
              <span className="h-px w-10 bg-white/30" />
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/55 tabular-nums">
                {countdown?.days ?? 0} DAYS LEFT
              </span>
            </div>
            {/* title */}
            <h1 className="font-display text-white font-light text-[clamp(48px,9vw,104px)] leading-[.9] tracking-[-.04em] m-0">
              Hall of Fame
            </h1>
            <p className="th text-white/75 text-[15px] leading-[1.6] mt-5 mb-0 max-w-[460px]">
              The best photographers. One global stage. <br/>
              ค้นพบภาพถ่ายและช่างภาพยอดเยี่ยมประจำฤดูกาล
            </p>
          </div>
        </div>
      </section>

      {/* ── Coming Soon State ── */}
      <section className="py-24 text-center">
        <div className="caps text-fg-faint mb-4">Season Ranking</div>
        <h2 className="text-[clamp(36px,5vw,64px)] font-normal tracking-[-0.03em] leading-[1] mb-6">Coming Soon</h2>
        <p className="th text-[14px] text-fg-soft max-w-md mx-auto leading-[1.6]">
          การจัดอันดับ Hall of Fame จะแสดงผลและประกาศรางวัลเมื่อสิ้นสุดฤดูกาล<br/>
          มาร่วมส่งผลงานและสะสม Pulse Score เพื่อก้าวสู่ระดับโลกไปด้วยกัน
        </p>
      </section>

      <Footer />
    </div>
  );
}
