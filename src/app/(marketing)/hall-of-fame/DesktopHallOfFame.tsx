'use client';

import Link from 'next/link';
import { getPhoto } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import { LiveLeaderboard, type LeaderboardEntry } from './LiveLeaderboard';

const TIERS = [
  { t: 'Rank 1', amt: 'Voucher 50K', l: '15% cashback' },
  { t: 'Rank 2–5', amt: 'Cashback', l: '10% cashback' },
  { t: 'Rank 6–10', amt: 'Cashback', l: '5% cashback' },
  { t: 'Rank 11–50', amt: 'Cashback', l: '3% cashback' },
];

function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" />
    </svg>
  );
}

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

  const leaderboardEntries: LeaderboardEntry[] = allPhotos
    .slice()
    .sort((a, b) => (b.pulse ?? 0) - (a.pulse ?? 0))
    .map((p) => {
      const owner = photographers.find((ph) => ph.username === p.by);
      return {
        id: p.id,
        title: p.title,
        name: owner?.name ?? p.by,
        loc: owner?.loc ?? '',
        cat: p.cat,
        pulse: p.pulse ?? 0,
        src: p.src,
        voyageur: Boolean(owner?.isCustomer || p.voyageurOnly),
      };
    });
  const rarityCount = archived.reduce((n, s) => n + Object.keys(s.winners!).length, 0);

  const resolvePhoto = (photoId: string) => allPhotos.find((p) => p.id === photoId) ?? getPhoto(photoId);
  const resolvePhotographer = (username: string) => photographers.find((p) => p.username === username);
  const coverSrc = getPhoto('p010').src;

  return (
    <div className="page-fade">
      {/* ── Hero ── */}
      <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden text-white bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85" />

        <div className="absolute top-0 inset-x-0 z-10">
          <div className="wrap flex items-center justify-between py-6 caps text-white/80">
            <span>GOGRAPHY · Hall of Fame</span>
            <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white" />Live</span>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 z-10 pb-14 lg:pb-20">
          <div className="wrap">
            <div className="caps text-white/80 mb-6">{liveSeason?.name ?? 'Season 1'} · Awards Archive</div>
            <h1 className="text-[clamp(56px,10vw,140px)] font-normal tracking-[-0.04em] leading-[0.85] m-0 max-w-[14ch]">
              Be the first legend.
            </h1>
            <p className="th text-[clamp(15px,1.6vw,20px)] text-white/85 max-w-[54ch] mt-8 leading-[1.55]">
              ทุก 4 เดือน GOGRAPHY คัดเลือกภาพที่มี Pulse สูงสุดในแต่ละหมวด — ผู้ชนะรับ Voucher 50,000 THB และที่ใน Hall of Fame ตลอดไป
            </p>
          </div>
        </div>
      </div>

      {/* ── 01 — Standings ── */}
      {!loading && liveSeason && leaderboardEntries.length > 0 && (
        <LiveLeaderboard
          seasonName={liveSeason.name}
          endDate={liveSeason.endDate ?? '2026-09-30'}
          entries={leaderboardEntries}
          rarityCount={rarityCount}
        />
      )}

      {/* ── 02 — The Prize ── */}
      <section className="py-20 lg:py-28 bg-cream rule-bot">
        <div className="wrap">
          <div className="caps text-fg-soft">02 / The Prize</div>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 mt-8 items-start">
            <div>
              <div className="text-[clamp(64px,11vw,150px)] font-normal tracking-[-0.04em] leading-[0.8]">
                50,000<span className="mono align-top text-[0.2em] ml-3 tracking-[0.05em]">THB</span>
              </div>
              <div className="caps text-fg-soft mt-6">Best Photo of Season · per category</div>
              <p className="th text-[15px] text-fg-soft mt-5 max-w-[42ch] leading-[1.7]">
                ผู้ชนะแต่ละหมวดรับ Voucher 50,000 บาท และที่นั่งใน Hall of Fame ตลอดไป
              </p>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 caps text-gold">
                <Crown className="w-3.5 h-3.5" /> Voyageur cashback
              </div>
              <p className="th text-[13px] text-fg-soft mt-3 max-w-[40ch] leading-[1.6]">
                ลูกค้าทริป GOGRAPHY ที่ติดอันดับ รับ cashback สำหรับทริปถัดไป
              </p>
              <div className="mt-8 border-t border-fg">
                {TIERS.map((t) => (
                  <div key={t.t} className="grid grid-cols-[1fr_auto] items-center gap-6 py-5 border-b border-rule">
                    <div>
                      <div className="inline-flex items-center gap-2 caps text-gold">
                        <span className="w-1.5 h-1.5 bg-gold rotate-45 inline-block" />{t.t}
                      </div>
                      <div className="caps text-fg-faint mt-2">{t.l}</div>
                    </div>
                    <div className="mono tabular-nums text-[26px] lg:text-[30px]">{t.amt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02.5 — Photographer Standings ── */}
      {photographersRanking && photographersRanking.length > 0 && (
        <section className="py-20 lg:py-28 bg-[#111] text-white rule-bot">
          <div className="wrap">
            <div className="caps text-white/50 mb-10">02 / Top Photographers (V5 Logic)</div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 items-center px-6 py-3 caps text-[10px] text-white/40 border-b border-white/10">
                <div className="w-8 text-center">Rank</div>
                <div>Photographer</div>
                <div className="w-24 text-right">Photos</div>
                <div className="w-32 text-right">HOF Score</div>
                <div className="w-32 text-right">Status</div>
              </div>
              {photographersRanking.map((r, i) => (
                <div key={r.photographer_id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-6 items-center px-6 py-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 text-center mono text-xl text-white/50">{i + 1}</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                      {r.avatar_url && <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="truncate">
                      <div className="text-lg">{r.display_name}</div>
                      <div className="text-sm text-white/50">@{r.username}</div>
                    </div>
                  </div>
                  <div className="w-24 text-right mono">{r.photo_count}</div>
                  <div className="w-32 text-right mono text-xl font-medium">{Number(r.hof_score).toFixed(1)}</div>
                  <div className="w-32 text-right">
                    {Number(r.hof_score) >= 90 ? (
                      <span className="inline-flex px-3 py-1 bg-gold/20 text-gold rounded-full text-xs font-medium">🥇 Season Top</span>
                    ) : Number(r.hof_score) >= 80 ? (
                      <span className="inline-flex px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">✨ Rising Talent</span>
                    ) : (
                      <span className="inline-flex px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-medium">Qualified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 03 — Archive ── */}
      <section className="py-20 lg:py-28">
        <div className="wrap">
          <div className="caps text-fg-soft mb-10">03 / Archive — Past winners</div>
          {loading ? (
            <div className="py-[64px] text-center opacity-50 mono text-[13px]">Loading Hall of Fame...</div>
          ) : archived.length === 0 ? (
            <div className="border border-rule-strong p-12 lg:p-20 text-center">
              <h2 className="text-[clamp(28px,4vw,52px)] font-normal tracking-[-0.025em] leading-[1.05] m-0">
                The first chapter is being written.
              </h2>
              <p className="th text-[15px] text-fg-soft max-w-[48ch] mx-auto mt-5 leading-[1.7]">
                {liveSeason?.name ?? 'Season 1'} ยังเปิดอยู่ — เมื่อปิดฤดูกาล ผู้ชนะกลุ่มแรกจะถูกบันทึกไว้ที่นี่ตลอดไป
              </p>
            </div>
          ) : (
            archived.map((season) => (
              <div key={season.id} className="mb-16 lg:mb-24">
                <div className="flex flex-wrap justify-between items-baseline gap-3 pb-6 mb-8 border-b border-[var(--fg)]">
                  <h2 className="text-[clamp(28px,6.5vw,56px)] font-normal tracking-[-0.025em] m-0 leading-[1]">
                    {season.name}
                  </h2>
                  <span className="caps th opacity-55">{season.range}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-[32px]">
                  {(Object.entries(season.winners!) as [Category, SeasonWinner][]).map(([cat, w]) => {
                    const photo = resolvePhoto(w.photoId);
                    if (!photo) return null;
                    const photographer = resolvePhotographer(photo.by);
                    return (
                      <Link key={cat} href={`/photo/${photo.id}`} className="group">
                        <div className="aspect-[4/5] bg-[var(--tile)] overflow-hidden relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.src} alt={photo.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                          <div className="absolute top-[12px] left-[12px] bg-[var(--bg)] px-[10px] py-[6px]">
                            <div className="caps text-[9px]">{cat === 'BW' ? 'Black & White' : cat}</div>
                          </div>
                        </div>
                        <div className="mt-[20px]">
                          <div className="caps opacity-55 mb-[8px]">Winner</div>
                          <h3 className="text-[24px] font-normal tracking-[-0.015em] m-0">{photo.title}</h3>
                          <div className="mt-[12px] flex justify-between items-baseline">
                            <div className="text-[13px] text-[var(--fg-soft)]">{photographer?.name || photo.by}</div>
                            <div className="mono text-[11px] opacity-60">{w.voucher}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
