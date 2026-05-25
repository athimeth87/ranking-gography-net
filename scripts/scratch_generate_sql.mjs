import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';
import sizeOf from 'image-size';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const getRealSize = (url) => {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        try {
          const dimensions = sizeOf(buffer);
          resolve(dimensions);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

async function fix() {
  const { data: photos } = await supabase.from('photos').select('id, storage_url, width, height');
  if (!photos) return console.log('No photos');
  
  for (const p of photos) {
    if (p.width === 4 && p.height === 3 && p.storage_url) {
      const dims = await getRealSize(p.storage_url);
      if (dims) {
        console.log(`UPDATE public.photos SET width = ${dims.width}, height = ${dims.height} WHERE id = '${p.id}';`);
      }
    }
  }
}
fix();
