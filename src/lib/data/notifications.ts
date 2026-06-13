import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type NotificationType =
  | 'like_received'
  | 'favorite_received'
  | 'comment_received'
  | 'comment_reply'
  | 'follow_received'
  | 'editor_pick'
  | 'ambassador_pick'
  | 'season_winner'
  | 'cashback_eligible'
  | 'photographer_approved'
  | 'photographer_rejected'
  | 'customer_marked'
  | 'ambassador_invited'
  | 'photo_reported'
  | 'photo_hidden'
  | 'photo_warned'
  | 'drop_released';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  related_photo_id: string | null;
  related_user_id: string | null;
  related_url: string | null;
  users?: { avatar_url: string | null } | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

const FALLBACK: Partial<Record<NotificationType, string>> = {
  like_received: 'Someone liked your photo',
  favorite_received: 'Someone favorited your photo',
  comment_received: 'Someone commented on your photo',
  comment_reply: 'Someone replied to your comment',
  follow_received: 'Someone started following you',
  drop_released: 'A photographer you follow released a new drop',
};

export function formatNotificationBody(n: NotificationRow): string {
  if (n.body && n.body.trim().length > 0) return n.body;
  return FALLBACK[n.type] ?? '';
}

export async function listNotifications(userId: string, opts?: { limit?: number; unreadOnly?: boolean }): Promise<NotificationRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  let q = supabase
    .from('notifications')
    .select('*, users!related_user_id(avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 10);
  if (opts?.unreadOnly) q = q.eq('is_read', false);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as NotificationRow[];
}

export async function markRead(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}
