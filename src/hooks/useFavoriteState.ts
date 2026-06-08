import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getFavoriteState, toggleFavorite as toggleFavoriteFn, type FavoriteState, type ToggleResult } from '@/lib/data/favorites';

export interface UseFavoriteState extends FavoriteState {
  loading: boolean;
  toggle: () => Promise<ToggleResult>;
}

export function useFavoriteState(photoId: string, opts?: { realtime?: boolean }): UseFavoriteState {
  const realtime = opts?.realtime ?? true;
  const { authUser } = useApp();
  const [state, setState] = useState<FavoriteState>({ favorited: false, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFavoriteState(photoId, authUser ?? null).then((s) => {
      if (!cancelled) {
        setState(s);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId, authUser?.id]);

  useEffect(() => {
    if (!realtime) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channelName = `photo-fav-${photoId}-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `id=eq.${photoId}` },
        (payload) => {
          const next = payload.new as { favorites_count?: number };
          if (typeof next.favorites_count === 'number') {
            setState((s) => ({ ...s, count: Math.max(0, next.favorites_count!) }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId, realtime]);

  const toggle = useCallback(async (): Promise<ToggleResult> => {
    const prev = state;
    setState((s) => ({
      favorited: !s.favorited,
      count: Math.max(0, s.count + (s.favorited ? -1 : 1)),
    }));
    const result = await toggleFavoriteFn(photoId, authUser ?? null);
    if (result.kind === 'ok') {
      setState((s) => ({ ...s, favorited: result.favorited }));
    } else {
      setState(prev);
    }
    return result;
  }, [photoId, authUser, state]);

  return { ...state, loading, toggle };
}
