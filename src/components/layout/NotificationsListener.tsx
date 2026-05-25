'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatNotificationBody, type NotificationRow } from '@/lib/data/notifications';

export function NotificationsListener() {
  const router = useRouter();
  const { authUser } = useApp();
  const userId: string | undefined = authUser?.id;

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`notifications-toast-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow;

          const showToast = (avatarUrl?: string | null) => {
            toast(
              <div className="flex items-center gap-3">
                {avatarUrl && (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-800" />
                )}
                <span>{formatNotificationBody(row)}</span>
              </div>,
              {
                action: row.related_url
                  ? { label: 'View', onClick: () => router.push(row.related_url!) }
                  : undefined,
              }
            );
          };

          if (row.related_user_id) {
            supabase
              .from('users')
              .select('avatar_url')
              .eq('id', row.related_user_id)
              .single()
              .then(({ data }) => {
                showToast(data?.avatar_url);
              }, () => showToast());
          } else {
            showToast();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
