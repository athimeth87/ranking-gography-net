import type { Photo } from '@/lib/types';

export interface LivePulse {
  pulse: number;
  peakPulse: number | null;
  percentile: number | null;
  badge: string | null;
  likes: number;
  favorites: number;
  comments: number;
}

// Overlay live values onto SSR photos. When sort=true, re-sort by pulse desc and
// re-number rank (1-based) so leaderboards visibly re-order as scores move.
export function mergeLivePulse(
  photos: Photo[],
  live: Record<string, LivePulse>,
  sort = false,
): Photo[] {
  const merged = photos.map((p) => {
    const l = live[p.id];
    if (!l) return p;
    return {
      ...p,
      pulse: l.pulse,
      peakPulse: l.peakPulse,
      percentile: l.percentile,
      badge: l.badge as Photo['badge'],
      likes: l.likes,
      favorites: l.favorites,
      comments: l.comments,
    };
  });
  if (!sort) return merged;
  const sorted = [...merged].sort((a, b) => b.pulse - a.pulse);
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}
