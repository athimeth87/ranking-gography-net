import { describe, it, expect } from 'vitest';
import { mergeLivePulse, type LivePulse } from '@/lib/realtime-pulse';
import type { Photo } from '@/lib/types';

const base = (over: Partial<Photo>): Photo => ({
  id: 'p1', slug: 'p1', title: 't', by: 'u', cat: 'Landscape', w: 4, h: 3,
  src: 'x', caption: '', exif: { camera: '', lens: '', iso: 0, shutter: '', aperture: '', focal: '' },
  likes: 1, likes24h: 0, comments: 0, favorites: 0, hours: 1, picks: [], date: '',
  pulse: 10, peakPulse: 10, pickType: 'none', percentile: 0.1, badge: null, rank: 0,
  ...over,
});

describe('mergeLivePulse', () => {
  it('overrides pulse + counters from the live map', () => {
    const live: Record<string, LivePulse> = {
      p1: { pulse: 80, peakPulse: 80, percentile: 0.9, badge: 'trending', likes: 50, favorites: 5, comments: 2 },
    };
    const [out] = mergeLivePulse([base({ id: 'p1' })], live);
    expect(out!.pulse).toBe(80);
    expect(out!.likes).toBe(50);
    expect(out!.favorites).toBe(5);
    expect(out!.badge).toBe('trending');
  });

  it('leaves photos with no live entry untouched', () => {
    const [out] = mergeLivePulse([base({ id: 'p2', pulse: 12 })], {});
    expect(out!.pulse).toBe(12);
  });

  it('re-sorts by pulse descending when sort=true', () => {
    const photos = [base({ id: 'a', pulse: 10 }), base({ id: 'b', pulse: 20 })];
    const live = { a: { pulse: 99, peakPulse: 99, percentile: 1, badge: null, likes: 0, favorites: 0, comments: 0 } };
    const out = mergeLivePulse(photos, live, true);
    expect(out.map((p) => p.id)).toEqual(['a', 'b']);
    expect(out[0]!.rank).toBe(1);
    expect(out[1]!.rank).toBe(2);
  });

  it('returns [] for empty input', () => {
    expect(mergeLivePulse([], { x: { pulse: 1, peakPulse: 1, percentile: 0, badge: null, likes: 0, favorites: 0, comments: 0 } })).toEqual([]);
  });

  it('ignores live entries with no matching photo (no phantom rows)', () => {
    const out = mergeLivePulse([base({ id: 'p1' })], { ghost: { pulse: 99, peakPulse: 99, percentile: 1, badge: null, likes: 9, favorites: 9, comments: 9 } });
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe('p1');
    expect(out[0]!.likes).toBe(1);
  });
});
