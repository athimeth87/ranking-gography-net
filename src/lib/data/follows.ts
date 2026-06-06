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

export interface FollowUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  isCustomer: boolean;
  isAmbassador: boolean;
}

function mapFollowUser(u: any): FollowUser | null {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    name: u.display_name || u.username,
    avatar: u.avatar_url ?? null,
    isCustomer: !!u.is_customer,
    isAmbassador: !!u.is_ambassador,
  };
}

const FOLLOW_USER_COLS = 'id, username, display_name, avatar_url, is_customer, is_ambassador';

export async function getFollowers(targetUserId: string): Promise<FollowUser[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('follows')
    .select(`follower:users!follows_follower_id_fkey ( ${FOLLOW_USER_COLS} )`)
    .eq('following_id', targetUserId)
    .order('followed_at', { ascending: false });
  return (data ?? []).map((r: any) => mapFollowUser(r.follower)).filter(Boolean) as FollowUser[];
}

export async function getFollowing(targetUserId: string): Promise<FollowUser[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('follows')
    .select(`following:users!follows_following_id_fkey ( ${FOLLOW_USER_COLS} )`)
    .eq('follower_id', targetUserId)
    .order('followed_at', { ascending: false });
  return (data ?? []).map((r: any) => mapFollowUser(r.following)).filter(Boolean) as FollowUser[];
}

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
