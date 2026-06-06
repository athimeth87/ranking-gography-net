'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSeasons, getPhoto, getPhotos, getPhotographers } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import { MobileHallOfFame } from '@/components/mobile/MobileHallOfFame';
import { LiveLeaderboard, type LeaderboardEntry } from './LiveLeaderboard';

// ===== Season definitions — no DB table needed =====
// Each season is a date range. Winners are computed from actual photo likes within that range.
const SEASON_DEFS: { id: string; name: string; startDate: string; endDate: string; status: 'live' | 'closed' }[] = [
  { id: 'season-1', name: 'Season 1', startDate: '2026-06-01', endDate: '2026-09-30', status: 'live' },
];

const CAT_MAP: Record<string, Category> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  bw: 'BW',
};

// Pick the top photo (by likes) per category from photos uploaded within the season window.
function computeWinners(
  photos: any[],
  startDate: string,
  endDate: string,
): Record<Category, SeasonWinner> | null {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59Z');

  const inWindow = photos.filter(p => {
    const d = new Date(p.uploaded_at);
    return d >= start && d <= end;
  });

  const result: Partial<Record<Category, SeasonWinner>> = {};
  for (const [rawCat, mappedCat] of Object.entries(CAT_MAP)) {
    const pool = inWindow.filter(p => p.category === rawCat);
    if (pool.length === 0) continue;
    const top = pool.reduce((best, p) =>
      (p.likes_count || 0) > (best.likes_count || 0) ? p : best,
    );
    result[mappedCat] = { photoId: top.id, voucher: '50,000 THB' };
  }
  return Object.keys(result).length > 0 ? (result as Record<Category, SeasonWinner>) : null;
}

function formatThaiRange(startDateStr: string, endDateStr: string): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const start = new Date(startDateStr);
  const end   = new Date(endDateStr);
  return `${months[start.getMonth()] ?? ''} — ${months[end.getMonth()] ?? ''} ${end.getFullYear() + 543}`;
}

function formatThaiMonthYear(dateStr?: string): string {
  if (!dateStr) return 'เมษายน 2569';
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const date = new Date(dateStr);
  return `${months[date.getMonth()] ?? ''} ${date.getFullYear() + 543}`;
}

function CashbackTier({ rank, label, detail }: { rank: string; label: string; detail: string }) {
  return (
    <div>
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55">Rank {rank}</div>
      <div className="text-[32px] font-normal tracking-[-0.02em] mt-[12px] leading-[1.1]">{label}</div>
      <div className="th text-[13px] text-[var(--fg-soft)] mt-[12px] leading-[1.6]">{detail}</div>
    </div>
  );
}

export function HallOfFameClient() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();

      // No supabase → fall back to full mock
      if (!supabase) {
        setSeasons(getSeasons());
        setAllPhotos(getPhotos());
        setPhotographers(getPhotographers());
        setLoading(false);
        return;
      }

      try {
        const [{ data: dbPhotos }, { data: dbUsers }] = await Promise.all([
          supabase.from('photos').select('*'),
          supabase.from('users').select('*'),
        ]);

        const photos  = dbPhotos  || [];
        const users   = dbUsers   || [];

        // No real photos yet → fall back to full mock so the page looks right
        if (photos.length === 0) {
          setSeasons(getSeasons());
          setAllPhotos(getPhotos());
          setPhotographers(getPhotographers());
          setLoading(false);
          return;
        }

        // Map users → Photographer
        const mappedPhotographers: Photographer[] = users.map(u => ({
          id: u.id,
          username: u.username || u.display_name || u.id,
          name: u.display_name || u.username || 'User',
          loc: u.location || '',
          bio: u.bio || '',
          avatar: u.avatar_url || '',
          cover: u.cover_url || '',
          followers: 0,
          photos: photos.filter(p => p.photographer_id === u.id).length,
          isAmbassador: u.is_ambassador || false,
          isCustomer: u.is_customer || false,
          joined: u.created_at || '',
          cameras: [],
        }));

        // Map photos → Photo
        const mappedPhotos: Photo[] = photos.map(p => {
          const owner     = users.find(u => u.id === p.photographer_id);
          const ownerName = owner?.username || owner?.display_name || 'unknown';
          const rawCat    = (p.category as string) || 'landscape';
          const mappedCat = (CAT_MAP[rawCat] ?? 'Landscape') as Category;
          return {
            id: p.id, slug: p.slug || p.id,
            title: p.title, by: ownerName, avatarUrl: owner?.avatar_url,
            cat: mappedCat,
            w: p.width || 4, h: p.height || 3,
            src: p.storage_url,
            caption: p.description || '',
            exif: { camera: p.camera || 'Unknown', lens: p.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
            likes: p.likes_count || 0, likes24h: 0,
            comments: p.comments_count || 0, favorites: p.favorites_count || 0,
            hours: 24, picks: [], date: p.uploaded_at,
            voyageurOnly: p.voyageur_only,
            pulse: p.likes_count || 0, rank: 0,
          };
        });

        // Build seasons from static config + computed winners
        const computedSeasons: Season[] = SEASON_DEFS.map(def => ({
          id: def.id,
          name: def.name,
          range: formatThaiRange(def.startDate, def.endDate),
          status: def.status,
          endDate: def.endDate,
          winners: def.status === 'closed'
            ? computeWinners(photos, def.startDate, def.endDate)
            : null,
        }));

        setAllPhotos(mappedPhotos);
        setPhotographers(mappedPhotographers);
        setSeasons(computedSeasons);
      } catch (err) {
        console.error('Hall of Fame fetch error:', err);
        setSeasons(getSeasons());
        setAllPhotos(getPhotos());
        setPhotographers(getPhotographers());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Live leaderboard data (gamification) ──────────────────────────────────
  const liveSeason = seasons.find((s) => s.status === 'live');
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
  const rarityCount = seasons
    .filter((s) => s.status === 'closed' && s.winners)
    .reduce((n, s) => n + Object.keys(s.winners!).length, 0);

  return (
    <>
      <div className="md:hidden">
        <MobileHallOfFame
          realSeasons={seasons}
          realAllPhotos={allPhotos}
          realPhotographers={photographers}
        />
      </div>

      <div className="page-fade hidden md:block">
        <PageCover
          photoId="p010"
          eyebrow="Awards Archive"
          title="Hall of Fame"
          subtitle="ทุก 4 เดือน GOGRAPHY คัดเลือกภาพแห่งฤดูกาลในแต่ละหมวด — ผู้ชนะรับ Voucher 50,000 THB และที่ใน Hall of Fame ตลอดไป"
        />

        {/* Live leaderboard — current season race */}
        {!loading && liveSeason && leaderboardEntries.length > 0 && (
          <LiveLeaderboard
            seasonName={liveSeason.name}
            endDate={liveSeason.endDate ?? '2026-07-18'}
            entries={leaderboardEntries}
            rarityCount={rarityCount}
          />
        )}

        {/* Reward tiers */}
        <section className="py-8 md:py-[48px] bg-[var(--cream)] rule-top rule-bot">
          <div className="wrap">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 lg:gap-[48px]">
              <CashbackTier rank="1"   label="Best Photo"      detail="Voucher 50,000 THB ต่อหมวด" />
              <CashbackTier rank="2–3" label="Cashback 15%"    detail="ส่วนลดทริปครั้งถัดไป" />
              <CashbackTier rank="4–10" label="Cashback 3–10%" detail="ส่วนลดทริปครั้งถัดไป" />
            </div>
            <p className="th mt-[32px] text-[12px] text-[var(--fg-soft)] max-w-[720px] leading-[1.7]">
              รางวัลเฉพาะลูกค้าทริป GOGRAPHY ที่ได้รับการรับรองโดย Editorial team —
              ตรวจสอบสถานะลูกค้าได้ที่หน้าโปรไฟล์ของคุณ
            </p>
          </div>
        </section>

        {/* Season list */}
        <section className="py-[80px]">
          <div className="wrap">
            {loading ? (
              <div className="py-[64px] text-center opacity-50 mono text-[13px]">Loading Hall of Fame...</div>
            ) : (
              seasons.map((season) => {
                // Lookup helpers — check real photos first, fall back to mock accessor
                const resolvePhoto = (photoId: string) =>
                  allPhotos.find(p => p.id === photoId) ?? getPhoto(photoId);
                const resolvePhotographer = (username: string) =>
                  photographers.find(p => p.username === username);

                return (
                  <div key={season.id} className="mb-12 md:mb-20 lg:mb-[80px]">
                    {/* Season header */}
                    <div className="flex flex-wrap justify-between items-baseline gap-3 pb-4 md:pb-6 mb-6 md:mb-8 border-b border-[var(--fg)]">
                      <div className="flex items-baseline gap-3 md:gap-[24px] flex-wrap">
                        <h2 className="text-[clamp(28px,6.5vw,56px)] font-normal tracking-[-0.025em] m-0 leading-[1]">
                          {season.name}
                        </h2>
                        <span className="caps th opacity-55">{season.range}</span>
                      </div>
                      <div>
                        {season.status === 'live' ? (
                          <span className="pick solid">● Live now</span>
                        ) : (
                          <span className="caps opacity-55">Closed</span>
                        )}
                      </div>
                    </div>

                    {/* Winners or placeholder */}
                    {season.status === 'live' || !season.winners ? (
                      <div className="py-[64px] text-center">
                        <p className="th text-[18px] text-[var(--fg-soft)] max-w-[520px] mx-auto">
                          {season.status === 'live'
                            ? `ฤดูกาลปัจจุบันยังเปิดอยู่ — ผลรางวัลจะประกาศในเดือน${formatThaiMonthYear(season.endDate)}`
                            : 'ยังไม่มีภาพในช่วงฤดูกาลนี้'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-[32px]">
                        {(Object.entries(season.winners) as [Category, SeasonWinner][]).map(([cat, w]) => {
                          const photo = resolvePhoto(w.photoId);
                          if (!photo) return null;
                          const photographer = resolvePhotographer(photo.by);
                          return (
                            <div key={cat}>
                              <div className="aspect-[4/5] bg-[var(--tile)] overflow-hidden relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.src} alt={photo.title} loading="lazy" className="w-full h-full object-cover" />
                                <div className="absolute top-[12px] left-[12px] bg-[var(--bg)] px-[10px] py-[6px]">
                                  <div className="caps text-[9px]">{cat === 'BW' ? 'Black & White' : cat}</div>
                                </div>
                              </div>
                              <div className="mt-[20px]">
                                <div className="caps opacity-55 mb-[8px]">Winner</div>
                                <h3 className="text-[24px] font-normal tracking-[-0.015em] m-0">{photo.title}</h3>
                                <div className="mt-[12px] flex justify-between items-baseline">
                                  <div className="text-[13px] text-[var(--fg-soft)]">
                                    {photographer?.name || photo.by}
                                  </div>
                                  <div className="mono text-[11px] opacity-60">{w.voucher}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
