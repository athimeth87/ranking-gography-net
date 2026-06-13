import type { Photo } from '@/lib/types';

export interface LivePulse {
  pulse?: number;
  peakPulse?: number | null;
  percentile?: number | null;
  badge?: Photo['badge'];
  likes?: number;
  favorites?: number;
  comments?: number;
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
    // Overlay only fields this payload carried — a partial UPDATE (e.g. pulse-only) must not zero likes.
    return {
      ...p,
      ...(l.pulse !== undefined && { pulse: l.pulse }),
      ...(l.peakPulse !== undefined && { peakPulse: l.peakPulse }),
      ...(l.percentile !== undefined && { percentile: l.percentile }),
      ...(l.badge !== undefined && { badge: l.badge }),
      ...(l.likes !== undefined && { likes: l.likes }),
      ...(l.favorites !== undefined && { favorites: l.favorites }),
      ...(l.comments !== undefined && { comments: l.comments }),
    };
  });
  if (!sort) return merged;
  const sorted = [...merged].sort((a, b) => b.pulse - a.pulse);
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}
