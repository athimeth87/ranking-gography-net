import { describe, it, expect } from 'vitest';
import {
  getPhotos, getPhoto, getPhotographer, getAmbassadors,
  getSeasons, getCommentsFor, getVoyageurUsernames, getPhotographers,
} from '@/lib/data';

describe('data access', () => {
  it('returns photos ranked by pulse desc', () => {
    const photos = getPhotos();
    expect(photos.length).toBeGreaterThan(0);
    expect(photos[0]!.rank).toBe(1);
    for (let i = 1; i < photos.length; i++) {
      expect(photos[i - 1]!.pulse).toBeGreaterThanOrEqual(photos[i]!.pulse);
    }
  });
  it('filters by category', () => {
    expect(getPhotos({ category: 'BW' }).every((p) => p.cat === 'BW')).toBe(true);
  });
  it('finds a photo and photographer by id/username', () => {
    expect(getPhoto('p001')?.id).toBe('p001');
    expect(getPhoto('nope')).toBeUndefined();
    expect(getPhotographer('kanthorn')?.username).toBe('kanthorn');
  });
  it('returns only ambassadors', () => {
    expect(getAmbassadors().every((p) => p.isAmbassador)).toBe(true);
  });
  it('falls back to default comments', () => {
    expect(getCommentsFor('p004').length).toBeGreaterThan(0);
  });
  it('lists voyageur usernames', () => {
    expect(getVoyageurUsernames().has('pim.travels')).toBe(true);
  });
  it('exposes seasons', () => {
    expect(getSeasons().some((s) => s.status === 'live')).toBe(true);
  });

  it('returns default comments for an unknown photo id', () => {
    const fallback = getCommentsFor('p999');
    expect(fallback.length).toBeGreaterThan(0);
    expect(getCommentsFor('also-unknown')).toEqual(fallback);
    expect(getCommentsFor('p004')).not.toEqual(fallback);
  });

  it('filters by photographer username', () => {
    const photos = getPhotos({ by: 'kanthorn' });
    expect(photos.length).toBeGreaterThan(0);
    expect(photos.every((p) => p.by === 'kanthorn')).toBe(true);
  });

  it('sorts by recency (date desc) and by likes desc', () => {
    const byRecent = getPhotos({ sort: 'recent' });
    for (let i = 1; i < byRecent.length; i++) {
      expect(byRecent[i - 1]!.date.localeCompare(byRecent[i]!.date)).toBeGreaterThanOrEqual(0);
    }
    const byLikes = getPhotos({ sort: 'likes' });
    for (let i = 1; i < byLikes.length; i++) {
      expect(byLikes[i - 1]!.likes).toBeGreaterThanOrEqual(byLikes[i]!.likes);
    }
  });

  it('returns all photographers', () => {
    expect(getPhotographers()).toHaveLength(11);
  });
});
