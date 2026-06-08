// Pulse Scoring v2 — implements pulse-scoring-MASTER.md §01 (LOCKED).
//
//   L1  engagement = 3·comments + 2·favorites + 1·likes        (weights 3:2:1)
//   L2  rate = engagement / max(views,1)
//       adjusted_rate = (v·rate + m·C) / (v + m)                (Bayesian smoothing)
//         v = photo views (impressions, §2.3)
//         m = max(median_views_30d, 10)                         (prior, §7.4)
//         C = mean_rate_7d                                      (field avg rate)
//   L3  decay(age): peak 0–1d=1.0, linear 1–7d→0.3, floor 0.3 after  (§7.2)
//
//   ranking_score = adjusted_rate · decay
//   display       = percentile(ranking_score) · 100            (0–100, §2/§3)
//   badge         = percentile + min-views gates               (§4 / §11)

import type { PickType } from '@/lib/pulse-engine';

// §00 / §07 — locked constants.
export const PULSE_V2 = {
  W_COMMENT: 3,
  W_FAVORITE: 2,
  W_LIKE: 1,
  PEAK_DAYS: 1,
  DECAY_END_DAYS: 7,
  DECAY_SPAN: 0.7,         // 1.0 → 0.3 across days 1..7
  DECAY_FLOOR: 0.3,
  PRIOR_MEDIAN_FLOOR: 10,  // §7.4 — m floor
  // §7.3 / §4 badge gates
  TOP_FIELD_PCT: 0.99,
  POPULAR_PCT: 0.95,
  TRENDING_PCT: 0.90,
  GEM_PCT: 0.90,
  BADGE_MIN_VIEWS: 100,     // Top of the Field / Popular
  TRENDING_MIN_VIEWS: 50,
  TRENDING_MAX_AGE_HOURS: 48,
  GEM_MIN_VIEWS: 30,
} as const;

export type Badge = 'top_field' | 'popular' | 'trending' | 'hidden_gem' | null;

export interface PhotoInput {
  id: string;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  impressions_count: number;   // = views (§2.3 LOCKED: impressions are the divisor)
  created_at: string | Date;
  pick_type?: PickType;
}

export interface EcosystemStats {
  meanRate7d: number;      // C
  medianViews30d: number;  // m (raw median; floor applied in adjustedRate)
}

// ── Layer 1 — weighted engagement (3:2:1) ────────────────────────────────────
export function engagement(p: Pick<PhotoInput, 'likes_count' | 'favorites_count' | 'comments_count'>): number {
  return PULSE_V2.W_COMMENT * p.comments_count
    + PULSE_V2.W_FAVORITE * p.favorites_count
    + PULSE_V2.W_LIKE * p.likes_count;
}

export function engagementRate(p: PhotoInput): number {
  return engagement(p) / Math.max(p.impressions_count, 1);
}

// ── Layer 2 — Bayesian-smoothed rate ─────────────────────────────────────────
export function adjustedRate(p: PhotoInput, eco: EcosystemStats): number {
  const v = Math.max(p.impressions_count, 0);
  const rate = engagementRate(p);
  const m = Math.max(eco.medianViews30d, PULSE_V2.PRIOR_MEDIAN_FLOOR);
  const C = eco.meanRate7d;
  return (v * rate + m * C) / (v + m);
}

// ── Layer 3 — piecewise time decay with floor ────────────────────────────────
export function decay(ageDays: number): number {
  if (ageDays <= PULSE_V2.PEAK_DAYS) return 1.0;
  if (ageDays <= PULSE_V2.DECAY_END_DAYS) return 1.0 - PULSE_V2.DECAY_SPAN * (ageDays - 1) / 6;
  return PULSE_V2.DECAY_FLOOR;
}

export function ageDays(created: string | Date, now: number): number {
  return Math.max(0, (now - new Date(created).getTime()) / 86_400_000);
}

// ranking score = adjusted_rate · decay  (the value the field is ordered by)
export function rankingScore(p: PhotoInput, eco: EcosystemStats, now: number): number {
  return adjustedRate(p, eco) * decay(ageDays(p.created_at, now));
}

// ── Ecosystem stats from a field (C = mean rate, m = median views) ───────────
export function computeEcosystemStats(photos: PhotoInput[]): EcosystemStats {
  if (photos.length === 0) return { meanRate7d: 0.05, medianViews30d: PULSE_V2.PRIOR_MEDIAN_FLOOR };
  const rates = photos.map(engagementRate);
  const meanRate = rates.reduce((s, r) => s + r, 0) / rates.length;
  const views = photos.map((p) => p.impressions_count).sort((a, b) => a - b);
  const mid = Math.floor(views.length / 2);
  const median = views.length % 2 ? views[mid]! : (views[mid - 1]! + views[mid]!) / 2;
  return { meanRate7d: meanRate, medianViews30d: median };
}

// ── Badges (§4 / §11) — percentile + minimum-views gates ─────────────────────
export function assignBadge(opts: {
  percentile: number; views: number; ageHours: number; medianViews: number;
}): Badge {
  const { percentile, views, ageHours, medianViews } = opts;
  if (views >= PULSE_V2.BADGE_MIN_VIEWS && percentile >= PULSE_V2.TOP_FIELD_PCT) return 'top_field';
  if (views >= PULSE_V2.BADGE_MIN_VIEWS && percentile >= PULSE_V2.POPULAR_PCT) return 'popular';
  if (views >= PULSE_V2.TRENDING_MIN_VIEWS && ageHours <= PULSE_V2.TRENDING_MAX_AGE_HOURS && percentile >= PULSE_V2.TRENDING_PCT) return 'trending';
  if (views >= PULSE_V2.GEM_MIN_VIEWS && percentile >= PULSE_V2.GEM_PCT && views < medianViews) return 'hidden_gem';
  return null;
}

export interface Ranked {
  id: string;
  rankingScore: number;
  percentile: number;   // 0..1, 1 = best
  displayScore: number; // 0..100 = percentile · 100
  badge: Badge;
}

// Rank the whole field: ranking score → percentile (tiebreak likes → recency) →
// display + badge. `now` is passed in (Date.now() at the call site).
export function rankField(photos: PhotoInput[], now: number): Ranked[] {
  if (photos.length === 0) return [];
  const eco = computeEcosystemStats(photos);
  const scored = photos.map((p) => ({ p, s: rankingScore(p, eco, now) }));

  const ts = (d: string | Date) => new Date(d).getTime();
  const ordered = [...scored].sort((a, b) =>
    a.s - b.s ||
    a.p.likes_count - b.p.likes_count ||
    ts(a.p.created_at) - ts(b.p.created_at),
  );

  const denom = Math.max(ordered.length - 1, 1);
  const pctById = new Map<string, number>();
  ordered.forEach((x, i) => pctById.set(x.p.id, i / denom));

  return scored.map(({ p, s }) => {
    const percentile = pctById.get(p.id) ?? 0;
    const hours = ageDays(p.created_at, now) * 24;
    return {
      id: p.id,
      rankingScore: s,
      percentile,
      displayScore: Math.round(percentile * 100 * 10) / 10,
      badge: assignBadge({ percentile, views: p.impressions_count, ageHours: hours, medianViews: eco.medianViews30d }),
    };
  });
}

// Badge → status tier used by the UI badge component.
export type PulseStatus = 'undiscovered' | 'hidden_gem' | 'trending' | 'popular' | 'top_field' | 'editors_choice';

export function statusFromBadge(badge: Badge, pickType: PickType = 'none'): PulseStatus {
  if (pickType !== 'none') return 'editors_choice';
  return badge ?? 'undiscovered';
}
