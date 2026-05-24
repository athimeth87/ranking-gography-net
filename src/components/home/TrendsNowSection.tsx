import Link from 'next/link';
import type { Photo } from '@/lib/types';
import { getPhotographer } from '@/lib/data';

interface TrendsNowSectionProps {
  photos: Photo[];
}

export function TrendsNowSection({ photos }: TrendsNowSectionProps) {
  const top9 = photos.slice(0, 9);
  if (top9.length === 0) return null;

  return (
    <section className="py-[64px] border-t border-rule">
      <div className="wrap">
        <div className="flex items-end justify-between pb-[20px] mb-[28px] border-b border-rule">
          <div className="flex items-baseline gap-[16px]">
            <h2 className="text-[36px] md:text-[44px] font-normal tracking-[-.02em] leading-none m-0">
              Trends Now
            </h2>
            <span className="mono text-[11px] tracking-[.18em] uppercase opacity-55 hidden sm:inline">
              Past Week · Top 9
            </span>
          </div>
          <Link href="/explore" className="caps border-b border-current pb-1 whitespace-nowrap">
            See all →
          </Link>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[48px] gap-y-[2px]">
          {top9.map((photo, i) => {
            const photographer = getPhotographer(photo.by);
            return (
              <li key={photo.id} className="border-t border-rule first:border-t-0 md:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(3)]:border-t-0">
                <Link
                  href={`/photo/${photo.id}`}
                  className="grid grid-cols-[40px_76px_1fr] gap-[18px] items-center py-[16px] group"
                >
                  <span className="mono text-[22px] font-medium tabular-nums opacity-45 group-hover:opacity-100 transition-opacity">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-[76px] h-[96px] overflow-hidden bg-tile">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium tracking-[-.005em] truncate">
                      {photo.title}
                    </div>
                    <div className="mono text-[10px] tracking-[.16em] uppercase opacity-55 mt-[4px] truncate">
                      {photographer?.name ?? photo.by}
                    </div>
                    <div className="flex items-baseline gap-[10px] mt-[8px]">
                      <span className="mono text-[10px] tracking-[.14em] uppercase opacity-65">
                        {photo.cat}
                      </span>
                      <span className="opacity-40 text-[10px]">·</span>
                      <span className="mono text-[11px] tabular-nums">
                        Pulse {Math.round(photo.pulse)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
