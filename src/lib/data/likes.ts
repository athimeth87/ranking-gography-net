import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface LikeState {
  liked: boolean;
  count: number;
}

export type ToggleResult =
  | { kind: 'ok'; liked: boolean }
  | { kind: 'unauth' }
  | { kind: 'error'; message: string };

export async function getLikeState(photoId: string, authUser: User | null): Promise<LikeState> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId);
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isUUID) return { liked: false, count: 0 };

  const { data: photo } = await supabase
    .from('photos')
    .select('likes_count')
    .eq('id', photoId)
    .single();
  const count = photo?.likes_count ?? 0;

  if (!authUser) return { liked: false, count };

  const { data: vote } = await supabase
    .from('votes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', authUser.id)
    .maybeSingle();

  return { liked: Boolean(vote), count };
}

export async function toggleLike(photoId: string, authUser: User | null): Promise<ToggleResult> {
  if (!authUser) return { kind: 'unauth' };
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId);
  if (!isUUID) return { kind: 'error', message: 'Cannot like a mock photo' };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('votes').delete().eq('id', existing.id);
    if (error) return { kind: 'error', message: error.message };
    return { kind: 'ok', liked: false };
  }

  const email = authUser.email ?? '';
  const { error } = await supabase.from('votes').insert({
    photo_id: photoId,
    user_id: authUser.id,
    user_email: email,
  });
  if (error) return { kind: 'error', message: error.message };
  return { kind: 'ok', liked: true };
}
