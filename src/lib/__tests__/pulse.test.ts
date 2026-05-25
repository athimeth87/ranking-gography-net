import { describe, it, expect } from 'vitest';
import { pulseScore, rankPhotos, PULSE_FLOOR, PULSE_PARAMS } from '@/lib/pulse';
import { computePulse, voteWeight, formatPulseDisplay } from '@/lib/pulse-engine';
import type { PhotoSeed } from '@/lib/types';

const base: Omit<PhotoSeed, 'id' | 'likes' | 'likes24h' | 'hours' | 'picks'> = {
  slug: 's', title: 't', by: 'u', cat: 'Landscape', w: 1, h: 1, src: '',
  caption: '', exif: { camera: '', lens: '', iso: 0, shutter: '', aperture: '', focal: '' },
  comments: 0, favorites: 0, date: '2026.01.01',
};

const seed = (over: Partial<PhotoSeed> & Pick<PhotoSeed, 'id'>): PhotoSeed => ({
  ...base, likes: 0, likes24h: 0, hours: 1, picks: [], ...over,
});

describe('pulseScore (floor + ceiling)', () => {
  it('never goes below the 19 floor — empty photo', () => {
    expect(pulseScore(seed({ id: 'a' }))).toBeGreaterThanOrEqual(PULSE_FLOOR);
  });
  it('never goes above 100', () => {
    expect(pulseScore(seed({ id: 'a', likes: 100_000, favorites: 10_000, comments: 5_000, picks: ['editor', 'ambassador'] }))).toBeLessThanOrEqual(100);
  });
  it('is monotonic with engagement', () => {
    const low = pulseScore(seed({ id: 'a', likes: 10 }));
    const high = pulseScore(seed({ id: 'a', likes: 1000 }));
    expect(high).toBeGreaterThan(low);
  });
  it('returns an integer', () => {
    expect(Number.isInteger(pulseScore(seed({ id: 'a', likes: 73, favorites: 4, comments: 2 })))).toBe(true);
  });
});

describe('formatPulseDisplay', () => {
  it('clamps null to the floor', () => {
    expect(formatPulseDisplay(null)).toBe(String(PULSE_FLOOR));
  });
  it('clamps NaN to the floor', () => {
    expect(formatPulseDisplay(Number.NaN)).toBe(String(PULSE_FLOOR));
  });
  it('rounds and clamps above the ceiling', () => {
    expect(formatPulseDisplay(150)).toBe('100');
  });
  it('rounds normal values', () => {
    expect(formatPulseDisplay(57.4)).toBe('57');
    expect(formatPulseDisplay(57.6)).toBe('58');
  });
});

describe('voteWeight', () => {
  it('non-follower carries full weight, follower carries less', () => {
    const f = voteWeight({ voter_id: 'x', voted_at: '2026-05-25', voter_follows_owner: true });
    const nf = voteWeight({ voter_id: 'x', voted_at: '2026-05-25', voter_follows_owner: false });
    expect(nf).toBeGreaterThan(f);
  });
  it('reciprocal vote within 30 days is heavily discounted', () => {
    const neutral = voteWeight({ voter_id: 'x', voted_at: '2026-05-25', owner_voted_on_voter_recently: false });
    const recip = voteWeight({ voter_id: 'x', voted_at: '2026-05-25', owner_voted_on_voter_recently: true });
    expect(recip).toBeLessThan(neutral);
    expect(recip / neutral).toBeCloseTo(PULSE_PARAMS.VOTE_WEIGHT.RECIPROCITY_FACTOR, 1);
  });
  it('collusion pattern (>=5 reciprocal in 7d) triggers the anti-collusion factor', () => {
    const clean = voteWeight({ voter_id: 'x', voted_at: '2026-05-25', collusion_pair_count: 0 });
    const colluder = voteWeight({ voter_id: 'x', voted_at: '2026-05-25', collusion_pair_count: 6 });
    expect(colluder).toBeLessThan(clean);
  });
});

describe('computePulse (decay)', () => {
  const now = new Date('2026-05-25T12:00:00Z');

  it('a fresh upload (within 24h) has no decay', () => {
    const fresh = computePulse({
      likes_count: 100, favorites_count: 10, comments_count: 5, impressions_count: 1000,
      uploaded_at: new Date('2026-05-25T00:00:00Z'), now,
    });
    const day3 = computePulse({
      likes_count: 100, favorites_count: 10, comments_count: 5, impressions_count: 1000,
      uploaded_at: new Date('2026-05-22T00:00:00Z'), now,
    });
    expect(fresh).toBeGreaterThan(day3);
  });

  it('decayed score still respects the 19 floor', () => {
    const ancient = computePulse({
      likes_count: 0, favorites_count: 0, comments_count: 0, impressions_count: 0,
      uploaded_at: new Date('2024-01-01T00:00:00Z'), now,
    });
    expect(ancient).toBeGreaterThanOrEqual(PULSE_FLOOR);
  });
});

describe('rankPhotos', () => {
  it('sorts by pulse desc and assigns 1-based ranks without mutating input', () => {
    const seeds = [
      seed({ id: 'low', likes: 1 }),
      seed({ id: 'high', likes: 1000, favorites: 100, comments: 50 }),
    ];
    const ranked = rankPhotos(seeds);
    expect(ranked.map((p) => p.id)).toEqual(['high', 'low']);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.rank).toBe(2);
    expect('pulse' in seeds[0]!).toBe(false);
  });
});
