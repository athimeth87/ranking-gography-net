import { describe, it, expect } from 'vitest';
import { seasonDisplayScore, communityBaseline, PULSE_V5 } from '@/lib/pulse-engine-v4';

// simulate_v5_season — validation harness for the §4.2 acceptance gates.
//
// Deterministic right-skewed engagement pool (most photos low, a few high), the
// shape a real season produces. We converge the baseline B the way the cron does
// (EMA from the prior floor), score the whole pool, and check the locked gates.

function genPool(n: number): number[] {
  // E ≈ 80·r²  (r = rank fraction), plus a short heavy tail for the top ~5%.
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const r = (i + 0.5) / n;
    const base = 80 * r * r;
    const tail = r > 0.95 ? 300 * ((r - 0.95) / 0.05) : 0;
    out.push(Math.round(base + tail));
  }
  return out;
}

// Run the EMA baseline to its steady state, exactly as the cron would over many
// rounds (proves the ±10%/round clamp converges to p60, not just lands there).
function convergedBaseline(engagements: number[]): number {
  let b: number = PULSE_V5.BASELINE_PRIOR_FLOOR;
  for (let i = 0; i < 80; i++) b = communityBaseline(engagements, b);
  return b;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function scorePool(engagements: number[]): { scores: number[]; B: number } {
  const B = convergedBaseline(engagements);
  return { scores: engagements.map((e) => seasonDisplayScore(e, B)), B };
}

describe('simulate v5 — §4.2 acceptance gates', () => {
  const SIZES = [80, 1500, 15000];

  it('median pool score lands in 50–65 at every pool size', () => {
    for (const n of SIZES) {
      const { scores } = scorePool(genPool(n));
      const med = median(scores);
      expect(med, `n=${n} median=${med}`).toBeGreaterThanOrEqual(50);
      expect(med, `n=${n} median=${med}`).toBeLessThanOrEqual(65);
    }
  });

  it('no photo hits the 99.9 ceiling', () => {
    for (const n of SIZES) {
      const { scores } = scorePool(genPool(n));
      const atCeiling = scores.filter((s) => s >= 99.9).length;
      expect(atCeiling, `n=${n} hit ceiling`).toBe(0);
    }
  });

  it('a brand-new photo with 10 likes moves ≥ +10 over the floor', () => {
    const { B } = scorePool(genPool(1500));
    const fresh = seasonDisplayScore(0, B);          // E = 0 → floor 25
    const tenLikes = seasonDisplayScore(10, B);       // 10 regular likes → E = 10
    expect(fresh).toBe(PULSE_V5.FLOOR);
    expect(tenLikes - fresh).toBeGreaterThanOrEqual(10);
  });

  it('distribution holds its shape when the pool grows ×100 (median stays ~56)', () => {
    const small = scorePool(genPool(150));
    const big = scorePool(genPool(15000));
    const medSmall = median(small.scores);
    const medBig = median(big.scores);
    expect(Math.abs(medSmall - medBig)).toBeLessThan(3);
    expect(medBig).toBeGreaterThanOrEqual(50);
    expect(medBig).toBeLessThanOrEqual(65);
  });

  it('scores are monotonic in engagement (more votes never lowers the score)', () => {
    const { B } = scorePool(genPool(1500));
    let prev = -1;
    for (let e = 0; e <= 2000; e += 5) {
      const s = seasonDisplayScore(e, B);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
});
