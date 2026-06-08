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

  const resolvePhotographer = (username: string) => photographers.find((p) => p.username === username);
  const resolvePhoto = (photoId: string) => allPhotos.find((p) => p.id === photoId) ?? getPhoto(photoId);
  const coverSrc = getPhoto('p010').src; // Background image

  // Enhance ranking with cover_url and is_customer from our pre-fetched photographers data
  const rankingEntries = useMemo(() => {
    return (photographersRanking || []).map(r => {
      const owner = resolvePhotographer(r.username);
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
            <h1 className="text-white font-light text-[clamp(48px,9vw,104px)] leading-[.9] tracking-[-.04em] m-0">
              Hall of Fame
            </h1>
            <p className="th text-white/75 text-[15px] leading-[1.6] mt-5 mb-0 max-w-[460px]">
              The best photographers. One global stage. <br/>
              ค้นพบภาพถ่ายและช่างภาพยอดเยี่ยมประจำฤดูกาล
            </p>
          </div>
        </div>
      </section>

      {/* ── Tab Navigation ── */}
      <div className="border-b border-rule sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-12 text-sm font-bold h-[60px] whitespace-nowrap">
            <button
              onClick={() => { setTab('classic'); document.getElementById('ranking')?.scrollIntoView({ behavior: 'smooth' }); }}
              className={cn("h-full flex items-center transition-colors border-b-[3px]", tab === 'classic' ? "text-fg border-fg" : "text-fg-soft border-transparent hover:text-fg")}
            >
              Classic
            </button>
            <button
              onClick={() => { setTab('traveller'); document.getElementById('ranking')?.scrollIntoView({ behavior: 'smooth' }); }}
              className={cn("h-full flex items-center gap-2 transition-colors border-b-[3px]", tab === 'traveller' ? "text-gold border-gold" : "text-fg-soft border-transparent hover:text-gold")}
            >
              Traveller
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16L12 2L2 16H8V22H16V16H22Z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-24">

        {/* TOP 3 THIS SEASON */}
        <section id="ranking" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-lg font-extrabold tracking-widest uppercase flex items-center gap-2 text-fg">
              TOP 3 {tab === 'classic' ? 'CLASSIC' : 'TRAVELLER'}
              <span className="w-4 h-4 rounded-full border border-rule text-[10px] flex items-center justify-center text-fg-soft font-normal">i</span>
            </h2>
          </div>

          {top3.length === 0 ? (
            <div className="text-center py-20 text-fg-soft font-mono text-sm border border-dashed border-rule rounded-xl">
              ยังไม่มีช่างภาพที่ผ่านเกณฑ์ในหมวดหมู่นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4 mt-8">
              {/* RANK 2 */}
              {top3[1] && (
                <Link href={`/photographer/${top3[1].username}`} className="group block bg-tile rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-none border border-rule relative flex flex-col items-center pb-6 mt-12 md:mt-0 hover:shadow-lg transition-all">
                  <div className="absolute top-0 inset-x-0 h-40 bg-rule rounded-t-xl overflow-hidden">
                    <img src={top3[1].cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-tile border border-rule text-fg rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10">2</div>
                  <div className="w-20 h-20 rounded-full border-4 border-[var(--bg)] overflow-hidden mt-28 relative z-10 bg-tile">
                    <img src={top3[1].avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + top3[1].username} className="w-full h-full object-cover" alt="" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold flex items-center gap-2 text-fg">
                    {top3[1].display_name} {top3[1].is_customer && <ProBadge />}
                  </h3>
                  <div className="text-fg-faint text-[10px] font-bold tracking-widest uppercase mt-2">Pulse Score</div>
                  <div className="text-4xl font-extrabold mt-1 text-fg">{top3[1].hof_score}</div>
                </Link>
              )}

              {/* RANK 1 */}
              {top3[0] && (
                <Link href={`/photographer/${top3[0].username}`} className="group block bg-tile rounded-xl shadow-[0_8px_30px_rgb(212,175,55,0.15)] dark:shadow-[0_8px_30px_rgb(212,175,55,0.05)] border border-gold relative flex flex-col items-center pb-8 scale-100 md:scale-105 z-10 transform md:-translate-y-4 hover:shadow-[0_12px_40px_rgb(212,175,55,0.25)] transition-all">
                  <div className="absolute top-0 inset-x-0 h-48 bg-rule rounded-t-xl overflow-hidden">
                    <img src={top3[0].cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                  </div>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-gold text-[var(--bg)] rounded-full flex items-center justify-center font-bold text-lg shadow-md z-10 border-2 border-[var(--bg)]">1</div>
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--bg)] overflow-hidden mt-32 relative z-10 bg-tile shadow-sm">
                    <img src={top3[0].avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + top3[0].username} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="text-gold mt-3"><Crown className="w-6 h-6 drop-shadow-sm" /></div>
                  <h3 className="mt-2 text-2xl font-bold flex items-center gap-2 text-fg">
                    {top3[0].display_name} {top3[0].is_customer && <ProBadge />}
                  </h3>
                  <div className="text-fg-faint text-[10px] font-bold tracking-widest uppercase mt-2">Pulse Score</div>
                  <div className="text-5xl font-extrabold mt-1 text-gold">{top3[0].hof_score}</div>
                </Link>
              )}

              {/* RANK 3 */}
              {top3[2] && (
                <Link href={`/photographer/${top3[2].username}`} className="group block bg-tile rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-none border border-rule relative flex flex-col items-center pb-6 mt-12 md:mt-0 hover:shadow-lg transition-all">
                  <div className="absolute top-0 inset-x-0 h-40 bg-rule rounded-t-xl overflow-hidden">
                    <img src={top3[2].cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-tile border border-rule text-fg rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10">3</div>
                  <div className="w-20 h-20 rounded-full border-4 border-[var(--bg)] overflow-hidden mt-28 relative z-10 bg-tile">
                    <img src={top3[2].avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + top3[2].username} className="w-full h-full object-cover" alt="" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold flex items-center gap-2 text-fg">
                    {top3[2].display_name} {top3[2].is_customer && <ProBadge />}
                  </h3>
                  <div className="text-fg-faint text-[10px] font-bold tracking-widest uppercase mt-2">Pulse Score</div>
                  <div className="text-4xl font-extrabold mt-1 text-fg">{top3[2].hof_score}</div>
                </Link>
              )}
            </div>
          )}

          {/* RUNNER UPS (4-10) */}
          {pack.length > 0 && (
            <div className="max-w-4xl mx-auto mt-16 border-t border-rule">
              {pack.map((e, i) => (
                <Link
                  key={e.photographer_id}
                  href={`/photographer/${e.username}`}
                  className="flex items-center gap-6 lg:gap-10 py-5 border-b border-rule transition-colors hover:bg-tile px-4"
                >
                  <span className="mono tabular-nums text-2xl w-10 text-right text-fg-soft font-bold shrink-0">
                    {String(i + 4).padStart(2, '0')}
                  </span>
                  <div className="w-14 h-14 bg-rule overflow-hidden rounded-full shrink-0">
                    <img src={e.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + e.username} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold truncate flex items-center gap-2 text-fg">
                      {e.display_name} {e.is_customer && <ProBadge />}
                    </div>
                    <div className="text-sm text-fg-soft font-medium mt-0.5">
                      @{e.username} · {e.photo_count} Photos
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-extrabold text-gold">{e.hof_score}</div>
                    <div className="text-[10px] font-bold text-fg-faint uppercase mt-0.5">Pulse Score</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* HALL OF FAME WALL */}
        <section id="wall" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-extrabold tracking-widest uppercase text-fg">HALL OF FAME WALL</h2>
          </div>
          <p className="text-fg-soft font-medium mb-6 text-sm">Honoring the champions of each season.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {seasons.map((season, i) => {
              let topPhoto;
              let topName;
              let topPulse;
              if (season.status === 'live' && top3[0]) {
                topPhoto = top3[0].cover_url;
                topName = top3[0].display_name;
                topPulse = top3[0].hof_score;
              } else if (season.winners) {
                const w = season.winners['Landscape'] || Object.values(season.winners)[0];
                if (w) {
                  const p = resolvePhoto(w.photoId);
                  topPhoto = p?.src;
                  topName = p?.by;
                  topPulse = p?.pulse;
                }
              }

              if (!topPhoto) {
                const backup = recentPhotos[i % recentPhotos.length];
                topPhoto = backup?.src;
                topName = backup?.by;
                topPulse = backup?.pulse;
              }

              return (
                <div key={season.id} className="relative rounded-xl overflow-hidden aspect-[4/5] bg-tile text-white group cursor-pointer shadow-sm border border-rule">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={topPhoto || coverSrc} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

                  <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase drop-shadow-md text-white">{season.name}</span>
                    {season.status === 'live' ? (
                      <span className="bg-green-500 text-[9px] uppercase px-1.5 py-0.5 rounded-[3px] font-bold tracking-wide text-white">Live</span>
                    ) : (
                      <span className="bg-gold text-[9px] uppercase px-1.5 py-0.5 rounded-[3px] font-bold tracking-wide text-white">Winner</span>
                    )}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-1.5 mb-1.5 text-gold">
                      <Crown className="w-4 h-4 shrink-0" /> <span className="font-bold text-white text-lg truncate drop-shadow-sm">{topName || 'Winner'}</span>
                    </div>
                    <div className="text-xs text-gray-200 font-semibold mb-1 uppercase tracking-wide">{season.range || 'N/A'}</div>
                    <div className="text-sm font-bold text-white drop-shadow-sm">Pulse {topPulse?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              );
            })}

            {/* Upload CTA Card */}
            {seasons.length <= 2 && (
              <div className="rounded-xl overflow-hidden aspect-[4/5] bg-tile border border-rule flex flex-col items-center justify-center p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-rule rounded-full flex items-center justify-center text-gold mb-4">
                  <Crown className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-xl mb-6 text-fg">Could your name<br />be next?</h3>
                <Link href="/upload" className="bg-fg text-bg px-6 py-3 rounded-md text-sm font-bold w-full transition-colors">
                  Upload your photo
                </Link>
              </div>
            )}
          </div>
          
          {seasons.length === 1 && (
             <div className="mt-8 text-center text-sm font-medium text-fg-soft bg-cream py-6 rounded-xl border border-rule">
               ฤดูกาลที่ 1 กำลังแข่งขันอยู่ 🏆 ตำนานคนแรกอาจเป็นคุณ
             </div>
          )}
        </section>

        {/* RECENT HALL OF FAME PHOTOS */}
        {recentPhotos.length > 0 && (
          <section id="recent" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-extrabold tracking-widest uppercase text-fg">RECENT HALL OF FAME PHOTOS</h2>
              <Link href="/explore" className="text-gold text-sm font-bold hover:underline flex items-center gap-1">
                View more →
              </Link>
            </div>
            <p className="text-fg-soft font-medium mb-6 text-sm">Top photos from this season.</p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recentPhotos.map(p => (
                <Link key={p.id} href={`/photo/${p.id}`} className="group cursor-pointer block">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-tile relative mb-3 border border-rule">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-3">
                        {/* <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg> {formatCount((p as any).views ?? 0)}</span> */}
                        <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> {formatCount(p.likes ?? 0)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gold">
                        <Crown className="w-3.5 h-3.5" /> {p.pulse?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-full bg-rule overflow-hidden shrink-0 border border-rule">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.by} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="text-sm font-bold truncate flex-1 flex items-center gap-1 text-fg">
                      {p.by} {p.isCustomer && <ProBadge className="scale-[0.85] origin-left" />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
