import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface FollowState {
  following: boolean;
  followersCount: number;
}

export type FollowToggleResult =
  | { kind: 'ok'; following: boolean }
  | { kind: 'unauth' }
  | { kind: 'error'; message: string };

export async function getFollowState(targetUserId: string, authUser: User | null): Promise<FollowState> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { following: false, followersCount: 0 };

  const { data: target } = await supabase
    .from('users')
    .select('followers_count')
    .eq('id', targetUserId)
    .maybeSingle();
  const followersCount = target?.followers_count ?? 0;

  if (!authUser || authUser.id === targetUserId) {
    return { following: false, followersCount };
  }

  const { data: row } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', authUser.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  return { following: Boolean(row), followersCount };
}

export async function toggleFollow(targetUserId: string, authUser: User | null): Promise<FollowToggleResult> {
  if (!authUser) return { kind: 'unauth' };
  if (authUser.id === targetUserId) return { kind: 'error', message: 'Cannot follow yourself' };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', authUser.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', authUser.id)
      .eq('following_id', targetUserId);
    if (error) return { kind: 'error', message: error.message };
    return { kind: 'ok', following: false };
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: authUser.id,
    following_id: targetUserId,
  });
  if (error) return { kind: 'error', message: error.message };
  return { kind: 'ok', following: true };
}
