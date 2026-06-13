import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Vote Aspect (color / composition / light) ────────────────────────────────
// A vote must endorse at least one aspect. The power-bar tally is exposed only to
// the photo owner or a viewer who has already voted (gated by the DB RPC).
export type AspectKey = 'color' | 'composition' | 'light';

export interface AspectSelection {
  color: boolean;
  composition: boolean;
  light: boolean;
}

export interface AspectTally {
  color: number;
  composition: number;
  light: number;
  total: number;
}

export interface VoteAspectState {
  selection: AspectSelection;   // current user's endorsement (all false = not voted)
  hasVoted: boolean;
  count: number;                // total votes on the photo
  tally: AspectTally | null;    // null = not entitled to see it yet
}

export type VoteResult =
  | { kind: 'ok'; selection: AspectSelection }
  | { kind: 'unauth' }
  | { kind: 'error'; message: string };

export const EMPTY_SELECTION: AspectSelection = { color: false, composition: false, light: false };

export function isVoted(sel: AspectSelection): boolean {
  return sel.color || sel.composition || sel.light;
}

export async function getVoteState(photoId: string, authUser: User | null): Promise<VoteAspectState> {
  const base: VoteAspectState = { selection: { ...EMPTY_SELECTION }, hasVoted: false, count: 0, tally: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !UUID_RE.test(photoId)) return base;

  const { data: photo } = await supabase
    .from('photos').select('likes_count').eq('id', photoId).single();
  base.count = photo?.likes_count ?? 0;
  if (!authUser) return base;

  const { data: vote } = await supabase
    .from('votes')
    .select('aspect_color, aspect_composition, aspect_light')
    .eq('photo_id', photoId).eq('user_id', authUser.id).maybeSingle();
  const selection: AspectSelection = vote
    ? { color: !!vote.aspect_color, composition: !!vote.aspect_composition, light: !!vote.aspect_light }
    : { ...EMPTY_SELECTION };

  // Gated tally: the RPC returns rows only for the owner or someone who has voted.
  const { data: tallyRows } = await supabase.rpc('get_photo_aspect_tally', { p_id: photoId });
  const t = Array.isArray(tallyRows) ? tallyRows[0] : tallyRows;
  const tally: AspectTally | null = t
    ? {
        color: Number(t.color_votes ?? 0),
        composition: Number(t.composition_votes ?? 0),
        light: Number(t.light_votes ?? 0),
        total: Number(t.aspect_votes_total ?? 0),
      }
    : null;

  return { selection, hasVoted: isVoted(selection), count: base.count, tally };
}

// Persist the user's aspect selection. Selecting nothing un-votes (deletes the
// row) — there is no path that creates a vote with no aspect, so an aspect-less
// vote is impossible at the API layer.
export async function setVoteAspects(
  photoId: string,
  next: AspectSelection,
  authUser: User | null,
): Promise<VoteResult> {
  if (!authUser) return { kind: 'unauth' };
  if (!UUID_RE.test(photoId)) return { kind: 'error', message: 'Cannot vote on a mock photo' };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { data: existing } = await supabase
    .from('votes').select('id')
    .eq('photo_id', photoId).eq('user_id', authUser.id).maybeSingle();

  if (!isVoted(next)) {
    if (existing) {
      const { error } = await supabase.from('votes').delete().eq('id', existing.id);
      if (error) return { kind: 'error', message: error.message };
    }
    return { kind: 'ok', selection: { ...EMPTY_SELECTION } };
  }

  const row = {
    aspect_color: next.color,
    aspect_composition: next.composition,
    aspect_light: next.light,
    is_legacy: false,
  };
  if (existing) {
    const { error } = await supabase.from('votes').update(row).eq('id', existing.id);
    if (error) return { kind: 'error', message: error.message };
  } else {
    const { error } = await supabase.from('votes').insert({
      photo_id: photoId,
      user_id: authUser.id,
      user_email: authUser.email ?? '',
      ...row,
    });
    if (error) return { kind: 'error', message: error.message };
  }
  return { kind: 'ok', selection: next };
}
