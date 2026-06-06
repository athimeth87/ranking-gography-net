'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export interface LeaderboardEntry {
  id: string;
  title: string;
  name: string;
  loc: string;
  cat: Category;
  pulse: number;
  src: string;
  voyageur?: boolean;
}

type Tab = 'all' | 'voyageurs' | Category;

const TABS: { id: Tab; label: string; voyageur?: boolean }[] = [
  { id: 'all', label: 'All' },
  { id: 'voyageurs', label: 'Voyageurs', voyageur: true },
  { id: 'Landscape', label: 'Landscape' },
  { id: 'Portrait', label: 'Portrait' },
  { id: 'BW', label: 'Black & White' },
];

function CrownMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="inline-block -mt-0.5 mr-1.5">
      <path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" />
    </svg>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatClose(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

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

export function LiveLeaderboard({
  seasonName,
  endDate,
  entries,
  rarityCount,
}: {
  seasonName: string;
  endDate: string;
  entries: LeaderboardEntry[];
  rarityCount: number;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const countdown = useCountdown(endDate);

  const rows = (
    tab === 'all'
      ? entries
      : tab === 'voyageurs'
        ? entries.filter((e) => e.voyageur)
        : entries.filter((e) => e.cat === tab)
  ).slice(0, 10);

  return (
    <section className="py-12 md:py-[72px] rule-bot">
      <div className="wrap">
        {/* header */}
        <div className="flex flex-wrap justify-between items-end gap-6">
          <div>
            <div className="caps text-fg-soft mb-3">The Race Is On</div>
            <h2 className="text-[clamp(28px,5.5vw,52px)] font-normal tracking-[-0.025em] leading-[1] m-0">
              {seasonName}
            </h2>
            <span className="pick solid mt-4 inline-block">● Live now</span>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="mono tabular-nums text-[clamp(32px,5vw,48px)] leading-none">
                {countdown ? countdown.days : '—'}
              </span>
              <span className="caps text-fg-faint">days left</span>
            </div>
            <div className="mono tabular-nums text-[12px] text-fg-faint mt-2">
              {countdown && !countdown.over ? `${countdown.hours}h ${countdown.minutes}m · ` : ''}
              closes {formatClose(endDate)}
            </div>
          </div>
        </div>

        {/* category tabs */}
        <div className="flex flex-wrap gap-2 mt-8 md:mt-10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'caps min-h-[44px] px-4 border transition-colors',
                tab === t.id
                  ? 'bg-fg text-bg border-fg'
                  : t.voyageur
                    ? 'border-rule text-gold hover:border-fg'
                    : 'border-rule text-fg-soft hover:border-fg hover:text-fg',
              )}
            >
              {t.voyageur && <span className="text-gold"><CrownMark /></span>}
              {t.label}
            </button>
          ))}
        </div>

        {/* leaderboard */}
        <div className="mt-6 rule-top">
          {rows.map((e, i) => (
            <Link
              key={e.id}
              href={`/photo/${e.id}`}
              className={cn(
                'flex items-center gap-4 md:gap-6 py-4 md:py-5 border-b border-rule',
                i === 0 && 'bg-cream',
              )}
            >
              <span
                className={cn(
                  'mono tabular-nums text-right shrink-0 leading-none w-[52px]',
                  i === 0 ? 'text-[clamp(28px,4vw,40px)]' : 'text-[clamp(20px,3vw,30px)] text-fg-soft',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="w-[48px] h-[60px] md:w-[56px] md:h-[70px] bg-tile overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.src} alt={e.title} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'font-normal tracking-[-0.015em] truncate',
                    i === 0 ? 'text-[20px] md:text-[26px]' : 'text-[16px] md:text-[20px]',
                  )}
                >
                  {e.title}
                </div>
                <div className="th text-[12px] md:text-[13px] text-fg-soft truncate mt-1">
                  {e.name}
                  {e.loc ? ` · ${e.loc}` : ''}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="mono tabular-nums text-[18px] md:text-[26px] leading-none">{e.pulse}</div>
                <div className="caps text-fg-faint text-[9px] mt-1">Pulse</div>
              </div>
            </Link>
          ))}
        </div>

        {/* empty pedestal CTA */}
        <div className="mt-8 border border-dashed border-rule-strong p-8 md:p-10 text-center">
          <div className="caps text-fg-faint">Reserved</div>
          <div className="th text-[20px] md:text-[24px] mt-3 tracking-[-0.01em]">ที่นี่รอภาพของคุณ</div>
          <div className="th text-[13px] text-fg-soft mt-2">ภาพต่อไปบน Hall of Fame อาจเป็นของคุณ</div>
          <Link href="/upload" className="btn btn-sm btn-solid mt-6 inline-block">
            <span className="th">ส่งภาพเข้าแข่ง →</span>
          </Link>
        </div>

        {/* rarity line */}
        <p className="th text-center text-[13px] text-fg-soft mt-10">
          {rarityCount > 0 ? (
            <>มีเพียง <span className="mono tabular-nums">{rarityCount}</span> ภาพเท่านั้น ที่เคยได้ขึ้น Hall of Fame</>
          ) : (
            <>ยังไม่มีใครได้ขึ้น Hall of Fame — จงเป็นภาพแรกของประวัติศาสตร์</>
          )}
        </p>
      </div>
    </section>
  );
}
