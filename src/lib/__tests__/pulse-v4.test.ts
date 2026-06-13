import { describe, it, expect } from 'vitest';
import {
  SCORE_MATRIX, PULSE_V5,
  seasonDisplayScore, budgetWeight, collusionFactor, communityBaseline, voteAspectWeight,
  rankPhotographers, photographerBadge,
} from '@/lib/pulse-engine-v4';

describe('v5 §2 — score matrix (role × action) unchanged (D9)', () => {
  it('matches the locked table', () => {
    expect(SCORE_MATRIX.ambassador).toEqual({ like: 5, favorite: 10, share: 20 });
    expect(SCORE_MATRIX.rankmaster).toEqual({ like: 3, favorite: 6, share: 12 });
    expect(SCORE_MATRIX.regular).toEqual({ like: 1, favorite: 2, share: 4 });
  });
});

describe('v5 §2.4 — 3-layer display score (floor / Hill / cap)', () => {
  it('E = 0 → floor 25.0 (undiscovered)', () => {
    expect(seasonDisplayScore(0, 10)).toBe(25.0);
    expect(seasonDisplayScore(0, 56)).toBe(25.0);
  });

  it('cap is applied AFTER rounding — a massive E never shows 100.0', () => {
    expect(seasonDisplayScore(1_000_000, 10)).toBe(99.9);
    expect(seasonDisplayScore(1e9, 10)).toBe(99.9);
    expect(seasonDisplayScore(1e9, 10)).toBeLessThanOrEqual(99.9);
  });

  it('x = 1 (E = B) → exactly 62.5', () => {
    expect(seasonDisplayScore(50, 50)).toBe(62.5); // 25 + 74.9*0.5 = 62.45 → 62.5
  });

  it('monotonic in E — more engagement never lowers the score', () => {
    let prev = -1;
    for (let E = 0; E <= 5000; E += 25) {
      const s = seasonDisplayScore(E, 56);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
});

describe('v5 §2.5 — daily vote budget', () => {
  it('first 20 votes full weight, then soft taper (vote 40 = half)', () => {
    expect(budgetWeight(1)).toBe(1.0);
    expect(budgetWeight(20)).toBe(1.0);
    expect(budgetWeight(21)).toBeCloseTo(20 / 21, 6);
    expect(budgetWeight(40)).toBe(0.5);
    expect(PULSE_V5.DAILY_VOTE_BUDGET).toBe(20);
  });
});

describe('v5 §2.6 — anti-collusion factor', () => {
  it('flagged pair ×0.3, otherwise ×1.0', () => {
    expect(collusionFactor(true)).toBe(0.3);
    expect(collusionFactor(false)).toBe(1.0);
    expect(PULSE_V5.COLLUSION_FACTOR).toBe(0.3);
  });
});

describe('Vote Aspect — multi-aspect weight (mirrors migration 0033)', () => {
  // Independent re-implementation of vote_aspect_weight() in SQL.
  const sqlWeight = (c: boolean, co: boolean, l: boolean, legacy: boolean) =>
    legacy ? 1.0 : (Number(c) + Number(co) + Number(l) >= 2 ? 1.25 : 1.0);

  it('one side = 1.0, ≥2 sides = 1.25, legacy = 1.0', () => {
    expect(voteAspectWeight({ aspectColor: true, aspectComposition: false, aspectLight: false })).toBe(1.0);
    expect(voteAspectWeight({ aspectColor: true, aspectComposition: true, aspectLight: false })).toBe(1.25);
    expect(voteAspectWeight({ aspectColor: true, aspectComposition: true, aspectLight: true })).toBe(1.25);
    expect(voteAspectWeight({ aspectColor: false, aspectComposition: false, aspectLight: false, isLegacy: true })).toBe(1.0);
    expect(PULSE_V5.MULTI_VOTE_WEIGHT).toBe(1.25);
  });

  it('throws if no aspect is selected (an aspect-less vote cannot be weighted)', () => {
    expect(() => voteAspectWeight({ aspectColor: false, aspectComposition: false, aspectLight: false })).toThrow();
  });

  it('TS ↔ DB parity across all 8 aspect combinations (+ legacy)', () => {
    for (const c of [false, true]) for (const co of [false, true]) for (const l of [false, true]) {
      if (!c && !co && !l) continue; // invalid for a non-legacy vote
      expect(voteAspectWeight({ aspectColor: c, aspectComposition: co, aspectLight: l }))
        .toBe(sqlWeight(c, co, l, false));
    }
    expect(voteAspectWeight({ aspectColor: false, aspectComposition: false, aspectLight: false, isLegacy: true }))
      .toBe(sqlWeight(false, false, false, true));
  });
});

describe('v5 §2.3 — community baseline B (p60, EMA clamp, prior floor)', () => {
  it('clamps the move to ±10% of the old B per round', () => {
    // pool p60 is far above old → B can only rise 10%
    const highPool = Array.from({ length: 100 }, (_, i) => 500 + i);
    expect(communityBaseline(highPool, 100)).toBeCloseTo(110, 6); // 100 × 1.1
    // pool p60 is far below old → B can only fall 10% (but not below the prior floor)
    const lowPool = Array.from({ length: 100 }, () => 1);
    expect(communityBaseline(lowPool, 100, 10)).toBeCloseTo(90, 6); // 100 × 0.9
  });

  it('never drops below the prior floor', () => {
    const lowPool = Array.from({ length: 100 }, () => 1);
    expect(communityBaseline(lowPool, 10, 10)).toBe(10);   // floor holds
    expect(communityBaseline([], 10, 25)).toBe(25);        // empty pool → prior
  });

  it('ignores E = 0 photos when measuring the pool', () => {
    const pool = [0, 0, 0, 0, 50, 60, 70, 80, 90, 100];
    // only the positive values feed p60; result stays within ±10% of a large old
    expect(communityBaseline(pool, 1000, 10)).toBeCloseTo(900, 6); // clamped to 1000×0.9
  });
});

// ── Parity: the TS engine must equal the DB SQL formula character-for-character ──
// Independent re-implementation of 0032's SQL: least(round(25 + 74.9*x/(x+1),1),99.9).
// This is the bug class the spec calls out (TS and DB drifting apart).
function sqlMirrorScore(E: number, B: number): number {
  const b = B > 0 ? B : 10;
  const x = E / b;
  const raw = 25 + 74.9 * (x / (x + 1));
  const rounded = Math.round(raw * 10) / 10; // round to 1 dp (half away from zero, positive domain)
  return Math.min(rounded, 99.9);            // cap AFTER rounding
}

describe('v5 — TS ↔ DB parity (seasonDisplayScore vs SQL mirror)', () => {
  it('produces identical scores across a wide sweep of E and B', () => {
    const Bs = [10, 25, 56, 200, 900];
    for (const B of Bs) {
      for (let E = 0; E <= 200_000; E += 137) {
        expect(seasonDisplayScore(E, B)).toBe(sqlMirrorScore(E, B));
      }
    }
  });

  it('agrees exactly around the rounding/cap boundary', () => {
    for (let E = 14_800; E <= 15_200; E++) {
      expect(seasonDisplayScore(E, 10)).toBe(sqlMirrorScore(E, 10));
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Photographer Hall of Fame — v5 §6: unchanged. Kept green to prove no regression.
// ══════════════════════════════════════════════════════════════════════════════
describe('v5 §6 — photographer Hall of Fame (seasonal, untouched)', () => {
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
    expect(get('ph29').avgScore).toBe(30);
  });

  it('ranked by avg: top photographer is Top-10 with a tail score; mid ≈ percentile×100', () => {
    const top = get('ph49');
    expect(top.isTop10).toBe(true);
    expect(top.hofScore!).toBeGreaterThanOrEqual(97.8);
    const mid = get('ph24');
    expect(mid.hofScore!).toBeCloseTo(50, 0);
    expect(mid.isTop10).toBe(false);
  });

  it('photographer badges by HoF score + account age', () => {
    expect(photographerBadge({ hofScore: 99.6 })).toBe('season_legend');
    expect(photographerBadge({ hofScore: 98.0 })).toBe('season_top');
    expect(photographerBadge({ hofScore: 96, accountAgeDays: 60 })).toBe('rising_talent');
    expect(photographerBadge({ hofScore: 96, accountAgeDays: 200 })).toBeNull();
    expect(photographerBadge({ hofScore: null })).toBeNull();
  });
});
