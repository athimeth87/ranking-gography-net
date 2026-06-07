// Pulse Scoring — FINAL v4 (locked 2026-06-06). Implements SCORING-LOGIC-FINAL.md.
//
// Role-weighted votes accumulate into photo.engagement AT VOTE TIME (snapshot),
// then a 5-min job ranks the 0–24h active pool by engagement and maps rank →
// percentile×100, with a viral-compression tail above the 97.8th percentile.
//
//   vote_value   = SCORE_MATRIX[role][type] × quality_score × voteAgeWeight(photo_age)
//   photo.engagement += vote_value                    (accumulated at vote time)
//   score        = pct·100               if pct ≤ 0.978
//                = 97.8 + compression     if pct > 0.978   (viral tail → 99.99)

export type Role = 'ambassador' | 'rankmaster' | 'regular';
export type VoteType = 'like' | 'favorite' | 'share';
export type PhotoStatus = 'active' | 'grace' | 'locked';
export type Badge =
  | 'legendary' | 'popular' | 'trending' | 'hidden_gem' | 'daily_winner' | 'hall_of_fame' | null;

// §2 — base weight by who votes × what they do.
export const SCORE_MATRIX: Record<Role, Record<VoteType, number>> = {
  ambassador: { like: 5, favorite: 10, share: 20 },
  rankmaster: { like: 3, favorite: 6, share: 12 },
  regular:    { like: 1, favorite: 2, share: 4 },
};

export const PULSE_V4 = {
  ACTIVE_HOURS: 24,
  GRACE_HOURS: 30,
  GRACE_SPAN: 0.9,        // 1.0 → 0.1 across hours 24..30
  LOCKED_WEIGHT: 0.1,
  REF_PERCENTILE: 0.978,  // top 2.2% gets the compression tail
  COMP_A: 2.2,            // bonus = A·(1 − exp(−K·(ratio − 1)))
  COMP_K: 0.4,
  LINEAR_CAP: 97.8,
  MAX_SCORE: 99.99,
} as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

// §3 — per-vote age weight from the photo's age (hours) at the moment of the vote.
export function voteAgeWeight(photoAgeHours: number): number {
  if (photoAgeHours <= PULSE_V4.ACTIVE_HOURS) return 1.0;
  if (photoAgeHours <= PULSE_V4.GRACE_HOURS) {
    return 1.0 - PULSE_V4.GRACE_SPAN * (photoAgeHours - PULSE_V4.ACTIVE_HOURS) / 6;
  }
  return PULSE_V4.LOCKED_WEIGHT;
}

// §4 step 1 — value a single vote contributes (computed + stored at vote time).
export function voteValue(o: { role: Role; type: VoteType; qualityScore: number; photoAgeHours: number }): number {
  return SCORE_MATRIX[o.role][o.type] * clamp(o.qualityScore, 0, 1) * voteAgeWeight(o.photoAgeHours);
}

// §5 — lifecycle by age.
export function photoStatus(ageHours: number): PhotoStatus {
  if (ageHours <= PULSE_V4.ACTIVE_HOURS) return 'active';
  if (ageHours <= PULSE_V4.GRACE_HOURS) return 'grace';
  return 'locked';
}

// §6 — viral-compression score for the top tail (engagement relative to the 97.8th ref).
export function compressionScore(engagement: number, ref97_8: number): number {
  const ratio = ref97_8 > 0 ? engagement / ref97_8 : 1;
  const bonus = PULSE_V4.COMP_A * (1 - Math.exp(-PULSE_V4.COMP_K * (ratio - 1)));
  return Math.min(PULSE_V4.MAX_SCORE, PULSE_V4.LINEAR_CAP + bonus);
}

// nearest-rank percentile value on an ascending array.
function percentileValue(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx] ?? 0;
}

export interface ScoredPhoto<T> {
  item: T;
  engagement: number;
  rank: number;       // 1-based, ascending (rank N = highest engagement)
  percentile: number; // rank / N
  score: number;      // 0..99.99, 1 decimal
}

// §4 steps 2–3 — rank the active pool (age ≤ 24h) and assign scores.
export function assignScores<T extends { id: string; engagement: number }>(activePool: T[]): ScoredPhoto<T>[] {
  const N = activePool.length;
  if (N === 0) return [];
  const sortedAsc = [...activePool].sort((a, b) => a.engagement - b.engagement);
  const ref = percentileValue(sortedAsc.map((p) => p.engagement), PULSE_V4.REF_PERCENTILE);
  const rankById = new Map<string, number>();
  sortedAsc.forEach((p, i) => rankById.set(p.id, i + 1));

  return activePool.map((item) => {
    const rank = rankById.get(item.id) ?? 1;
    const pct = rank / N;
    const score = pct <= PULSE_V4.REF_PERCENTILE
      ? pct * 100
      : compressionScore(item.engagement, ref);
    return { item, engagement: item.engagement, rank, percentile: pct, score: round1(score) };
  });
}

// §7 — badge from score + view-based eligibility.
export function assignBadge(o: { score: number; views: number; active: boolean }): Badge {
  if (o.score >= 99.5 && o.views >= 100) return 'legendary';
  if (o.score >= PULSE_V4.LINEAR_CAP && o.views >= 100) return 'popular';
  if (o.score >= 95 && o.active && o.views >= 50) return 'trending';
  if (o.score >= 90 && o.views < 200) return 'hidden_gem';
  return null;
}

// ── §10 (v5) — Photographer Hall of Fame (seasonal aggregate) ────────────────
// Same percentile + compression as photos, but ranked on the AVERAGE score of
// ALL a photographer's in-window photos — rewards consistency, not lucky shots.

export const PULSE_V5_HOF = {
  WINDOW_DAYS: 120,     // 4 months = 1 season
  MIN_PHOTOS: 22,       // must have ≥ 22 in-window photos to qualify
  PUBLIC_TOP: 10,       // only the top 10 are shown publicly
  RISING_MAX_DAYS: 90,  // Rising Talent eligibility
} as const;

export type PhotographerBadge = 'season_legend' | 'season_top' | 'rising_talent' | 'hall_of_fame' | null;

export interface PhotographerInput {
  id: string;
  photoScores: number[];   // v4 scores of ALL photos uploaded within the window
  accountAgeDays?: number; // for Rising Talent
}

export interface HofResult<T> {
  item: T;
  qualified: boolean;
  photoCount: number;
  avgScore: number;        // all_avg (0 if none)
  rank: number | null;     // 1-based ascending among QUALIFIED (rank M = best)
  percentile: number | null;
  hofScore: number | null; // 0..99.99
  isTop10: boolean;        // public Hall of Fame slot
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export function rankPhotographers<T extends PhotographerInput>(photographers: T[]): HofResult<T>[] {
  const qualified = photographers.filter((p) => p.photoScores.length >= PULSE_V5_HOF.MIN_PHOTOS);
  const M = qualified.length;
  const avgById = new Map<string, number>();
  qualified.forEach((p) => avgById.set(p.id, mean(p.photoScores)));

  const sortedAvg = qualified.map((p) => avgById.get(p.id) ?? 0).sort((a, b) => a - b);
  const ref = percentileValue(sortedAvg, PULSE_V4.REF_PERCENTILE);
  const ordered = [...qualified].sort((a, b) => (avgById.get(a.id) ?? 0) - (avgById.get(b.id) ?? 0));
  const rankById = new Map<string, number>();
  ordered.forEach((p, i) => rankById.set(p.id, i + 1));

  return photographers.map((item) => {
    const photoCount = item.photoScores.length;
    if (photoCount < PULSE_V5_HOF.MIN_PHOTOS) {
      return { item, qualified: false, photoCount, avgScore: mean(item.photoScores), rank: null, percentile: null, hofScore: null, isTop10: false };
    }
    const avgScore = avgById.get(item.id) ?? 0;
    const rank = rankById.get(item.id) ?? 1;
    const pct = rank / M;
    const hof = pct <= PULSE_V4.REF_PERCENTILE ? pct * 100 : compressionScore(avgScore, ref);
    return { item, qualified: true, photoCount, avgScore, rank, percentile: pct, hofScore: round1(hof), isTop10: rank > M - PULSE_V5_HOF.PUBLIC_TOP };
  });
}

// Score-tier badge. The Hall-of-Fame (top-10) badge is the `isTop10` flag above.
export function photographerBadge(o: { hofScore: number | null; accountAgeDays?: number }): PhotographerBadge {
  if (o.hofScore == null) return null;
  if (o.hofScore >= 99.5) return 'season_legend';
  if (o.hofScore >= PULSE_V4.LINEAR_CAP) return 'season_top';
  if (o.hofScore >= 95 && (o.accountAgeDays ?? Infinity) <= PULSE_V5_HOF.RISING_MAX_DAYS) return 'rising_talent';
  return null;
}
