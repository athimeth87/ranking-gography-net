import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface FavoriteState {
  favorited: boolean;
  count: number;
}

export type ToggleResult =
  | { kind: 'ok'; favorited: boolean }
  | { kind: 'unauth' }
  | { kind: 'error'; message: string };

export async function getFavoriteState(photoId: string, authUser: User | null): Promise<FavoriteState> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { favorited: false, count: 0 };

  const { data: photo } = await supabase
    .from('photos')
    .select('favorites_count')
    .eq('id', photoId)
    .single();
  const count = photo?.favorites_count ?? 0;

  if (!authUser) return { favorited: false, count };

  const { data: fav } = await supabase
    .from('favorites')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', authUser.id)
    .maybeSingle();

  return { favorited: Boolean(fav), count };
}

export async function toggleFavorite(photoId: string, authUser: User | null): Promise<ToggleResult> {
  if (!authUser) return { kind: 'unauth' };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
    if (error) return { kind: 'error', message: error.message };
    return { kind: 'ok', favorited: false };
  }

  const { error } = await supabase.from('favorites').insert({
    photo_id: photoId,
    user_id: authUser.id,
  });
  if (error) return { kind: 'error', message: error.message };
  return { kind: 'ok', favorited: true };
}
