import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { deletePhotoFile } from '@/app/actions/r2-delete';
import type { User } from '@supabase/supabase-js';

export type DeleteResult =
  | { kind: 'ok' }
  | { kind: 'unauth' }
  | { kind: 'error'; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deletePhoto(
  photoId: string,
  storageUrl: string | null,
  authUser: User | null,
): Promise<DeleteResult> {
  if (!authUser) return { kind: 'unauth' };
  if (!UUID_RE.test(photoId)) return { kind: 'error', message: 'Cannot delete a mock photo' };

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { kind: 'error', message: 'Supabase not configured' };

  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)
    .eq('photographer_id', authUser.id);
  if (error) return { kind: 'error', message: error.message };

  if (storageUrl) {
    await deletePhotoFile(storageUrl);
  }
  return { kind: 'ok' };
}
