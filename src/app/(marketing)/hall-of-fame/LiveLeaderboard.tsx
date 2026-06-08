'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface PhotographerRanking {
  photographer_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  photo_count: number;
  hof_score: number;
  cover_url?: string;
  is_customer?: boolean;
}

export type LeaderboardEntry = PhotographerRanking;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatClose(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function CrownMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" />
    </svg>
  );
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

type Tab = 'classic' | 'traveller';

export function LiveLeaderboard({
  seasonName,
  endDate,
  entries,
  rarityCount,
}: {
  seasonName: string;
  endDate: string;
  entries: PhotographerRanking[];
  rarityCount: number;
}) {
  const [tab, setTab] = useState<Tab>('classic');
  const countdown = useCountdown(endDate);

  const filtered = tab === 'classic'
    ? entries.filter(e => !e.is_customer)
    : entries.filter(e => e.is_customer);

  const rows = filtered.slice(0, 10);
  const leader = rows[0];
  const runners = rows.slice(1, 3);
  const pack = rows.slice(3);

  return (
    <section className="rule-bot">

      {/* ── Section header ── */}
      <div className="wrap border-b border-rule py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="caps text-fg-soft mb-3">01 / Standings — The Race Is On</div>
            <h2 className="text-[clamp(36px,6vw,80px)] font-normal tracking-[-0.035em] leading-[0.92] m-0">
              {seasonName}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="pick solid">● Live now</span>
            <div className="text-right">
              <div className="mono tabular-nums text-[clamp(40px,5vw,64px)] leading-none">
                {countdown ? countdown.days : '—'}<span className="text-[0.38em] text-fg-soft ml-2 align-middle tracking-[0.1em]">DAYS</span>
              </div>
              <div className="caps text-fg-faint mt-1 text-[10px]">
                {countdown && !countdown.over ? `${countdown.hours}h ${countdown.minutes}m · ` : ''}closes {formatClose(endDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 mt-8">
          {([
            { id: 'classic', label: 'Classic' },
            { id: 'traveller', label: 'Traveller', gold: true },
          ] as { id: Tab; label: string; gold?: boolean }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'caps inline-flex items-center gap-2 h-[36px] px-5 border transition-colors text-[10px] tracking-[0.12em]',
                tab === t.id
                  ? 'bg-fg text-bg border-fg'
                  : t.gold
                    ? 'border-rule text-gold hover:border-gold'
                    : 'border-rule text-fg-soft hover:border-fg hover:text-fg'
              )}
            >
              {t.gold && <CrownMark className="w-[11px] h-[11px]" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="wrap py-24 text-center">
          <p className="th text-fg-soft">ยังไม่มีช่างภาพที่ผ่านเกณฑ์ในหมวดนี้</p>
        </div>
      ) : (
        <>
          {/* ── #1 — Full-bleed dark hero ── */}
          {leader && (
            <Link href={`/photographer/${leader.username}`} className="block relative bg-black text-white overflow-hidden group border-b border-[#111]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={leader.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/10" />

              <div className="relative wrap py-14 md:py-20">
                <div className="flex flex-wrap items-end justify-between gap-8">
                  {/* Left: rank + name */}
                  <div className="flex items-end gap-4 md:gap-8">
                    <div className="mono tabular-nums text-[clamp(80px,13vw,180px)] leading-none tracking-[-0.05em] text-white/[0.07] select-none shrink-0">
                      01
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-2 caps text-gold/75 mb-3 text-[10px] tracking-[0.14em]">
                        <CrownMark className="w-3 h-3" /> The Leader
                      </div>
                      <h3 className="text-[clamp(26px,4vw,58px)] font-normal tracking-[-0.025em] leading-[1.0] m-0 text-gold">
                        {leader.display_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/15">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={leader.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <span className="th text-white/45 text-[13px]">@{leader.username}</span>
                        <span className="w-0.5 h-0.5 bg-white/20 rounded-full" />
                        <span className="font-mono text-white/35 text-[12px]">{leader.photo_count} photos</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: score */}
                  <div className="text-right pb-1">
                    <div className="caps text-white/30 mb-2 text-[10px] tracking-[0.15em]">HOF Score</div>
                    <div className="mono tabular-nums text-[clamp(52px,7vw,100px)] leading-none text-gold">
                      {leader.hof_score}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── #2 / #3 ── */}
          {runners.length > 0 && (
            <div className="grid md:grid-cols-2 border-b border-rule">
              {runners.map((e, i) => (
                <Link
                  key={e.photographer_id}
                  href={`/photographer/${e.username}`}
                  className={cn(
                    'group flex items-center gap-5 md:gap-6 px-10 py-7 md:py-10 transition-colors hover:bg-cream',
                    i === 0 ? 'border-b md:border-b-0 md:border-r border-rule' : ''
                  )}
                >
                  <span className="mono tabular-nums text-[clamp(36px,4vw,56px)] text-fg/15 leading-none shrink-0">
                    0{i + 2}
                  </span>
                  <div className="w-[60px] h-[60px] shrink-0 overflow-hidden bg-tile">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.username}`}
                      alt={e.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] md:text-[20px] font-normal tracking-[-0.015em] truncate">{e.display_name}</div>
                    <div className="th text-[12px] text-fg-soft mt-1.5">@{e.username} · {e.photo_count} photos</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="mono tabular-nums text-[clamp(22px,2.5vw,34px)] leading-none text-gold">{e.hof_score}</div>
                    <div className="caps text-fg-faint text-[9px] mt-1">HOF Score</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── #4–10 table ── */}
          {pack.length > 0 && (
            <div className="wrap">
              <div className="flex items-center justify-between pt-8 pb-3 border-b border-fg caps text-[9px] tracking-[0.14em] text-fg-faint">
                <span>The chasing pack</span>
                <span>HOF Score</span>
              </div>
              {pack.map((e, i) => (
                <Link
                  key={e.photographer_id}
                  href={`/photographer/${e.username}`}
                  className="flex items-center gap-5 md:gap-7 py-4 border-b border-rule transition-colors hover:bg-cream"
                >
                  <span className="mono tabular-nums text-[18px] md:text-[22px] w-8 text-right text-fg/20 leading-none shrink-0">
                    {String(i + 4).padStart(2, '0')}
                  </span>
                  <div className="w-9 h-9 shrink-0 overflow-hidden rounded-full bg-tile">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.username}`}
                      alt={e.display_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] md:text-[17px] font-normal tracking-[-0.01em] truncate">{e.display_name}</div>
                    <div className="th text-[12px] text-fg-soft mt-0.5 truncate">@{e.username} · {e.photo_count} photos</div>
                  </div>
                  <div className="mono tabular-nums text-[18px] md:text-[22px] leading-none text-gold shrink-0">{e.hof_score}</div>
                </Link>
              ))}
            </div>
          )}

          {/* ── CTA + rarity ── */}
          <div className="wrap py-14 md:py-20">
            <div className="border border-dashed border-rule-strong p-8 lg:p-14 grid md:grid-cols-[1fr_auto] md:items-center gap-7">
              <div>
                <div className="caps text-fg-faint">Reserved</div>
                <div className="th text-[clamp(20px,2.5vw,34px)] tracking-[-0.01em] mt-3">ที่นี่รอชื่อของคุณ</div>
                <div className="th text-[13px] text-fg-soft mt-2">ช่างภาพคนต่อไปบน Hall of Fame อาจเป็นคุณ</div>
              </div>
              <Link href="/upload" className="btn btn-solid justify-self-start md:justify-self-end whitespace-nowrap">
                <span className="th">ส่งภาพเข้าแข่ง →</span>
              </Link>
            </div>
            <p className="th text-center text-[13px] text-fg-soft mt-10">
              {rarityCount > 0 ? (
                <>มีเพียง <span className="mono tabular-nums">{rarityCount}</span> ช่างภาพเท่านั้น ที่เคยได้ขึ้น Hall of Fame</>
              ) : (
                <>ยังไม่มีช่างภาพคนไหนได้ขึ้น Hall of Fame — จงเป็นตำนานคนแรก</>
              )}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
