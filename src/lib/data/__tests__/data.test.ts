import { describe, it, expect } from 'vitest';
import { getSeasons, mapDbPhoto, mapDbUser, userName } from '@/lib/data';

const users = [
  {
    id: 'u1',
    username: 'kanthorn',
    display_name: 'Kanthorn S.',
    avatar_url: 'https://example.com/a.jpg',
    cover_url: null,
    location: 'Bangkok',
    bio: 'bio',
    is_ambassador: true,
    is_customer: false,
    created_at: '2026-06-01T00:00:00Z',
  },
  { id: 'u2', display_name: 'No Username', is_customer: true },
];

const photoRow = {
  id: 'ph1',
  slug: 'misty-ridge',
  title: 'Misty Ridge',
  photographer_id: 'u1',
  category: 'bw',
  width: 4,
  height: 5,
  storage_url: 'https://cdn.example.com/ph1.jpg',
  description: 'desc',
  camera: 'Q3',
  likes_count: 12,
  comments_count: 3,
  favorites_count: 4,
  uploaded_at: '2026-06-10T00:00:00Z',
  pulse: '87.5',
  peak_pulse: 91,
  pick_type: 'editor' as const,
  percentile: '99.1',
  badge: 'top-10',
};

describe('seasons config', () => {
  it('exposes Season 1 as the live season ending 2026-10-08', () => {
    const seasons = getSeasons();
    const live = seasons.find((s) => s.status === 'live');
    expect(live).toBeDefined();
    expect(live?.name).toBe('Season 1');
    expect(live?.endDate).toBe('2026-10-08');
    expect(live?.winners).toBeNull();
  });
});

describe('live mappers', () => {
  it('userName prefers username, then display name', () => {
    expect(userName(users[0])).toBe('kanthorn');
    expect(userName(users[1])).toBe('No Username');
    expect(userName(undefined)).toBe('unknown');
  });

  it('mapDbPhoto maps a DB row to the Photo model', () => {
    const photo = mapDbPhoto(photoRow, users);
    expect(photo.id).toBe('ph1');
    expect(photo.slug).toBe('misty-ridge');
    expect(photo.by).toBe('kanthorn');
    expect(photo.cat).toBe('BW');
    expect(photo.src).toBe('https://cdn.example.com/ph1.jpg');
    expect(photo.likes).toBe(12);
    expect(photo.comments).toBe(3);
    expect(photo.favorites).toBe(4);
    expect(photo.pulse).toBe(87.5);
    expect(photo.peakPulse).toBe(91);
    expect(photo.pickType).toBe('editor');
    expect(photo.percentile).toBe(99.1);
    expect(photo.badge).toBe('top-10');
  });

  it('mapDbPhoto capitalizes non-BW categories and falls back to unknown owner', () => {
    const photo = mapDbPhoto({ ...photoRow, category: 'landscape', photographer_id: 'nope' }, users);
    expect(photo.cat).toBe('Landscape');
    expect(photo.by).toBe('unknown');
  });

  it('mapDbUser counts followers and photos from related rows', () => {
    const follows = [
      { follower_id: 'u2', following_id: 'u1' },
      { follower_id: 'x', following_id: 'u1' },
      { follower_id: 'u1', following_id: 'u2' },
    ];
    const first = users[0];
    expect(first).toBeDefined();
    if (!first) return;
    const photographer = mapDbUser(first, follows, [photoRow]);
    expect(photographer.username).toBe('kanthorn');
    expect(photographer.name).toBe('Kanthorn S.');
    expect(photographer.followers).toBe(2);
    expect(photographer.photos).toBe(1);
    expect(photographer.isAmbassador).toBe(true);
    expect(photographer.isCustomer).toBe(false);
  });
});
