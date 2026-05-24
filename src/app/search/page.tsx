'use client';
import { Suspense, useState, useRef, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Photo, Photographer } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';

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
      const { data } = await supabase.from('users').select('*').limit(4);
      if (data) {
        setTrendingPhotographers(data.map(p => ({
          username: p.username,
          name: p.display_name || p.username,
          avatar: p.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.username,
          loc: p.location || '',
          followers: p.followers_count || 0,
          photos: 0
        })) as unknown as Photographer[]);
      }
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
            pulse: p.likes_count || 0,
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
                      <div className="aspect-square bg-[var(--tile)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.avatar} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                      <div className="mt-[12px] text-[14px] font-medium">{p.name}</div>
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
