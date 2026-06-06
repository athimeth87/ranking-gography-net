'use client';

// Hall of Fame — past Best Photo of Season winners

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSeasons, getPhoto, getPhotographer, getPhotos, getPhotographers } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import { MobileHallOfFame } from '@/components/mobile/MobileHallOfFame';

// ─── helpers ────────────────────────────────────────────────────────────────

function CashbackTier({
  rank,
  label,
  detail,
}: {
  rank: string;
  label: string;
  detail: string;
}) {
  return (
    <div>
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55">
        Rank {rank}
      </div>
      <div className="text-[32px] font-normal tracking-[-0.02em] mt-[12px] leading-[1.1]">
        {label}
      </div>
      <div className="th text-[13px] text-[var(--fg-soft)] mt-[12px] leading-[1.6]">{detail}</div>
    </div>
  );
}

function formatThaiRange(startDateStr: string, endDateStr: string): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  const startMonth = months[start.getMonth()] || '';
  const endMonth = months[end.getMonth()] || '';
  const endYearBE = end.getFullYear() + 543;
  
  return `${startMonth} — ${endMonth} ${endYearBE}`;
}

function formatThaiMonthYear(dateStr?: string): string {
  if (!dateStr) return 'เมษายน 2569';
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const date = new Date(dateStr);
  const month = months[date.getMonth()] || '';
  const yearBE = date.getFullYear() + 543;
  return `${month} ${yearBE}`;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function Page() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [realAllPhotos, setRealAllPhotos] = useState<Photo[]>([]);
  const [realPhotographers, setRealPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setSeasons(getSeasons());
        setRealAllPhotos(getPhotos());
        setRealPhotographers(getPhotographers());
        setLoading(false);
        return;
      }

      try {
        const { data: dbSeasons } = await supabase
          .from('seasons')
          .select('*')
          .order('start_date', { ascending: false });

        const { data: dbWinners } = await supabase
          .from('season_winners')
          .select('*');

        const { data: dbPhotos } = await supabase
          .from('photos')
          .select('*');

        const { data: dbUsers } = await supabase
          .from('users')
          .select('*');

        if (dbSeasons && dbSeasons.length > 0) {
          const users = dbUsers || [];
          const photos = dbPhotos || [];
          const winners = dbWinners || [];

          // Map photographers
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
            cameras: []
          }));
          setRealPhotographers(mappedPhotographers);

          // Map photos
          const mappedPhotos: Photo[] = photos.map(p => {
            const owner = users.find(u => u.id === p.photographer_id);
            const ownerName = owner?.username || owner?.display_name || 'unknown';
            const rawCat = p.category as string;
            const mappedCat = (rawCat === 'bw' ? 'BW' : rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category;

            return {
              id: p.id,
              slug: p.slug || p.id,
              title: p.title,
              by: ownerName,
              avatarUrl: owner?.avatar_url,
              cat: mappedCat,
              w: p.width || 4,
              h: p.height || 3,
              src: p.storage_url,
              caption: p.description || '',
              exif: { camera: p.camera || 'Unknown', lens: p.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
              likes: p.likes_count || 0,
              likes24h: 0,
              comments: p.comments_count || 0,
              favorites: p.favorites_count || 0,
              hours: 24,
              picks: [],
              date: p.uploaded_at,
              voyageurOnly: p.voyageur_only,
              pulse: p.likes_count || 0,
              rank: 0
            };
          });
          setRealAllPhotos(mappedPhotos);

          // Map seasons
          const mappedSeasons: Season[] = dbSeasons.map(s => {
            const seasonWinners = winners.filter(w => w.season_id === s.id);
            
            let winnersRecord: Record<Category, SeasonWinner> | null = null;
            if (seasonWinners.length > 0 && (s.status === 'awarded' || s.status === 'archived')) {
              winnersRecord = {} as Record<Category, SeasonWinner>;
              seasonWinners.forEach(w => {
                const rawCat = w.category;
                const mappedCat = (rawCat === 'bw' ? 'BW' : rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category;
                winnersRecord![mappedCat] = {
                  photoId: w.photo_id,
                  voucher: `${(w.voucher_amount || 50000).toLocaleString()} THB`
                };
              });
            }

            const mappedStatus: 'live' | 'closed' = (s.status === 'awarded' || s.status === 'archived') ? 'closed' : 'live';

            return {
              id: s.id,
              name: s.name,
              range: formatThaiRange(s.start_date, s.end_date),
              status: mappedStatus,
              endDate: s.end_date,
              winners: winnersRecord
            };
          });

          setSeasons(mappedSeasons);
        } else {
          // Fallback to static mock data
          setSeasons(getSeasons());
          setRealAllPhotos(getPhotos());
          setRealPhotographers(getPhotographers());
        }
      } catch (err) {
        console.error('Error fetching Hall of Fame data:', err);
        setSeasons(getSeasons());
        setRealAllPhotos(getPhotos());
        setRealPhotographers(getPhotographers());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="md:hidden">
        <MobileHallOfFame 
          realSeasons={seasons} 
          realAllPhotos={realAllPhotos} 
          realPhotographers={realPhotographers} 
        />
      </div>
      <div className="page-fade hidden md:block">
        <PageCover
          photoId="p010"
          eyebrow="Awards Archive"
          title="Hall of Fame"
          subtitle="ทุก 4 เดือน GOGRAPHY คัดเลือกภาพแห่งฤดูกาลในแต่ละหมวด — ผู้ชนะรับ Voucher 50,000 THB และที่ใน Hall of Fame ตลอดไป"
        />

        {/* Cashback program ribbon */}
        <section className="py-8 md:py-[48px] bg-[var(--cream)] rule-top rule-bot">
          <div className="wrap">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 lg:gap-[48px]">
              <CashbackTier rank="1" label="Best Photo" detail="Voucher 50,000 THB ต่อหมวด" />
              <CashbackTier rank="2–3" label="Cashback 15%" detail="ส่วนลดทริปครั้งถัดไป" />
              <CashbackTier rank="4–10" label="Cashback 3–10%" detail="ส่วนลดทริปครั้งถัดไป" />
            </div>
            <p className="th mt-[32px] text-[12px] text-[var(--fg-soft)] max-w-[720px] leading-[1.7]">
              รางวัลเฉพาะลูกค้าทริป GOGRAPHY ที่ได้รับการรับรองโดยEditorial team —
              ตรวจสอบสถานะลูกค้าได้ที่หน้าโปรไฟล์ของคุณ
            </p>
          </div>
        </section>

        {/* Seasons */}
        <section className="py-[80px]">
          <div className="wrap">
            {loading ? (
              <div className="py-[64px] text-center opacity-50 mono text-[13px]">
                Loading Hall of Fame...
              </div>
            ) : (
              seasons.map((season, idx) => (
                <div key={season.id} className="mb-12 md:mb-20 lg:mb-[80px]">
                  <div
                    className="flex flex-wrap justify-between items-baseline gap-3 pb-4 md:pb-6 mb-6 md:mb-8 border-b border-[var(--fg)]"
                  >
                    <div className="flex items-baseline gap-3 md:gap-[24px] flex-wrap">
                      <span className="mono text-[11px] tracking-[.16em] uppercase opacity-55">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h2
                        className="text-[clamp(28px,6.5vw,56px)] font-normal tracking-[-0.025em] m-0 leading-[1]"
                      >
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

                  {season.status === 'live' || !season.winners ? (
                    <div className="py-[64px] text-center">
                      <p
                        className="th text-[18px] text-[var(--fg-soft)] max-w-[520px] mx-auto"
                      >
                        ฤดูกาลปัจจุบันยังเปิดอยู่ — ผลรางวัลจะประกาศในเดือน{formatThaiMonthYear(season.endDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-[32px]">
                      {(Object.entries(season.winners) as [string, { photoId: string; voucher: string }][]).map(
                        ([cat, w]) => {
                          const photo = realAllPhotos.find(p => p.id === w.photoId) || getPhoto(w.photoId);
                          const photographer = photo ? (realPhotographers.find(p => p.username === photo.by) || getPhotographer(photo.by)) : undefined;
                          if (!photo) return null;
                          return (
                            <div key={cat} className="cursor-pointer">
                              <div
                                className="aspect-[4/5] bg-[var(--tile)] overflow-hidden relative"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.src}
                                  alt={photo.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                                <div
                                  className="absolute top-[12px] left-[12px] bg-[var(--bg)] px-[10px] py-[6px]"
                                >
                                  <div className="caps text-[9px]">
                                    {cat === 'BW' ? 'Black & White' : cat}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-[20px]">
                                <div className="caps opacity-55 mb-[8px]">Winner</div>
                                <h3
                                  className="text-[24px] font-normal tracking-[-0.015em] m-0"
                                >
                                  {photo.title}
                                </h3>
                                <div className="mt-[12px] flex justify-between items-baseline">
                                  <div className="text-[13px] text-[var(--fg-soft)]">
                                    {photographer?.name || photo.by}
                                  </div>
                                  <div className="mono text-[11px] opacity-60">{w.voucher}</div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
