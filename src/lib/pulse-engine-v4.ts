// Pulse Scoring — Season Engine v5 (no-decay, locked 2026-06-12).
//
// Every vote counts full weight for the whole 4-month season (no age decay).
// A photo's raw engagement E accumulates role × type weights, dampened by a
// daily vote budget and an anti-collusion factor:
//
//   E      = Σ (SCORE_MATRIX[role][type] × budgetWeight(nth vote that day) × collusionFactor)
//   x      = E / B                     B = community baseline (p60 of the pool, EMA-clamped)
//   score  = 25 + 74.9 · x/(x+1)       → round to 1 dp → cap 99.9   (100.0 can never appear)
//
// This TS engine MUST match the DB functions in 0032_season_engine_v5.sql
// character-for-character — the on-page number has to equal the real ranking.
// (The photographer Hall of Fame at the bottom is unchanged — v5 §6: do not touch.)

export type Role = 'ambassador' | 'rankmaster' | 'regular';
export type VoteType = 'like' | 'favorite' | 'share';
export type Badge =
  | 'legendary' | 'popular' | 'trending' | 'hidden_gem' | 'hall_of_fame' | null;

// §2 — base weight by who votes × what they do. DB tiers map as:
// approved photographer → ambassador, customer → rankmaster, else → regular.
export const SCORE_MATRIX: Record<Role, Record<VoteType, number>> = {
  ambassador: { like: 5, favorite: 10, share: 20 },
  rankmaster: { like: 3, favorite: 6, share: 12 },
  regular:    { like: 1, favorite: 2, share: 4 },
};

// ── Season Engine v5 constants (tunable; mirror the literals in migration 0032) ─
export const PULSE_V5 = {
  FLOOR: 25,                  // display floor (E = 0 → 25.0, "undiscovered")
  HILL_RANGE: 74.9,           // 25 + 74.9 → asymptote 99.9
  DISPLAY_CAP: 99.9,          // applied AFTER rounding, so 100.0 never appears
  DAILY_VOTE_BUDGET: 20,      // first 20 votes/user/day count full weight
  COLLUSION_FACTOR: 0.3,      // reciprocal-voting packs are dampened ×0.3
  COLLUSION_THRESHOLD: 5,     // ≥5 mutual votes in 7 days flags the pair
  MULTI_VOTE_WEIGHT: 1.25,    // vote endorsing ≥2 aspects (of color/composition/light)
  MIN_VOTES_FOR_PERCENT: 10,  // below this the power bar shows raw counts, not %
  BASELINE_PERCENTILE: 0.60,  // B = p60 of the season pool
  BASELINE_EMA: 0.10,         // B moves at most ±10% per cron round
  BASELINE_PRIOR_FLOOR: 10,   // season 1 prior; later seasons inherit prior B
} as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

// ── Layer 3 — display score from raw E and baseline B (the locked formula) ──────
// MUST equal: least(round(25 + 74.9 * (x/(x+1)), 1), 99.9) with x = E/B in the DB.
export function seasonDisplayScore(E: number, B: number): number {
  const b = B > 0 ? B : PULSE_V5.BASELINE_PRIOR_FLOOR;
  const x = E / b;
  const raw = PULSE_V5.FLOOR + PULSE_V5.HILL_RANGE * (x / (x + 1));
  return Math.min(round1(raw), PULSE_V5.DISPLAY_CAP);
}

// §2.5 — daily vote budget. `voteIndex` is 1-based (the n-th vote that user cast
// today). First 20 full; vote 40 worth half. Matches the DB budget weight.
export function budgetWeight(voteIndex: number): number {
  return voteIndex <= PULSE_V5.DAILY_VOTE_BUDGET ? 1.0 : PULSE_V5.DAILY_VOTE_BUDGET / voteIndex;
}

// §2.6 — anti-collusion factor (ported from pulse-engine v1).
export function collusionFactor(flagged: boolean): number {
  return flagged ? PULSE_V5.COLLUSION_FACTOR : 1.0;
}

// Vote Aspect — a vote endorses color / composition / light. Endorsing ≥2 weighs
// 1.25; one side (or a legacy aspect-less vote) weighs 1.0. MUST equal the SQL
// function vote_aspect_weight() in migration 0033 for every combination.
export interface VoteAspects {
  aspectColor: boolean;
  aspectComposition: boolean;
  aspectLight: boolean;
  isLegacy?: boolean;
}
export function voteAspectWeight(v: VoteAspects): number {
  if (v.isLegacy) return 1.0;
  const n = Number(v.aspectColor) + Number(v.aspectComposition) + Number(v.aspectLight);
  if (n === 0) throw new Error('vote must endorse at least one aspect');
  return n >= 2 ? PULSE_V5.MULTI_VOTE_WEIGHT : 1.0;
}

// Postgres percentile_cont(p): linear interpolation over the sorted pool.
function percentileCont(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0]!;
  const rank = p * (n - 1);
  const lo = Math.floor(rank);
  const frac = rank - lo;
  const a = sortedAsc[lo]!;
  const b = sortedAsc[Math.min(lo + 1, n - 1)]!;
  return a + frac * (b - a);
}

// §2.3 — community baseline B: p60 of E>0, clamped to ±10% of the old B, then a
// prior floor. Matches the B update inside recompute_pulse_active.
export function communityBaseline(
  engagements: number[],
  bOld: number,
  bPrior: number = PULSE_V5.BASELINE_PRIOR_FLOOR,
): number {
  const old = bOld > 0 ? bOld : PULSE_V5.BASELINE_PRIOR_FLOOR;
  const prior = Math.max(PULSE_V5.BASELINE_PRIOR_FLOOR, bPrior);
  const positive = engagements.filter((e) => e > 0).sort((a, b) => a - b);
  if (positive.length === 0) return Math.max(old, prior);
  const raw = percentileCont(positive, PULSE_V5.BASELINE_PERCENTILE);
  const clamped = clamp(raw, old * (1 - PULSE_V5.BASELINE_EMA), old * (1 + PULSE_V5.BASELINE_EMA));
  return Math.max(clamped, prior);
}

// ── Badge → UI status tier ──────────────────────────────────────────────────
export type PulseStatus = Badge | 'editors_choice' | 'undiscovered';
export type PickType = 'none' | 'editor' | 'ambassador';

export function statusFromBadge(badge: Badge, pickType: PickType = 'none'): PulseStatus {
  if (pickType !== 'none') return 'editors_choice';
  return badge ?? 'undiscovered';
}

// ══════════════════════════════════════════════════════════════════════════════
// Photographer Hall of Fame (seasonal aggregate) — v5 §6: DO NOT TOUCH.
// Unchanged from v4: ranks photographers on the AVERAGE of all their in-window
// photo scores (rewards consistency). Kept here because the app imports it.
// ══════════════════════════════════════════════════════════════════════════════

const HOF_REF_PERCENTILE = 0.978;  // top 2.2% gets the compression tail
const HOF_COMP_A = 2.2;
const HOF_COMP_K = 0.4;
const HOF_LINEAR_CAP = 97.8;
const HOF_MAX_SCORE = 99.99;

export const PULSE_V5_HOF = {
  WINDOW_DAYS: 120,     // 4 months = 1 season
  MIN_PHOTOS: 22,       // must have ≥ 22 in-window photos to qualify
  PUBLIC_TOP: 10,       // only the top 10 are shown publicly
  RISING_MAX_DAYS: 90,  // Rising Talent eligibility
} as const;

// viral-compression score for the HoF top tail (avg relative to the 97.8th ref).
function hofCompression(avg: number, ref: number): number {
  const ratio = ref > 0 ? avg / ref : 1;
  const bonus = HOF_COMP_A * (1 - Math.exp(-HOF_COMP_K * (ratio - 1)));
  return Math.min(HOF_MAX_SCORE, HOF_LINEAR_CAP + bonus);
}

// nearest-rank percentile value on an ascending array.
function percentileValue(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx] ?? 0;
}

export type PhotographerBadge = 'season_legend' | 'season_top' | 'rising_talent' | 'hall_of_fame' | null;

export interface PhotographerInput {
  id: string;
  photoScores: number[];   // scores of ALL photos uploaded within the window
  accountAgeDays?: number; // for Rising Talent
}

export interface HofResult<T> {
  item: T;
  qualified: boolean;
  photoCount: number;
  avgScore: number;
  rank: number | null;
  percentile: number | null;
  hofScore: number | null;
  isTop10: boolean;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export function rankPhotographers<T extends PhotographerInput>(photographers: T[]): HofResult<T>[] {
  const qualified = photographers.filter((p) => p.photoScores.length >= PULSE_V5_HOF.MIN_PHOTOS);
  const M = qualified.length;
  const avgById = new Map<string, number>();
  qualified.forEach((p) => avgById.set(p.id, mean(p.photoScores)));

  const sortedAvg = qualified.map((p) => avgById.get(p.id) ?? 0).sort((a, b) => a - b);
  const ref = percentileValue(sortedAvg, HOF_REF_PERCENTILE);
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
    const hof = pct <= HOF_REF_PERCENTILE ? pct * 100 : hofCompression(avgScore, ref);
    return { item, qualified: true, photoCount, avgScore, rank, percentile: pct, hofScore: round1(hof), isTop10: rank > M - PULSE_V5_HOF.PUBLIC_TOP };
  });
}

export function photographerBadge(o: { hofScore: number | null; accountAgeDays?: number }): PhotographerBadge {
  if (o.hofScore == null) return null;
  if (o.hofScore >= 99.5) return 'season_legend';
  if (o.hofScore >= HOF_LINEAR_CAP) return 'season_top';
  if (o.hofScore >= 95 && (o.accountAgeDays ?? Infinity) <= PULSE_V5_HOF.RISING_MAX_DAYS) return 'rising_talent';
  return null;
}
