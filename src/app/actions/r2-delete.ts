'use server';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    );
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting R2 object:', error);
    return { success: false, error: error.message };
  }
}
