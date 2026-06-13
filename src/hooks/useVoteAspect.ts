'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import {
  getVoteState, setVoteAspects, isVoted, EMPTY_SELECTION,
  type VoteAspectState, type AspectKey, type AspectSelection, type VoteResult,
} from '@/lib/data/likes';

const EMPTY: VoteAspectState = { selection: { ...EMPTY_SELECTION }, hasVoted: false, count: 0, tally: null };

export interface UseVoteAspect extends VoteAspectState {
  loading: boolean;
  isOwner: boolean;
  /** The power bar may be shown only to the owner or after the viewer has voted. */
  revealBar: boolean;
  toggleAspect: (key: AspectKey) => Promise<VoteResult>;
}

export function useVoteAspect(photoId: string, opts?: { ownerId?: string | null }): UseVoteAspect {
  const { authUser } = useApp();
  const isOwner = !!(authUser && opts?.ownerId && authUser.id === opts.ownerId);
  const [state, setState] = useState<VoteAspectState>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVoteState(photoId, authUser ?? null).then((s) => {
      if (!cancelled) { setState(s); setLoading(false); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId, authUser?.id]);

  const toggleAspect = useCallback(async (key: AspectKey): Promise<VoteResult> => {
    const prev = state;
    const nextSel: AspectSelection = { ...state.selection, [key]: !state.selection[key] };
    const wasVoted = isVoted(state.selection);
    const nowVoted = isVoted(nextSel);
    // optimistic: flip the chip + adjust the vote count
    setState((s) => ({
      ...s,
      selection: nextSel,
      hasVoted: nowVoted,
      count: nowVoted && !wasVoted ? s.count + 1
        : (!nowVoted && wasVoted ? Math.max(0, s.count - 1) : s.count),
    }));
    const result = await setVoteAspects(photoId, nextSel, authUser ?? null);
    if (result.kind === 'ok') {
      // re-read authoritative tally (server-gated) + count
      const fresh = await getVoteState(photoId, authUser ?? null);
      setState(fresh);
    } else {
      if (result.kind === 'error') alert(`Could not vote: ${result.message}`);
      setState(prev);
    }
    return result;
  }, [photoId, authUser, state]);

  return { ...state, loading, isOwner, revealBar: isOwner || state.hasVoted, toggleAspect };
}
