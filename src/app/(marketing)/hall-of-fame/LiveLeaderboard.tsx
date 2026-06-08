'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export interface PhotographerRanking {
  photographer_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  photo_count: number;
  hof_score: number;
  cover_url?: string; // added from frontend join
  is_customer?: boolean; // Traveller flag
}

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
    <section className="py-16 md:py-24 rule-bot">
      <div className="wrap">
        {/* ── header ── */}
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <div>
            <div className="caps text-fg-soft mb-4">01 / Standings — The Race Is On</div>
            <h2 className="text-[clamp(40px,7vw,84px)] font-normal tracking-[-0.03em] leading-[0.95] m-0">
              {seasonName}
            </h2>
            <span className="pick solid mt-5 inline-block">● Live now</span>
          </div>
          <div className="text-right">
            <div className="mono tabular-nums text-[clamp(52px,8vw,96px)] leading-[0.8]">
              {countdown ? countdown.days : '—'}
            </div>
            <div className="caps text-fg-faint mt-3">
              days left{countdown && !countdown.over ? ` · ${countdown.hours}h ${countdown.minutes}m` : ''} · closes {formatClose(endDate)}
            </div>
          </div>
        </div>

        {/* ── tabs ── */}
        <div className="flex gap-2 mt-10 pt-7 border-t border-rule">
          {([
            { id: 'classic', label: 'Classic' },
            { id: 'traveller', label: 'Traveller', gold: true },
          ] as { id: Tab; label: string; gold?: boolean }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`caps inline-flex items-center min-h-[44px] px-5 border transition-colors ${
                tab === t.id
                  ? 'bg-fg text-bg border-fg'
                  : t.gold
                    ? 'border-rule text-gold hover:border-gold'
                    : 'border-rule text-fg-soft hover:border-fg hover:text-fg'
              }`}
            >
              {t.gold && <CrownMark className="w-3.5 h-3.5 mr-2 text-gold" />}
              {t.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="th text-center text-fg-soft py-24">ยังไม่มีช่างภาพที่ผ่านเกณฑ์ในหมวดนี้</p>
        ) : (
          <>
            {/* ── #1 feature spread ── */}
            {leader && (
              <Link
                href={`/photographer/${leader.username}`}
                className="grid md:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-16 items-center mt-16 group"
              >
                <div className="aspect-[4/3] bg-tile overflow-hidden order-1 md:order-none relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={leader.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                    alt={leader.display_name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute bottom-6 left-6 w-24 h-24 rounded-full overflow-hidden border-4 border-bg shadow-xl">
                     <img src={leader.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + leader.username} className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 caps text-gold">
                    <CrownMark className="w-4 h-4" /> The Leader
                  </div>
                  <div className="mono tabular-nums text-[clamp(96px,13vw,180px)] leading-[0.8] tracking-[-0.04em] mt-3 mb-1">
                    01
                  </div>
                  <h3 className="text-[clamp(28px,3.4vw,46px)] font-normal tracking-[-0.02em] leading-[1.05] m-0 text-gold">
                    {leader.display_name}
                  </h3>
                  <div className="th text-[15px] text-fg-soft mt-3 flex items-center gap-4">
                    <span>@{leader.username}</span>
                    <span className="w-1 h-1 bg-rule rounded-full" />
                    <span>{leader.photo_count} Photos</span>
                  </div>
                  <div className="flex items-baseline gap-3 mt-8 pt-6 border-t border-rule">
                    <span className="mono tabular-nums text-[clamp(40px,5vw,64px)] leading-none text-gold">{leader.hof_score}</span>
                    <span className="caps text-fg-faint">HOF Score</span>
                  </div>
                </div>
              </Link>
            )}

            {/* ── #2 / #3 ── */}
            {runners.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mt-16">
                {runners.map((e, i) => (
                  <Link key={e.photographer_id} href={`/photographer/${e.username}`} className="group">
                    <div className="aspect-[3/2] bg-tile overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'}
                        alt={e.display_name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full overflow-hidden border-[3px] border-bg shadow-xl">
                         <img src={e.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + e.username} className="w-full h-full object-cover" alt="" />
                      </div>
                    </div>
                    <div className="flex items-start gap-5 mt-5">
                      <span className="mono tabular-nums text-[clamp(32px,4vw,52px)] leading-[0.8] text-fg-soft">
                        0{i + 2}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[20px] md:text-[24px] font-normal tracking-[-0.015em] truncate m-0">{e.display_name}</h4>
                        <div className="th text-[13px] text-fg-soft truncate mt-1">
                          @{e.username} · {e.photo_count} Photos
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mono tabular-nums text-[22px] md:text-[28px] leading-none text-gold">{e.hof_score}</div>
                        <div className="caps text-fg-faint text-[9px] mt-1">HOF Score</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── #4–10 list ── */}
            {pack.length > 0 && (
              <div className="mt-20">
                <div className="caps text-fg-faint mb-2">The chasing pack</div>
                <div className="border-t border-fg">
                  {pack.map((e, i) => (
                    <Link
                      key={e.photographer_id}
                      href={`/photographer/${e.username}`}
                      className="flex items-center gap-6 lg:gap-10 py-5 border-b border-rule transition-colors hover:bg-cream"
                    >
                      <span className="mono tabular-nums text-[clamp(20px,2.4vw,32px)] w-[56px] text-right text-fg-soft leading-none shrink-0">
                        {String(i + 4).padStart(2, '0')}
                      </span>
                      <div className="w-[56px] h-[56px] bg-tile overflow-hidden rounded-full shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + e.username} alt={e.display_name} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[18px] md:text-[22px] font-normal tracking-[-0.015em] truncate">{e.display_name}</div>
                        <div className="th text-[13px] text-fg-soft truncate mt-1">
                          @{e.username} · {e.photo_count} Photos
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mono tabular-nums text-[20px] md:text-[26px] leading-none text-gold">{e.hof_score}</div>
                        <div className="caps text-fg-faint text-[9px] mt-1">HOF Score</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── empty pedestal CTA ── */}
        <div className="mt-16 border border-dashed border-rule-strong p-10 lg:p-16 grid md:grid-cols-[1fr_auto] md:items-center gap-8">
          <div>
            <div className="caps text-fg-faint">Reserved</div>
            <div className="th text-[clamp(24px,3vw,38px)] tracking-[-0.01em] mt-3">ที่นี่รอชื่อของคุณ</div>
            <div className="th text-[14px] text-fg-soft mt-2">ช่างภาพคนต่อไปบน Hall of Fame อาจเป็นคุณ</div>
          </div>
          <Link href="/upload" className="btn btn-solid justify-self-start md:justify-self-end whitespace-nowrap">
            <span className="th">ส่งภาพเข้าแข่ง →</span>
          </Link>
        </div>

        {/* ── rarity line ── */}
        <p className="th text-center text-[14px] text-fg-soft mt-12">
          {rarityCount > 0 ? (
            <>มีเพียง <span className="mono tabular-nums">{rarityCount}</span> ช่างภาพเท่านั้น ที่เคยได้ขึ้น Hall of Fame</>
          ) : (
            <>ยังไม่มีช่างภาพคนไหนได้ขึ้น Hall of Fame — จงเป็นตำนานคนแรก</>
          )}
        </p>
      </div>
    </section>
  );
}
