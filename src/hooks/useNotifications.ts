import { useCallback, useEffect, useId, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  listNotifications,
  markAllRead as markAllReadFn,
  markRead as markReadFn,
  type NotificationRow,
} from '@/lib/data/notifications';

export interface UseNotifications {
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotifications {
  const { authUser } = useApp();
  const userId: string | undefined = authUser?.id;
  const instanceId = useId();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listNotifications(userId, { limit: 10 }).then((rows) => {
      if (!cancelled) {
        setNotifications(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`notifications-bell-${userId}-${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          setNotifications((curr) => [row, ...curr].slice(0, 10));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          setNotifications((curr) => curr.map((n) => (n.id === row.id ? row : n)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((curr) => curr.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await markReadFn(id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((curr) => curr.map((n) => ({ ...n, is_read: true })));
    await markAllReadFn(userId);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, loading, markRead, markAllRead };
}
