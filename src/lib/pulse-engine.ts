// Pulse engine — see docs/specs/pulse-algorithm.md for the spec.
// All tunable parameters live as PULSE_PARAMS constants. To change behavior,
// update the spec, then update the matching constant here.

import type { PhotoSeed } from '@/lib/types';

export const PULSE_PARAMS = {
  FLOOR: 19,
  CEILING: 100,

  WEIGHTS: {
    FAVORITE: 2.0,
    COMMENT: 1.5,
  },

  VOTE_WEIGHT: {
    BASE: 1.0,
    FOLLOWER_FACTOR: 0.6,
    NON_FOLLOWER_FACTOR: 1.0,
    ACTIVITY_MIN: 0.5,
    ACTIVITY_MAX: 1.2,
    RECIPROCITY_FACTOR: 0.4,
    ANTI_COLLUSION_FACTOR: 0.3,
    ANTI_COLLUSION_RECIPROCAL_THRESHOLD: 5,
    ANTI_COLLUSION_WINDOW_DAYS: 7,
    RECIPROCITY_WINDOW_DAYS: 30,
  },

  ENGAGEMENT_SCALE: 25,

  EXPOSURE: {
    MAX: 0.5,
    MULTIPLIER: 200,
  },

  METADATA_BONUS: 5,

  PICK_BONUS: {
    none: 0,
    editor: 10,
    ambassador: 10,
    both: 15,
  } as const,

  DECAY: {
    FRESH_HOURS: 24,
    DAILY_DECAY: 0.10,
    DAILY_DECAY_END_HOURS: 168,
    LATE_DECAY_RATE: 0.60,
    DECAY_FLOOR: 0.30,
  },
} as const;

export type PickType = 'none' | 'editor' | 'ambassador' | 'both';

export interface PulseVote {
  voter_id: string;
  voted_at: string;
  voter_follows_owner?: boolean;
  voter_total_votes?: number;
  owner_voted_on_voter_recently?: boolean;
  collusion_pair_count?: number;
}

export interface PulseInputs {
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  impressions_count: number;
  uploaded_at: string | Date;
  pick_type?: PickType;
  has_title?: boolean;
  has_category?: boolean;
  has_descriptor?: boolean;
  votes?: PulseVote[];
  season_start?: string | Date;
  now?: Date;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function voteWeight(v: PulseVote): number {
  const p = PULSE_PARAMS.VOTE_WEIGHT;

  const follower = v.voter_follows_owner ? p.FOLLOWER_FACTOR : p.NON_FOLLOWER_FACTOR;

  const activityRaw = typeof v.voter_total_votes === 'number'
    ? Math.log10(v.voter_total_votes + 1) / 2
    : 1.0;
  const activity = clamp(activityRaw, p.ACTIVITY_MIN, p.ACTIVITY_MAX);

  const reciprocity = v.owner_voted_on_voter_recently ? p.RECIPROCITY_FACTOR : 1.0;

  const collusion = (v.collusion_pair_count ?? 0) >= p.ANTI_COLLUSION_RECIPROCAL_THRESHOLD
    ? p.ANTI_COLLUSION_FACTOR
    : 1.0;

  return p.BASE * follower * activity * reciprocity * collusion;
}

function engagementScore(i: PulseInputs): number {
  const weightedVotes = i.votes && i.votes.length > 0
    ? i.votes.reduce((sum, v) => sum + voteWeight(v), 0)
    : i.likes_count;

  const raw =
    weightedVotes +
    i.favorites_count * PULSE_PARAMS.WEIGHTS.FAVORITE +
    i.comments_count * PULSE_PARAMS.WEIGHTS.COMMENT;

  return PULSE_PARAMS.ENGAGEMENT_SCALE * Math.log10(raw + 1);
}

function exposureScore(i: PulseInputs): number {
  if (i.impressions_count <= 0) return 0;
  const rate = (i.likes_count + i.favorites_count) / i.impressions_count;
  return clamp(rate, 0, PULSE_PARAMS.EXPOSURE.MAX) * PULSE_PARAMS.EXPOSURE.MULTIPLIER;
}

function metadataBonus(i: PulseInputs): number {
  const complete = (i.has_title ?? true) && (i.has_category ?? true) && (i.has_descriptor ?? true);
  return complete ? PULSE_PARAMS.METADATA_BONUS : 0;
}

function pickBonus(i: PulseInputs): number {
  return PULSE_PARAMS.PICK_BONUS[i.pick_type ?? 'none'];
}

function hoursSince(i: PulseInputs): number {
  const now = (i.now ?? new Date()).getTime();
  const uploaded = new Date(i.uploaded_at).getTime();
  const seasonStart = i.season_start ? new Date(i.season_start).getTime() : 0;
  const effectiveStart = Math.max(uploaded, seasonStart);
  return Math.max(0, (now - effectiveStart) / 3_600_000);
}

function decayFactor(hours: number): number {
  const d = PULSE_PARAMS.DECAY;
  if (hours <= d.FRESH_HOURS) return 1.0;
  if (hours <= d.DAILY_DECAY_END_HOURS) {
    const days = (hours - d.FRESH_HOURS) / 24;
    return 1.0 - d.DAILY_DECAY * days;
  }
  const lateDays = (hours - d.DAILY_DECAY_END_HOURS) / 24;
  return Math.max(d.DECAY_FLOOR, 1.0 - d.LATE_DECAY_RATE * Math.log10(lateDays + 1));
}

function pulseCombined(i: PulseInputs): number {
  return (
    engagementScore(i) + exposureScore(i) + metadataBonus(i) + pickBonus(i)
  ) * decayFactor(hoursSince(i));
}

export function computePulse(i: PulseInputs): number {
  try {
    return clamp(Math.round(pulseCombined(i)), PULSE_PARAMS.FLOOR, PULSE_PARAMS.CEILING);
  } catch {
    return PULSE_PARAMS.FLOOR;
  }
}

// One-decimal precision for the 500px-style "99.4" display + DB persistence.
export function computePulsePrecise(i: PulseInputs): number {
  try {
    return clamp(Math.round(pulseCombined(i) * 10) / 10, PULSE_PARAMS.FLOOR, PULSE_PARAMS.CEILING);
  } catch {
    return PULSE_PARAMS.FLOOR;
  }
}

// 500px-style status tier derived from pulse (peak) + curation.
export type PulseStatus = 'undiscovered' | 'rising' | 'popular' | 'editors_choice';

export const PULSE_STATUS_THRESHOLDS = { RISING: 55, POPULAR: 80 } as const;

export function pulseStatus(pulse: number | null | undefined, pickType: PickType = 'none'): PulseStatus {
  if (pickType !== 'none') return 'editors_choice';
  const v = typeof pulse === 'number' && Number.isFinite(pulse) ? pulse : PULSE_PARAMS.FLOOR;
  if (v >= PULSE_STATUS_THRESHOLDS.POPULAR) return 'popular';
  if (v >= PULSE_STATUS_THRESHOLDS.RISING) return 'rising';
  return 'undiscovered';
}

export function pulseFromSeed(seed: Pick<PhotoSeed, 'likes' | 'likes24h' | 'comments' | 'favorites' | 'hours' | 'picks' | 'date'>): number {
  const pick: PickType =
    seed.picks.includes('editor') && seed.picks.includes('ambassador') ? 'both' :
    seed.picks.includes('editor') ? 'editor' :
    seed.picks.includes('ambassador') ? 'ambassador' : 'none';

  const uploaded = seed.date
    ? new Date(seed.date)
    : new Date(Date.now() - seed.hours * 3_600_000);

  return computePulse({
    likes_count: seed.likes,
    favorites_count: seed.favorites,
    comments_count: seed.comments,
    impressions_count: Math.max(seed.likes * 20, 1),
    uploaded_at: uploaded,
    pick_type: pick,
  });
}

export function formatPulseDisplay(pulse: number | null | undefined): string {
  const value = typeof pulse === 'number' && Number.isFinite(pulse)
    ? clamp(Math.round(pulse), PULSE_PARAMS.FLOOR, PULSE_PARAMS.CEILING)
    : PULSE_PARAMS.FLOOR;
  return `${value}`;
}
