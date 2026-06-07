'use client';
import { useRouter } from 'next/navigation';
import type { Photographer } from '@/lib/types';

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
  void variant;
  const router = useRouter();

  const theirPhotos = photos.filter((p) => p.by === photographer.username);
  const coverImg = photographer.cover || (theirPhotos.length > 0 ? theirPhotos[0]!.src : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');

  return (
    <div
      onClick={() => router.push(`/photographer/${photographer.username}`)}
      className="cursor-pointer flex flex-col rounded-[12px] overflow-hidden bg-[#111111] text-white relative h-full min-h-[400px] sm:min-h-[460px] hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 border border-white/10 group"
    >
      {/* Cover Image */}
      <div className="relative h-[170px] w-full shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImg}
          alt="cover"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            const fallback = theirPhotos.length > 0 ? theirPhotos[0]!.src : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
            if (target.src !== fallback) {
              target.src = fallback;
            } else {
              target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent" />

        {/* Rank Badge */}
        {rank !== undefined && (
          <div className="absolute top-4 left-4 z-10">
            {rank <= 3 ? (
              <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[#cda256] to-[#9a7638] flex items-center justify-center shadow-lg shadow-black/50">
                <span className="text-white font-bold text-[14px]">{rank}</span>
              </div>
            ) : rank <= 10 ? (
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                <span className="text-white font-bold text-[11px] uppercase tracking-widest">Top {rank}</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative px-5 pb-5 flex flex-col flex-1 -mt-16">
        {/* Avatar */}
        <div className="flex flex-col mb-3 sm:mb-4">
          <div className="w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] rounded-full overflow-hidden border-[3px] border-[#111111] bg-neutral-900 shadow-xl relative z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photographer.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + photographer.username}
              alt={photographer.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + photographer.username;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
          </div>
          {photographer.isAmbassador && (
            <div className="absolute top-[48px] left-[48px] z-20 w-5 h-5 bg-[#cda256] rounded-full border-[2px] border-[#111111] flex items-center justify-center">
              <span className="text-[10px]">✓</span>
            </div>
          )}
        </div>

        {/* Name and Username */}
        <div className="mb-4">
          <h3 className="text-[14px] sm:text-[17px] font-serif tracking-wide text-[#e8e6e3] truncate">
            {photographer.name.toUpperCase()}
          </h3>
          <div className="text-white/50 text-[11px] sm:text-[13px] truncate">
            @{photographer.username.toLowerCase()}
          </div>
          <div className="text-white/40 text-[10px] sm:text-[11px] mt-1 sm:mt-2 truncate">
            {photographer.isAmbassador ? 'Ambassador' : photographer.isCustomer ? 'Traveller' : 'Photographer'}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-between gap-y-3 gap-x-2 text-[10px] sm:text-[11px] border-t border-white/5 pt-4 mb-4">
          {photographer.hofScore != null ? (
            <div className="flex flex-col">
              <span className="font-bold text-[#cda256] text-[13px]">{photographer.hofScore.toFixed(1)}</span>
              <span className="text-[#cda256]/60">HOF Score</span>
            </div>
          ) : photographer.avgPulse && photographer.avgPulse > 0 ? (
            <div className="flex flex-col">
              <span className="font-bold text-[#e8e6e3] text-[13px]">{photographer.avgPulse.toFixed(1)}</span>
              <span className="text-white/40">Avg Pulse</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="font-bold text-[#e8e6e3] text-[13px]">{photographer.photos || 0}</span>
              <span className="text-white/40">Photos</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-[#e8e6e3] text-[13px]">{photographer.followers}</span>
            <span className="text-white/40">Followers</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#e8e6e3] text-[13px]">{photographer.totalLikes || 0}</span>
            <span className="text-white/40">Likes</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#e8e6e3] text-[13px]">{photographer.totalSaves || 0}</span>
            <span className="text-white/40">Saves</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-auto overflow-hidden">
          {(photographer.categories || []).slice(0, 2).map(c => (
            <div key={c} className="px-2.5 py-1 rounded-full border border-white/10 text-white/50 text-[9px] uppercase tracking-widest bg-white/5 whitespace-nowrap">
              {c}
            </div>
          ))}
        </div>

        {/* View Profile Button */}
        <div className="mt-4 sm:mt-5 w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
          <span className="text-[9px] sm:text-[11px] uppercase tracking-widest text-white/70">Profile</span>
          <span className="text-white/40 text-[10px] sm:text-[12px]">→</span>
        </div>
      </div>
    </div>
  );
}
