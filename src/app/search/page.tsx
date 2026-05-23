'use client';
import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPhotos, getPhotographers } from '@/lib/data';
import type { Photo, Photographer } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';

// ===== Search page (/search) =====
// Query input + filtered results across photos and photographers

const SUGGESTIONS = ['Patagonia', 'Doi Inthanon', 'Portrait', 'Leica', 'fog', 'Wattana', 'Black & White'];

function SearchResults() {
  const params = useSearchParams();
  const initialQ = params.get('q') ?? '';

  const [q, setQ] = useState<string>(initialQ);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allPhotos = getPhotos();
  const allPhotographers = getPhotographers();

  const photoResults: Photo[] = q
    ? allPhotos.filter((p: Photo) =>
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.cat.toLowerCase().includes(q.toLowerCase()) ||
        p.caption.toLowerCase().includes(q.toLowerCase()) ||
        p.by.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  const photographerResults: Photographer[] = q
    ? allPhotographers.filter((p: Photographer) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.username.toLowerCase().includes(q.toLowerCase()) ||
        p.loc.toLowerCase().includes(q.toLowerCase())
      )
    : [];

  const trendingPhotographers = allPhotographers.slice(0, 4);

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
              {q ? `${photoResults.length + photographerResults.length} results` : 'Type to search'}
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

              {photoResults.length === 0 && photographerResults.length === 0 && (
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
