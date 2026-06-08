import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName || !r2PublicUrl) {
  console.error('Missing R2 environment variables in .env.local');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

const localDir = path.join(process.cwd(), 'public/testpic');
const r2Folder = 'testpic';

async function main() {
  console.log(`Scanning local files in: ${localDir}`);
  if (!fs.existsSync(localDir)) {
    console.error(`Local directory not found: ${localDir}`);
    return;
  }

  const files = fs.readdirSync(localDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp';
  });

  console.log(`Found ${files.length} files to upload.`);

  const sqlStatements: string[] = [];
  sqlStatements.push('-- SQL to update simulated photo URLs to Cloudflare R2');
  sqlStatements.push('BEGIN;');

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const filePath = path.join(localDir, file);
    const r2Key = `${r2Folder}/${file}`;
    const publicUrl = `${r2PublicUrl}/${r2Key}`;
    const localDbPath = `/testpic/${file}`;

    console.log(`[${i + 1}/${files.length}] Uploading ${file} to R2...`);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      let contentType = 'image/png';
      if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (file.endsWith('.webp')) {
        contentType = 'image/webp';
      }

      await s3Client.send(
        new PutObjectCommand({
          Bucket: r2BucketName,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      console.log(`      Uploaded successfully!`);
      console.log(`      Public URL: ${publicUrl}`);

      sqlStatements.push(
        `UPDATE public.photos SET storage_url = '${publicUrl}' WHERE storage_url = '${localDbPath}';`
      );
    } catch (err) {
      console.error(`      Failed to upload ${file}:`, err);
    }
  }

  sqlStatements.push('COMMIT;');

  const sqlContent = sqlStatements.join('\n');
  const sqlOutputPath = path.join(process.cwd(), 'supabase/update_simulation_urls_to_r2.sql');
  fs.writeFileSync(sqlOutputPath, sqlContent);

  console.log(`\nSuccessfully uploaded files to R2!`);
  console.log(`Generated SQL update script at: ${sqlOutputPath}`);
  console.log(`You can run this SQL script in your Supabase SQL Editor to update all simulated photos.`);
}

main().catch(console.error);
