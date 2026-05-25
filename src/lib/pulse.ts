import type { PhotoSeed, Photo } from '@/lib/types';
import { pulseFromSeed, PULSE_PARAMS } from '@/lib/pulse-engine';

export { PULSE_PARAMS, computePulse, formatPulseDisplay } from '@/lib/pulse-engine';

export function pulseScore(p: Pick<PhotoSeed, 'likes' | 'likes24h' | 'comments' | 'favorites' | 'hours' | 'picks' | 'date'>): number {
  return pulseFromSeed({
    likes: p.likes,
    likes24h: p.likes24h,
    comments: p.comments ?? 0,
    favorites: p.favorites ?? 0,
    hours: p.hours,
    picks: p.picks,
    date: p.date ?? '',
  });
}

/** Returns new Photo objects sorted by pulse desc with 1-based ranks. Pure. */
export function rankPhotos(seeds: PhotoSeed[]): Photo[] {
  return seeds
    .map((seed) => ({ ...seed, pulse: pulseScore(seed) }))
    .sort((a, b) => b.pulse - a.pulse)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/** The minimum pulse value shown in the UI. */
export const PULSE_FLOOR = PULSE_PARAMS.FLOOR;
