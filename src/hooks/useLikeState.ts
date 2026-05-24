import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getLikeState, toggleLike as toggleLikeFn, type LikeState, type ToggleResult } from '@/lib/data/likes';

export interface UseLikeState extends LikeState {
  loading: boolean;
  toggle: () => Promise<ToggleResult>;
}

export function useLikeState(photoId: string): UseLikeState {
  const { authUser } = useApp();
  const [state, setState] = useState<LikeState>({ liked: false, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLikeState(photoId, authUser ?? null).then((s) => {
      if (!cancelled) {
        setState(s);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId, authUser?.id]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`photo-${photoId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `id=eq.${photoId}` },
        (payload) => {
          const next = payload.new as { likes_count?: number };
          if (typeof next.likes_count === 'number') {
            setState((s) => ({ ...s, count: Math.max(0, next.likes_count!) }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId]);

  const toggle = useCallback(async (): Promise<ToggleResult> => {
    const prev = state;
    setState((s) => ({
      liked: !s.liked,
      count: Math.max(0, s.count + (s.liked ? -1 : 1)),
    }));
    const result = await toggleLikeFn(photoId, authUser ?? null);
    if (result.kind === 'ok') {
      // Sync liked to authoritative server state; count keeps tracking realtime.
      setState((s) => ({ ...s, liked: result.liked }));
    } else {
      setState(prev);
    }
    return result;
  }, [photoId, authUser, state]);

  return { ...state, loading, toggle };
}
