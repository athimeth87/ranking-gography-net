import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface DropRow {
  id: string;
  photographer_id: string;
  title: string;
  series_label: string | null;
  description: string | null;
  preview_url: string | null;
  scheduled_at: string;
  status: 'scheduled' | 'released' | 'cancelled';
  released_at: string | null;
  created_at: string;
}

export async function getNextDrop(photographerId: string): Promise<DropRow | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('drops')
    .select('*')
    .eq('photographer_id', photographerId)
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as DropRow | null) ?? null;
}

export async function getDropStatus(dropId: string): Promise<DropRow['status'] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.from('drops').select('status').eq('id', dropId).maybeSingle();
  return (data?.status as DropRow['status'] | undefined) ?? null;
}

export async function isSubscribedToDrop(dropId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  const { count } = await supabase
    .from('drop_subscriptions')
    .select('drop_id', { count: 'exact', head: true })
    .eq('drop_id', dropId)
    .eq('user_id', userId);
  return (count ?? 0) > 0;
}

export async function subscribeToDrop(dropId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from('drop_subscriptions')
    .upsert({ drop_id: dropId, user_id: userId }, { onConflict: 'drop_id,user_id' });
  return !error;
}

export async function unsubscribeFromDrop(dropId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from('drop_subscriptions')
    .delete()
    .eq('drop_id', dropId)
    .eq('user_id', userId);
  return !error;
}

export interface CreateDropInput {
  photographerId: string;
  title: string;
  seriesLabel?: string;
  description?: string;
  scheduledAt: string;
  photoIds: string[];
  previewUrl?: string | null;
}

export async function createDrop(input: CreateDropInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: 'Supabase client unavailable' };

  const { data: drop, error } = await supabase
    .from('drops')
    .insert({
      photographer_id: input.photographerId,
      title: input.title,
      series_label: input.seriesLabel || null,
      description: input.description || null,
      preview_url: input.previewUrl || null,
      scheduled_at: input.scheduledAt,
    })
    .select('id')
    .single();

  if (error || !drop) return { ok: false, error: error?.message ?? 'insert failed' };

  const { error: photoError } = await supabase
    .from('photos')
    .update({ drop_id: drop.id, status: 'draft' })
    .in('id', input.photoIds)
    .eq('photographer_id', input.photographerId);

  if (photoError) {
    // Roll back the just-created drop so a failed photo update can't leave an empty drop.
    await supabase.from('drops').delete().eq('id', drop.id);
    return { ok: false, error: photoError.message };
  }
  return { ok: true };
}
