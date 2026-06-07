'use client';
import { useRouter } from 'next/navigation';
import type { Photographer } from '@/lib/types';
import { VoyageurMark, CrownIcon } from '@/components/icons';

interface PhotoMini { by: string; src: string; }

interface PhotographerCardProps {
  photographer: Photographer;
  variant?: 'general' | 'voyageur';
  photos: PhotoMini[];
  rank?: number;
}

export function PhotographerCard({
  photographer,
  variant = 'general',
  photos,
  rank,
}: PhotographerCardProps) {
  const router = useRouter();

  const theirPhotos = photos.filter((p) => p.by === photographer.username);
  const coverImg =
    photographer.cover ||
    (theirPhotos.length > 0
      ? theirPhotos[0]!.src
      : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');

  const formatStat = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  };

  return (
    <div
      onClick={() => router.push(`/photographer/${photographer.username}`)}
      className="cursor-pointer group pcard"
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-tile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImg}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Rank badge — monochrome */}
        {rank !== undefined && rank <= 10 && (
          <div className="absolute top-3 left-3 bg-fg text-bg mono text-[9px] tracking-[.14em] uppercase px-2 py-[3px]">
            #{rank}
          </div>
        )}

        {/* Status badges top-right */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {photographer.isRankMaster && (
            <span className="inline-flex items-center gap-1 bg-fg text-bg mono text-[9px] tracking-[.14em] uppercase px-2 py-[3px]">
              <CrownIcon /> Rank Master
            </span>
          )}
          {photographer.isAmbassador && (
            <span className="inline-flex items-center gap-1 bg-gold text-white mono text-[9px] tracking-[.14em] uppercase px-2 py-[3px]">
              Ambassador
            </span>
          )}
          {photographer.isCustomer && !photographer.isAmbassador && (
            <span className="inline-flex items-center gap-1 bg-black/50 text-gold backdrop-blur-sm mono text-[9px] tracking-[.14em] uppercase px-2 py-[3px]">
              <VoyageurMark size={6} /> Voyageur
            </span>
          )}
        </div>

        {/* Name overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <div className="text-white text-[15px] font-medium tracking-[-0.01em] leading-[1.2] truncate">
            {photographer.name}
          </div>
          <div className="text-white/60 mono text-[10px] tracking-[.1em] truncate">
            @{photographer.username}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-0 border-b border-rule">
        {/* HOF Score or avg pulse or photos */}
        {photographer.hofScore != null ? (
          <div className="flex-1 py-3 px-3 border-r border-rule">
            <div className="mono text-[14px] font-semibold">{photographer.hofScore.toFixed(1)}</div>
            <div className="caps text-[9px] opacity-45 mt-[2px]">HOF Score</div>
          </div>
        ) : photographer.avgPulse && photographer.avgPulse > 0 ? (
          <div className="flex-1 py-3 px-3 border-r border-rule">
            <div className="mono text-[14px] font-semibold">{photographer.avgPulse.toFixed(1)}</div>
            <div className="caps text-[9px] opacity-45 mt-[2px]">Avg Pulse</div>
          </div>
        ) : (
          <div className="flex-1 py-3 px-3 border-r border-rule">
            <div className="mono text-[14px] font-semibold">{photographer.photos}</div>
            <div className="caps text-[9px] opacity-45 mt-[2px]">Photos</div>
          </div>
        )}
        <div className="flex-1 py-3 px-3 border-r border-rule">
          <div className="mono text-[14px] font-semibold">{formatStat(photographer.followers)}</div>
          <div className="caps text-[9px] opacity-45 mt-[2px]">Followers</div>
        </div>
        <div className="flex-1 py-3 px-3">
          <div className="mono text-[14px] font-semibold">{formatStat(photographer.totalLikes || 0)}</div>
          <div className="caps text-[9px] opacity-45 mt-[2px]">Likes</div>
        </div>
      </div>
    </div>
  );
}
