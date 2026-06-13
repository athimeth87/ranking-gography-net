'use server';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function deletePhotoFile(publicUrl: string) {
  try {
    const prefix = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/`;
    if (!publicUrl.startsWith(prefix)) {
      return { success: false, error: 'Not an R2-hosted file' };
    }
    const key = publicUrl.slice(prefix.length);
    if (!key) return { success: false, error: 'Empty object key' };

    // Authorize: only the owner may delete. Accept either an own-prefixed key
    // (<userId>/…) or a photo row that points at this file and belongs to them.
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    let authorized = key.startsWith(`${user.id}/`);
    if (!authorized) {
      const { data: photo } = await supabase
        .from('photos')
        .select('photographer_id')
        .eq('storage_url', publicUrl)
        .maybeSingle();
      authorized = !!photo && photo.photographer_id === user.id;
    }
    if (!authorized) return { success: false, error: 'Not authorized to delete this file' };

    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    );
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting R2 object:', error);
    return { success: false, error: error.message };
  }
}
