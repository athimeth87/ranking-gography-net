'use client';
import { useRouter } from 'next/navigation';
import type { Photographer, Photo } from '@/lib/types';
import { VoyageurMark } from '@/components/icons';

interface PhotographerCardProps {
  photographer: Photographer;
  variant?: 'general' | 'voyageur';
  photos: Photo[];
}

export function PhotographerCard({
  photographer,
  variant = 'general',
  photos,
}: PhotographerCardProps) {
  const router = useRouter();
  const theirPhotos = photos.filter((p) => p.by === photographer.username).slice(0, 4);
  // Pad to 4 if needed (photos is always non-empty allPhotos from data layer)
  while (theirPhotos.length < 4) theirPhotos.push(photos[0]!);

  const lastTrip = photographer.customerTrips?.[0];

  return (
    <div
      onClick={() => router.push(`/photographer/${photographer.username}`)}
      className="cursor-pointer border border-[var(--rule)] p-4 flex flex-col"
      style={{ background: variant === 'voyageur' ? 'var(--cream)' : 'transparent' }} // dynamic: background depends on runtime variant prop
    >
      <div className="relative grid grid-cols-2 gap-1">
        {theirPhotos.slice(0, 4).map((p, i) => (
          <div key={p.id + i} className="aspect-square bg-[var(--tile)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
        <div
          className="absolute left-1/2 -bottom-7 -translate-x-1/2 w-14 h-14 rounded-full overflow-hidden bg-[var(--tile)]"
          style={{ border: `3px solid ${variant === 'voyageur' ? 'var(--cream)' : 'var(--bg)'}` }} // dynamic: border color depends on runtime variant prop
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photographer.avatar}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="pt-10 text-center flex-1 flex flex-col">
        {variant === 'voyageur' && (
          <div className="caps opacity-70 text-[10px] mb-[10px] flex justify-center items-center gap-[6px]">
            <VoyageurMark /><span>Voyageur</span>
          </div>
        )}
        <div className="text-[15px] font-medium tracking-[-0.005em] mb-1">{photographer.name}</div>
        <div className="caps opacity-55 text-[10px]">{photographer.loc}</div>
        {variant === 'voyageur' && lastTrip && (
          <div className="mono mt-[14px] text-[10px] tracking-[.06em] opacity-55 leading-[1.5]">
            ◇ {lastTrip}
          </div>
        )}
        <div className="mt-auto pt-5">
          <button
            className="btn btn-sm w-full justify-center"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/photographer/${photographer.username}`);
            }}
          >
            {variant === 'voyageur' ? 'View collection' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
}
