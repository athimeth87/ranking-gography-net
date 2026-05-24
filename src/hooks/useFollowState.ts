import { useCallback, useEffect, useId, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getFollowState, toggleFollow as toggleFollowFn, type FollowState, type FollowToggleResult } from '@/lib/data/follows';

export interface UseFollowState extends FollowState {
  loading: boolean;
  isSelf: boolean;
  toggle: () => Promise<FollowToggleResult>;
}

export function useFollowState(targetUserId: string | null | undefined): UseFollowState {
  const { authUser } = useApp();
  const instanceId = useId();
  const [state, setState] = useState<FollowState>({ following: false, followersCount: 0 });
  const [loading, setLoading] = useState(true);
  const isSelf = Boolean(targetUserId && authUser?.id === targetUserId);

  useEffect(() => {
    if (!targetUserId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getFollowState(targetUserId, authUser ?? null).then((s) => {
      if (!cancelled) {
        setState(s);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, authUser?.id]);

  useEffect(() => {
    if (!targetUserId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`user-${targetUserId}-${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${targetUserId}` },
        (payload) => {
          const next = payload.new as { followers_count?: number };
          if (typeof next.followers_count === 'number') {
            setState((s) => ({ ...s, followersCount: Math.max(0, next.followers_count!) }));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [targetUserId, instanceId]);

  const toggle = useCallback(async (): Promise<FollowToggleResult> => {
    if (!targetUserId) return { kind: 'error', message: 'No target' };
    const prev = state;
    setState((s) => ({
      following: !s.following,
      followersCount: Math.max(0, s.followersCount + (s.following ? -1 : 1)),
    }));
    const result = await toggleFollowFn(targetUserId, authUser ?? null);
    if (result.kind === 'ok') {
      setState((s) => ({ ...s, following: result.following }));
    } else {
      setState(prev);
    }
    return result;
  }, [targetUserId, authUser, state]);

  return { ...state, loading, isSelf, toggle };
}
