'use client';

import Link from 'next/link';
import { getPhoto } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { Footer } from '@/components/layout/Footer';
import { LiveLeaderboard, type LeaderboardEntry } from './LiveLeaderboard';

const TIERS = [
  { t: 'Traveller III', amt: '฿15,000', l: '8% cashback' },
  { t: 'Traveller II', amt: '฿8,000', l: '5% cashback' },
  { t: 'Traveller I', amt: '฿3,000', l: '3% cashback' },
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
  loading,
}: {
  seasons: Season[];
  allPhotos: Photo[];
  photographers: Photographer[];
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
