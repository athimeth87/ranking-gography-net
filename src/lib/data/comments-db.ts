import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface CommentRow {
  id: string;
  photo_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export type MutateResult =
  | { kind: 'ok' }
  | { kind: 'unauth' }
  | { kind: 'error'; message: string };

export async function listComments(photoId: string): Promise<CommentRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:users(id, username, display_name, avatar_url)')
    .eq('photo_id', photoId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as CommentRow[];
}

export async function createComment(args: {
  photoId: string;
  body: string;
  parentId?: string;
  authUser: User | null;
}): Promise<MutateResult> {
  if (!args.authUser) return { kind: 'unauth' };
  const body = args.body.trim();
  if (body.length === 0) return { kind: 'error', message: 'Empty comment' };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { error } = await supabase.from('comments').insert({
    photo_id: args.photoId,
    user_id: args.authUser.id,
    parent_id: args.parentId ?? null,
    body,
  });
  if (error) return { kind: 'error', message: error.message };
  return { kind: 'ok' };
}

export async function updateComment(id: string, body: string, authUser: User | null): Promise<MutateResult> {
  if (!authUser) return { kind: 'unauth' };
  const trimmed = body.trim();
  if (trimmed.length === 0) return { kind: 'error', message: 'Empty comment' };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { error } = await supabase
    .from('comments')
    .update({ body: trimmed })
    .eq('id', id)
    .eq('user_id', authUser.id);
  if (error) return { kind: 'error', message: error.message };
  return { kind: 'ok' };
}

export async function deleteComment(id: string, authUser: User | null): Promise<MutateResult> {
  if (!authUser) return { kind: 'unauth' };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', authUser.id);
  if (error) return { kind: 'error', message: error.message };
  return { kind: 'ok' };
}
