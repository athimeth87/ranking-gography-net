import { describe, it, expect } from 'vitest';
import { pulseScore, rankPhotos } from '@/lib/pulse';
import type { PhotoSeed } from '@/lib/types';

const base: Omit<PhotoSeed, 'id' | 'likes' | 'likes24h' | 'hours' | 'picks'> = {
  slug: 's', title: 't', by: 'u', cat: 'Landscape', w: 1, h: 1, src: '',
  caption: '', exif: { camera: '', lens: '', iso: 0, shutter: '', aperture: '', focal: '' },
  comments: 0, favorites: 0, date: '2026.01.01',
};

const seed = (over: Partial<PhotoSeed> & Pick<PhotoSeed, 'id'>): PhotoSeed => ({
  ...base, likes: 0, likes24h: 0, hours: 1, picks: [], ...over,
});

describe('pulseScore', () => {
  it('weights 24h likes triple and divides by hours', () => {
    expect(pulseScore(seed({ id: 'a', likes: 100, likes24h: 10, hours: 2 }))).toBe(65);
  });
  it('adds 50 bonus for a single pick', () => {
    expect(pulseScore(seed({ id: 'a', likes: 0, likes24h: 0, hours: 1, picks: ['editor'] }))).toBe(50);
  });
  it('adds 100 bonus for both picks', () => {
    expect(pulseScore(seed({ id: 'a', likes: 0, likes24h: 0, hours: 1, picks: ['editor', 'ambassador'] }))).toBe(100);
  });
  it('floors hours at 1', () => {
    expect(pulseScore(seed({ id: 'a', likes: 10, likes24h: 0, hours: 0 }))).toBe(10);
  });
});

describe('rankPhotos', () => {
  it('sorts by pulse desc and assigns 1-based ranks without mutating input', () => {
    const seeds = [
      seed({ id: 'low', likes: 1 }),
      seed({ id: 'high', likes: 1000 }),
    ];
    const ranked = rankPhotos(seeds);
    expect(ranked.map((p) => p.id)).toEqual(['high', 'low']);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.rank).toBe(2);
    expect('pulse' in seeds[0]!).toBe(false); // input untouched
  });
});
