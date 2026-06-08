import { describe, it, expect } from 'vitest';
import {
  SCORE_MATRIX, voteAgeWeight, voteValue, photoStatus,
  compressionScore, assignScores, assignBadge,
  rankPhotographers, photographerBadge,
  type Role, type VoteType,
} from '@/lib/pulse-engine-v4';

describe('v4 §2 — score matrix (role × action)', () => {
  it('matches the locked table', () => {
    expect(SCORE_MATRIX.ambassador).toEqual({ like: 5, favorite: 10, share: 20 });
    expect(SCORE_MATRIX.rankmaster).toEqual({ like: 3, favorite: 6, share: 12 });
    expect(SCORE_MATRIX.regular).toEqual({ like: 1, favorite: 2, share: 4 });
  });
});

describe('v4 §3 — per-vote age weight', () => {
  it('matches the table: 24h=1.0, 27h=0.55, 30h=0.1, locked=0.1', () => {
    expect(voteAgeWeight(0)).toBe(1.0);
    expect(voteAgeWeight(24)).toBe(1.0);
    expect(voteAgeWeight(27)).toBeCloseTo(0.55, 2);
    expect(voteAgeWeight(30)).toBeCloseTo(0.10, 2);
    expect(voteAgeWeight(36)).toBe(0.1);
  });
});

describe('v4 §9 — worked examples', () => {
  const sum = (votes: Array<{ role: Role; type: VoteType; n: number; age: number }>) =>
    votes.reduce((s, v) => s + v.n * voteValue({ role: v.role, type: v.type, qualityScore: 1, photoAgeHours: v.age }), 0);

  it('Photo A (age 12h) → engagement 67', () => {
    expect(sum([
      { role: 'ambassador', type: 'like', n: 3, age: 12 },
      { role: 'rankmaster', type: 'favorite', n: 2, age: 12 },
      { role: 'regular', type: 'like', n: 20, age: 12 },
      { role: 'ambassador', type: 'share', n: 1, age: 12 },
    ])).toBeCloseTo(67, 5);
  });

  it('Photo B (age 36h, locked) → engagement 7 (would be 70 before 24h)', () => {
    const locked = sum([
      { role: 'ambassador', type: 'share', n: 1, age: 36 },
      { role: 'regular', type: 'like', n: 50, age: 36 },
    ]);
    const fresh = sum([
      { role: 'ambassador', type: 'share', n: 1, age: 12 },
      { role: 'regular', type: 'like', n: 50, age: 12 },
    ]);
    expect(locked).toBeCloseTo(7, 5);
    expect(fresh).toBeCloseTo(70, 5);
  });

  it('quality_score scales the vote linearly', () => {
    expect(voteValue({ role: 'ambassador', type: 'share', qualityScore: 0.5, photoAgeHours: 0 })).toBe(10);
  });
});

describe('v4 §6 — viral compression curve', () => {
  it('matches the table at 1×/2×/5×/10×/20× the 97.8th ref', () => {
    const ref = 100;
    expect(compressionScore(1 * ref, ref)).toBeCloseTo(97.8, 1);
    expect(compressionScore(2 * ref, ref)).toBeCloseTo(98.5, 1);
    expect(compressionScore(5 * ref, ref)).toBeCloseTo(99.6, 1);
    expect(compressionScore(10 * ref, ref)).toBeCloseTo(99.9, 1);
    expect(compressionScore(20 * ref, ref)).toBeCloseTo(99.99, 1);
  });
});

describe('v4 §4 — assignScores (percentile + tail)', () => {
  const pool = Array.from({ length: 1000 }, (_, i) => ({ id: `p${i}`, engagement: i + 1 }));
  const scored = assignScores(pool);
  const by = (id: string) => scored.find((s) => s.item.id === id)!;

  it('linear below the 97.8th percentile: rank/N × 100', () => {
    expect(by('p499').score).toBeCloseTo(50.0, 1);   // rank 500 / 1000
    expect(by('p0').score).toBeCloseTo(0.1, 1);       // rank 1 / 1000
  });
  it('top photo sits in the compression tail (≥ 97.8, ≤ 99.99)', () => {
    const top = by('p999');                            // rank 1000, pct = 1.0
    expect(top.score).toBeGreaterThanOrEqual(97.8);
    expect(top.score).toBeLessThanOrEqual(99.99);
  });
  it('a genuinely viral photo (10× the field) scores ~99.9', () => {
    const viral = assignScores([
      ...Array.from({ length: 999 }, (_, i) => ({ id: `f${i}`, engagement: 100 })),
      { id: 'viral', engagement: 1000 },
    ]).find((s) => s.item.id === 'viral')!;
    expect(viral.score).toBeGreaterThanOrEqual(99.8);
  });
});

describe('v4 §5/§7 — status + badges', () => {
  it('status by age', () => {
    expect(photoStatus(10)).toBe('active');
    expect(photoStatus(27)).toBe('grace');
    expect(photoStatus(31)).toBe('locked');
  });
  it('badges by score + view eligibility', () => {
    expect(assignBadge({ score: 99.6, views: 150, active: true })).toBe('legendary');
    expect(assignBadge({ score: 98.0, views: 150, active: true })).toBe('popular');
    expect(assignBadge({ score: 96, views: 60, active: true })).toBe('trending');
    expect(assignBadge({ score: 92, views: 50, active: false })).toBe('hidden_gem');
    // popular needs views≥100 → with only 50 views it falls through to trending
    expect(assignBadge({ score: 98, views: 50, active: true })).toBe('trending');
    expect(assignBadge({ score: 80, views: 300, active: true })).toBeNull(); // below every tier
  });
});

describe('v5 §10 — photographer Hall of Fame (seasonal)', () => {
  // 50 qualified photographers (avg = i) + 2 unqualified (< 22 photos)
  const photographers = [
    ...Array.from({ length: 50 }, (_, i) => ({ id: `ph${i}`, photoScores: Array(22).fill(i + 1) })),
    { id: 'newbie', photoScores: Array(10).fill(90) },
  ];
  const hof = rankPhotographers(photographers);
  const get = (id: string) => hof.find((h) => h.item.id === id)!;

  it('< 22 in-window photos → not qualified, no HoF score', () => {
    const n = get('newbie');
    expect(n.qualified).toBe(false);
    expect(n.hofScore).toBeNull();
    expect(n.isTop10).toBe(false);
  });

  it('avg score = mean of ALL in-window photos (consistency, not top shots)', () => {
    expect(get('ph29').avgScore).toBe(30); // 22 photos all = 30
  });

  it('ranked by avg: top photographer is Top-10 with a tail score; mid ≈ percentile×100', () => {
    const top = get('ph49');     // highest avg → rank 50/50, pct 1.0
    expect(top.isTop10).toBe(true);
    expect(top.hofScore!).toBeGreaterThanOrEqual(97.8);
    const mid = get('ph24');     // rank 25/50 → pct 0.5
    expect(mid.hofScore!).toBeCloseTo(50, 0);
    expect(mid.isTop10).toBe(false);
  });

  it('photographer badges by HoF score + account age', () => {
    expect(photographerBadge({ hofScore: 99.6 })).toBe('season_legend');
    expect(photographerBadge({ hofScore: 98.0 })).toBe('season_top');
    expect(photographerBadge({ hofScore: 96, accountAgeDays: 60 })).toBe('rising_talent');
    expect(photographerBadge({ hofScore: 96, accountAgeDays: 200 })).toBeNull(); // too old to be "rising"
    expect(photographerBadge({ hofScore: null })).toBeNull();
  });
});
