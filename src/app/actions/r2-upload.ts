'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function getPresignedUploadUrl(fileName: string, contentType: string) {
  try {
    // Only a signed-in user may presign, and only under their own key prefix.
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    if (contentType !== 'image/webp') {
      return { success: false, error: 'Only image/webp uploads are allowed' };
    }

    // Ignore any client-supplied path; force the object under <userId>/.
    const safeName = (fileName.split('/').pop() || fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${user.id}/${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

    return { success: true, url, publicUrl };
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return { success: false, error: error.message };
  }
}
