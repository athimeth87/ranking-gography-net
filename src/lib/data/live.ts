import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Photo, Photographer } from '@/lib/types';

// Single source of truth: every page maps photo/user rows through these
// helpers so the same photo can never show two different numbers.

type DbUser = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  location?: string | null;
  bio?: string | null;
  social_twitter?: string | null;
  social_instagram?: string | null;
  social_facebook?: string | null;
  portfolio_url?: string | null;
  is_ambassador?: boolean | null;
  is_customer?: boolean | null;
  created_at?: string | null;
};

type DbPhoto = {
  id: string;
  slug?: string | null;
  title: string;
  photographer_id: string;
  category: string;
  width?: number | null;
  height?: number | null;
  storage_url: string;
  description?: string | null;
  camera?: string | null;
  lens?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  favorites_count?: number | null;
  uploaded_at: string;
  voyageur_only?: boolean | null;
  pulse?: number | string | null;
  peak_pulse?: number | string | null;
  pick_type?: 'none' | 'editor' | 'ambassador' | 'both' | null;
  percentile?: number | string | null;
  badge?: string | null;
  visibility?: 'public' | 'portfolio' | 'private' | null;
};

type DbFollow = { follower_id: string; following_id: string };

export function userName(u: DbUser | undefined): string {
  return u?.username || u?.display_name || 'unknown';
}

export function mapDbPhoto(p: DbPhoto, users: DbUser[]): Photo {
  const owner = users.find((u) => u.id === p.photographer_id);
  const rawCat = p.category as string;
  const cat = (rawCat === 'bw' ? 'BW' : rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category;
  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title,
    by: userName(owner),
    avatarUrl: owner?.avatar_url ?? undefined,
    cat,
    w: p.width || 4,
    h: p.height || 3,
    src: p.storage_url,
    caption: p.description || '',
    exif: { camera: p.camera || 'Unknown', lens: p.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
    likes: p.likes_count || 0,
    likes24h: 0,
    comments: p.comments_count || 0,
    favorites: p.favorites_count || 0,
    hours: 24,
    picks: [],
    date: p.uploaded_at,
    voyageurOnly: p.voyageur_only ?? undefined,
    pulse: p.pulse != null ? Number(p.pulse) : 0,
    peakPulse: p.peak_pulse != null ? Number(p.peak_pulse) : null,
    pickType: p.pick_type ?? 'none',
    percentile: p.percentile != null ? Number(p.percentile) : null,
    badge: p.badge || null,
    visibility: p.visibility ?? 'public',
    rank: 0,
  };
}

export function mapDbUser(u: DbUser, follows: DbFollow[], photos: DbPhoto[]): Photographer {
  return {
    id: u.id,
    username: u.username || u.display_name || u.id,
    name: u.display_name || u.username || 'User',
    loc: u.location || '',
    bio: u.bio || '',
    avatar: u.avatar_url || '',
    cover: u.cover_url || u.avatar_url || '',
    followers: follows.filter((f) => f.following_id === u.id).length,
    photos: photos.filter((p) => p.photographer_id === u.id).length,
    socialTwitter: u.social_twitter || '',
    socialInstagram: u.social_instagram || '',
    socialFacebook: u.social_facebook || '',
    website: u.portfolio_url || '',
    isAmbassador: u.is_ambassador || false,
    isCustomer: u.is_customer || false,
    customerTrips: [],
    joined: u.created_at || '',
    cameras: [],
  };
}

export interface LivePhotoData {
  photos: Photo[];
  photographers: Photographer[];
  voyageurUsernames: Set<string>;
  error: string | null;
}

/** Canonical fetch: photos + users + follows, pulse-ranked. */
export async function fetchLivePhotoData(supabase: SupabaseClient): Promise<LivePhotoData> {
  const [{ data: usersData }, { data: photosData, error }, { data: followsData }] = await Promise.all([
    supabase.from('users').select('*'),
    // Competition-only, even though RLS also lets owners read their own
    // drafts/portfolio/private rows — feeds and leaderboards must never show them.
    supabase
      .from('photos')
      .select('*')
      .eq('status', 'published')
      .eq('is_hidden', false)
      .eq('visibility', 'public')
      .order('uploaded_at', { ascending: false }),
    supabase.from('follows').select('*'),
  ]);
  const users = (usersData || []) as DbUser[];
  const dbPhotos = (photosData || []) as DbPhoto[];
  const follows = (followsData || []) as DbFollow[];

  const photos = dbPhotos.map((p) => mapDbPhoto(p, users));
  photos.sort((a, b) => b.pulse - a.pulse);
  photos.forEach((p, i) => { p.rank = i + 1; });

  const photographers = users.map((u) => mapDbUser(u, follows, dbPhotos));
  const voyageurUsernames = new Set(users.filter((u) => u.is_customer).map((u) => userName(u)));

  return { photos, photographers, voyageurUsernames, error: error?.message ?? null };
}
