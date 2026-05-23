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
  
  // Use their first photo as the cover image
  const theirPhotos = photos.filter((p) => p.by === photographer.username);
  const coverImg = theirPhotos.length > 0 ? theirPhotos[0].src : photographer.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

  const lastTrip = photographer.customerTrips?.[0];

  return (
    <div
      onClick={() => router.push(`/photographer/${photographer.username}`)}
      className="cursor-pointer flex flex-col rounded-3xl overflow-hidden bg-[#0a0a0a] text-white relative h-[420px] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 shadow-xl border border-white/5"
    >
      {/* Cover Image */}
      <div className="relative h-[55%] w-full shrink-0">
        <img
          src={coverImg}
          alt="cover"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Dark gradient overlay at the bottom of the cover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
        {variant === 'voyageur' && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-sm flex items-center gap-1 border border-white/10">
            <VoyageurMark size={10} />
            <span className="text-[9px] uppercase tracking-widest text-white/90">Voyageur</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative px-6 pb-6 flex flex-col flex-1">
        {/* Avatar & Follow Button Row */}
        <div className="flex justify-between items-end -mt-12 mb-3 relative z-10">
          <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-[3px] border-[#0a0a0a] bg-neutral-900 shadow-md">
            <img
              src={photographer.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + photographer.username}
              alt={photographer.username}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            className="bg-white text-black px-5 py-1.5 rounded-full text-[13px] font-medium hover:bg-neutral-200 transition-colors mb-2 tracking-tight"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/photographer/${photographer.username}`);
            }}
          >
            {variant === 'voyageur' ? 'Collection' : 'Follow'}
          </button>
        </div>

        {/* Name and Username */}
        <div className="mb-auto">
          <h3 className="text-[22px] font-semibold leading-none tracking-tight mb-1 truncate">
            {photographer.name.toUpperCase()}
          </h3>
          <div className="text-white/50 text-[14px] truncate tracking-tight">
            @{photographer.username.toLowerCase()}
          </div>
          {variant === 'voyageur' && lastTrip && (
            <div className="text-white/40 text-[11px] mt-2 truncate font-mono tracking-widest uppercase">
              ◇ {lastTrip}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-5 mt-5 text-[14px] tracking-tight">
          <div className="text-white/60">
            <span className="font-bold text-white mr-1.5">{photographer.followers.toLocaleString()}</span>
            Followers
          </div>
          <div className="text-white/60">
            <span className="font-bold text-white mr-1.5">{photographer.photos}</span>
            Photos
          </div>
        </div>
      </div>
    </div>
  );
}
