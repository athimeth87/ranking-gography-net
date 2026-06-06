import { describe, it, expect } from 'vitest';
import {
  engagement, adjustedRate, decay, rankingScore, computeEcosystemStats,
  assignBadge, rankField, statusFromBadge, voteWeight, effectiveLikes,
  type PhotoInput, type EcosystemStats,
} from '@/lib/pulse-engine-v2';

const NOW = new Date('2026-06-06T00:00:00Z').getTime();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const photo = (o: Partial<PhotoInput> & { id: string }): PhotoInput => ({
  likes_count: 0, favorites_count: 0, comments_count: 0, impressions_count: 0,
  created_at: daysAgo(0), ...o,
});

describe('v2 L1 — weighted engagement 3:2:1', () => {
  it('comment ×3, favorite ×2, like ×1', () => {
    expect(engagement({ likes_count: 1, favorites_count: 1, comments_count: 1 })).toBe(6);
    expect(engagement({ likes_count: 10, favorites_count: 0, comments_count: 0 })).toBe(10);
    expect(engagement({ likes_count: 0, favorites_count: 0, comments_count: 10 })).toBe(30);
  });
});

describe('v2 — anti-collusion vote weighting (merged from v1)', () => {
  it('a normal stranger like ≈ 1.0; follower/reciprocal/collusion are discounted', () => {
    expect(voteWeight({})).toBeCloseTo(1.0, 5);
    expect(voteWeight({ voter_follows_owner: true })).toBeCloseTo(0.6, 5);
    expect(voteWeight({ owner_voted_on_voter_recently: true })).toBeCloseTo(0.4, 5);
    expect(voteWeight({ collusion_pair_count: 5 })).toBeCloseTo(0.3, 5);
  });
  it('effectiveLikes uses weighted votes when present, else the raw count', () => {
    expect(effectiveLikes({ likes_count: 9 })).toBe(9);                      // no detail → raw
    expect(effectiveLikes({ likes_count: 0, votes: [{}, {}, {}] })).toBeCloseTo(3, 5); // 3 clean likes
  });
  it('a colluding ring scores far below the same number of honest likes', () => {
    const honest = engagement({ likes_count: 0, favorites_count: 0, comments_count: 0, votes: Array.from({ length: 10 }, () => ({})) });
    const ring = engagement({ likes_count: 0, favorites_count: 0, comments_count: 0, votes: Array.from({ length: 10 }, () => ({ collusion_pair_count: 9, owner_voted_on_voter_recently: true })) });
    expect(ring).toBeLessThan(honest * 0.3);  // ~10 vs ~1.2
  });
});

describe('v2 L3 — piecewise decay matches spec table', () => {
  it('peak 0–1d=1.0, fades to 0.30 by 7d, then floor', () => {
    expect(decay(0)).toBe(1.0);
    expect(decay(1)).toBe(1.0);
    expect(decay(3)).toBeCloseTo(0.77, 2);
    expect(decay(5)).toBeCloseTo(0.53, 2);
    expect(decay(7)).toBeCloseTo(0.30, 2);
    expect(decay(14)).toBe(0.30);
    expect(decay(365)).toBe(0.30);
  });
});

describe('v2 L2 — Bayesian smoothing', () => {
  const eco: EcosystemStats = { meanRate7d: 0.05, medianViews30d: 200 };
  it('a 1-like/1-view fluke is pulled toward C, not its raw 100% rate', () => {
    expect(adjustedRate(photo({ id: 'x', likes_count: 1, impressions_count: 1 }), eco)).toBeLessThan(0.1);
  });
  it('same rate, more views → higher confidence → higher adjusted rate', () => {
    const lowV = adjustedRate(photo({ id: 'a', likes_count: 5, impressions_count: 10 }), eco);     // rate 0.5, v=10
    const highV = adjustedRate(photo({ id: 'b', likes_count: 500, impressions_count: 1000 }), eco); // rate 0.5, v=1000
    expect(highV).toBeGreaterThan(lowV);
  });
});

describe('v2 L3 — decay lets fresh compete with old', () => {
  it('a 30-day-old photo scores exactly 0.3× of the same photo fresh', () => {
    const eco = computeEcosystemStats([]);
    const fresh = rankingScore(photo({ id: 'a', likes_count: 50, impressions_count: 500, created_at: daysAgo(0) }), eco, NOW);
    const old = rankingScore(photo({ id: 'b', likes_count: 50, impressions_count: 500, created_at: daysAgo(30) }), eco, NOW);
    expect(old).toBeCloseTo(fresh * 0.3, 6);
  });
});

describe('v2 §4 — badges (percentile + min-views gates)', () => {
  it('Popular = top 5% AND views ≥ 100', () => {
    expect(assignBadge({ percentile: 0.97, views: 500, ageHours: 100, medianViews: 200 })).toBe('popular');
    // < 100 views and at/above median → not Popular, not a gem either
    expect(assignBadge({ percentile: 0.97, views: 50, ageHours: 100, medianViews: 40 })).toBeNull();
    expect(assignBadge({ percentile: 0.995, views: 500, ageHours: 100, medianViews: 200 })).toBe('top_field');
  });
  it('Trending = top 10% of photos < 48h', () => {
    expect(assignBadge({ percentile: 0.92, views: 80, ageHours: 24, medianViews: 200 })).toBe('trending');
    // > 48h and views ≥ median → not trending, not a gem either
    expect(assignBadge({ percentile: 0.92, views: 300, ageHours: 72, medianViews: 200 })).toBeNull();
  });
  it('Hidden Gem = top 10% rate but below-median views', () => {
    expect(assignBadge({ percentile: 0.93, views: 40, ageHours: 200, medianViews: 200 })).toBe('hidden_gem');
  });
  it('no badge below the smallest min-views gate', () => {
    expect(assignBadge({ percentile: 0.99, views: 10, ageHours: 1, medianViews: 200 })).toBeNull();
  });
});

describe('v2 — scale invariance + no inflation', () => {
  it('field leader displays 100 whether the field is small or huge', () => {
    const small = rankField([1, 2, 3, 5, 8].map((l, i) => photo({ id: `s${i}`, likes_count: l, impressions_count: l * 10 })), NOW);
    const huge = rankField([10, 50, 200, 1000, 5000].map((l, i) => photo({ id: `h${i}`, likes_count: l, impressions_count: l * 10 })), NOW);
    expect(Math.max(...small.map((r) => r.displayScore))).toBe(100);
    expect(Math.max(...huge.map((r) => r.displayScore))).toBe(100);
  });
  it('Popular stays ≈ top 5% regardless of how many photos play', () => {
    const photos = Array.from({ length: 200 }, (_, i) => photo({ id: `p${i}`, likes_count: i, impressions_count: 150 }));
    const ranked = rankField(photos, NOW);
    const top = ranked.filter((r) => r.badge === 'popular' || r.badge === 'top_field').length;
    expect(top).toBeLessThanOrEqual(Math.ceil(200 * 0.06));
    expect(top).toBeGreaterThan(0);
  });
});

describe('v2 — status mapping', () => {
  it('editor pick overrides; otherwise mirrors the badge', () => {
    expect(statusFromBadge('popular')).toBe('popular');
    expect(statusFromBadge(null)).toBe('undiscovered');
    expect(statusFromBadge('popular', 'editor')).toBe('editors_choice');
  });
});
