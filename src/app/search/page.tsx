'use client';
import { Suspense, useState, useRef, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Photo, Photographer } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';
import { CrownIcon } from '@/components/icons';

import { computeRankMasters, getWeekKey } from '@/lib/ranking-system';

// ===== Search page (/search) =====
// Query input + filtered results across photos and photographers

const SUGGESTIONS = ['Patagonia', 'Doi Inthanon', 'Portrait', 'Leica', 'fog', 'Wattana', 'Black & White'];

function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get('q') ?? '';

  const [q, setQ] = useState<string>(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  const [photoResults, setPhotoResults] = useState<Photo[]>([]);
  const [photographerResults, setPhotographerResults] = useState<Photographer[]>([]);
  const [trendingPhotographers, setTrendingPhotographers] = useState<Photographer[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
    
    // Fetch trending photographers initially
    const fetchTrending = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: usersData } = await supabase.from('users').select('*');
      const users = usersData || [];

      const { data: photosData } = await supabase.from('photos').select('*');
      const photos = photosData || [];

      const rankMasters = computeRankMasters(photos);

      // Group photos by week key (Monday of the week)
      const photosByWeek: Record<string, any[]> = {};
      photos.forEach(p => {
        const dateStr = p.uploaded_at;
        if (!dateStr) return;
        const wk = getWeekKey(dateStr);
        if (!photosByWeek[wk]) photosByWeek[wk] = [];
        photosByWeek[wk].push(p);
      });

      // Compute rankings per week
      const weekRankings: Record<string, { username: string, totalScore: number }[]> = {};
      Object.entries(photosByWeek).forEach(([wk, weekPhotos]) => {
        const scoresByPhotographer: Record<string, number> = {};
        weekPhotos.forEach(p => {
          const owner = users.find(u => u.id === p.photographer_id);
          const username = owner?.username;
          if (!username) return;
          const pulseScore = (p.likes_count || 0) + (p.favorites_count || 0) * 2;
          scoresByPhotographer[username] = (scoresByPhotographer[username] || 0) + pulseScore;
        });
        const sorted = Object.entries(scoresByPhotographer)
          .map(([username, totalScore]) => ({ username, totalScore }))
          .sort((a, b) => b.totalScore - a.totalScore);
        weekRankings[wk] = sorted;
      });

      const sortedWeeks = Object.keys(photosByWeek).sort();
      const latestWeek = sortedWeeks[sortedWeeks.length - 1];
      const latestRankings = latestWeek ? (weekRankings[latestWeek] || []) : [];

      let trendingList = [];
      if (latestRankings.length > 0) {
        trendingList = latestRankings.slice(0, 4).map((r: { username: string; totalScore: number }) => {
          const owner = users.find(u => u.username === r.username);
          return {
            username: r.username,
            name: owner?.display_name || r.username,
            avatar: owner?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + r.username,
            loc: owner?.location || '',
            followers: owner?.followers_count || 0,
            photos: photos.filter(p => p.photographer_id === owner?.id).length,
            isRankMaster: rankMasters.has(r.username)
          };
        });
      } else {
        trendingList = users.slice(0, 4).map(p => ({
          username: p.username,
          name: p.display_name || p.username,
          avatar: p.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.username,
          loc: p.location || '',
          followers: p.followers_count || 0,
          photos: photos.filter(ph => ph.photographer_id === p.id).length,
          isRankMaster: rankMasters.has(p.username)
        }));
      }

      setTrendingPhotographers(trendingList as unknown as Photographer[]);
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (!q) {
      setPhotoResults([]);
      setPhotographerResults([]);
      // Update URL silently
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('q');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', q);
      window.history.replaceState({}, '', newUrl.toString());

      startTransition(async () => {
        const supabase = getSupabaseBrowserClient();
        
        // Fetch Photographers
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
          .limit(10);

        if (usersData) {
          setPhotographerResults(usersData.map(p => ({
            username: p.username,
            name: p.display_name || p.username,
            avatar: p.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.username,
            loc: p.location || '',
            followers: p.followers_count || 0,
            photos: 0
          })) as unknown as Photographer[]);
        } else {
          setPhotographerResults([]);
        }

        // Fetch Photos
        const { data: photosData } = await supabase
          .from('photos')
          .select('*, users!inner(*)')
          .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
          .limit(20);

        if (photosData) {
          setPhotoResults(photosData.map(p => ({
            id: p.id,
            src: p.image_url,
            title: p.title,
            by: p.users?.username || 'Unknown',
            cat: p.category,
            pulse: p.pulse != null ? Number(p.pulse) : 0,
            peakPulse: p.peak_pulse != null ? Number(p.peak_pulse) : null,
            pickType: p.pick_type || 'none',
            percentile: p.percentile != null ? Number(p.percentile) : null,
            badge: p.badge || null,
            camera: p.camera || 'Unknown',
            lens: p.lens || 'Unknown',
            date: p.uploaded_at,
            voyageurOnly: p.voyageur_only || false
          })) as unknown as Photo[]);
        } else {
          setPhotoResults([]);
        }
      });
    }, 400); // debounce 400ms

    return () => clearTimeout(delayDebounceFn);
  }, [q]);

  return (
    <div className="page-fade">
      <section className="py-10 md:py-[64px]">
        <div className="wrap">
          <div className="caps opacity-55 mb-[24px]">Search</div>

          {/* Search input bar */}
          <div className="flex gap-0 items-baseline border-b-[2px] border-fg pb-[16px]">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาภาพ ช่างภาพ หรือสถานที่"
              className="th font-thai flex-1 bg-transparent border-0 outline-none text-fg font-light tracking-[-.02em] text-[clamp(24px,7vw,64px)]"
            />
            <span className="mono text-[11px] opacity-55">
              {isPending ? 'Searching...' : (q ? `${photoResults.length + photographerResults.length} results` : 'Type to search')}
            </span>
          </div>

          {/* Empty state — suggestions + trending photographers */}
          {!q && (
            <div className="mt-[48px]">
              <div className="caps opacity-55 mb-[20px]">Suggested searches</div>
              <div className="flex flex-wrap gap-[8px]">
                {SUGGESTIONS.map((s: string) => (
                  <button key={s} onClick={() => setQ(s)} className="btn btn-sm btn-ghost">
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-[64px]">
                <div className="caps opacity-55 mb-[20px]">Trending photographers</div>
                <div className="grid gap-4 md:gap-[32px] grid-cols-2 md:grid-cols-4">
                  {trendingPhotographers.map((p: Photographer) => (
                    <Link key={p.username} href={`/photographer/${p.username}`}>
                      {/* aspect-ratio 1/1 avatar tile */}
                      <div className="aspect-square bg-[var(--tile)] overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                        {p.isRankMaster && (
                          <div
                            className="absolute top-2 right-2 z-[2] w-6 h-6 rounded-full bg-fg text-bg grid place-items-center shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
                            title="Rank Master"
                          >
                            <CrownIcon />
                          </div>
                        )}
                      </div>
                      <div className="mt-[12px] text-[14px] font-medium flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isRankMaster && (
                          <span className="opacity-55" title="Rank Master">
                            <CrownIcon />
                          </span>
                        )}
                      </div>
                      <div className="caps opacity-55 mt-[4px]">@{p.username}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {q && (
            <div className="mt-[48px]">
              {photographerResults.length > 0 && (
                <div className="mb-[64px]">
                  <div className="caps opacity-55 mb-[20px]">
                    Photographers · {photographerResults.length}
                  </div>
                  <div className="grid gap-3 md:gap-[24px] grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {photographerResults.map((p: Photographer) => (
                      <Link
                        key={p.username}
                        href={`/photographer/${p.username}`}
                        className="flex gap-[16px] items-center p-[16px] border border-[var(--rule)]"
                      >
                        <div className="w-[56px] h-[56px] rounded-full bg-[var(--tile)] overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-[15px] font-medium">{p.name}</div>
                          <div className="caps opacity-55 mt-[4px]">{p.loc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {photoResults.length > 0 && (
                <div>
                  <div className="caps opacity-55 mb-[20px]">Photos · {photoResults.length}</div>
                  <PhotoGrid photos={photoResults} cols={3} />
                </div>
              )}

              {!isPending && photoResults.length === 0 && photographerResults.length === 0 && (
                <div className="py-[80px] text-center">
                  <div className="th text-[32px] font-light">ไม่พบผลลัพธ์สำหรับ &ldquo;{q}&rdquo;</div>
                  <p className="th text-[var(--fg-soft)] mt-[16px]">
                    ลองค้นหาด้วยคำอื่น หรือเลือกจากคำแนะนำด้านล่าง
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <PageCover
        photoId="p007"
        eyebrow="Search"
        title="Find your photo"
        subtitle="ค้นจากชื่อภาพ ชื่อช่างภาพ สถานที่ หรือหมวดหมู่"
        height="36vh"
        minHeight={300}
        maxHeight={420}
      />
      <Suspense fallback={<div className="wrap py-[96px]" />}>
        <SearchResults />
      </Suspense>
    </>
  );
}
