import { useCallback, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { listComments, type CommentRow } from '@/lib/data/comments-db';

export interface UseComments {
  comments: CommentRow[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useComments(photoId: string): UseComments {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await listComments(photoId);
    setComments(rows);
  }, [photoId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listComments(photoId).then((rows) => {
      if (!cancelled) {
        setComments(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [photoId]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`comments-${photoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `photo_id=eq.${photoId}` },
        () => { refresh(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `photo_id=eq.${photoId}` },
        (payload) => {
          const updated = payload.new as CommentRow;
          setComments((curr) => curr.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `photo_id=eq.${photoId}` },
        (payload) => {
          const old = payload.old as { id: string };
          setComments((curr) => curr.filter((c) => c.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, refresh]);

  return { comments, loading, refresh };
}
