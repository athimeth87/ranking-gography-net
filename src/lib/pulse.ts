import type { PhotoSeed, Photo } from '@/lib/types';

export function pulseScore(p: Pick<PhotoSeed, 'likes' | 'likes24h' | 'hours' | 'picks'>): number {
  let bonus = 0;
  if (p.picks.includes('editor') && p.picks.includes('ambassador')) bonus = 100;
  else if (p.picks.length > 0) bonus = 50;
  return (p.likes * 1 + p.likes24h * 3 + bonus) / Math.max(p.hours, 1);
}

/** Returns new Photo objects sorted by pulse desc with 1-based ranks. Pure. */
export function rankPhotos(seeds: PhotoSeed[]): Photo[] {
  return seeds
    .map((seed) => ({ ...seed, pulse: pulseScore(seed) }))
    .sort((a, b) => b.pulse - a.pulse)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
