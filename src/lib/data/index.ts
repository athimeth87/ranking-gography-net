import type { Season } from '@/lib/types';
import { pulseScore } from '@/lib/pulse';
import { SEASONS } from './seasons';

// Mock photo/photographer/comment data has been removed (P0 audit 1.1).
// All photo + stat reads go through the live Supabase layer in ./live —
// one query path so the same photo can never show two different numbers.

export { pulseScore };
export * from './live';

export function getSeasons(): Season[] {
  return SEASONS;
}

// ─── DB-backed modules (real Supabase) ───────────────────────────────────────
export * from './likes';
export * from './comments-db';
export * from './notifications';
export * from './follows';
