import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: photos } = await supabase.from('photos').select('id, title, width, height, likes_count, favorites_count');
  
  const mapped = photos.map(p => ({
    title: p.title,
    w: p.width,
    h: p.height,
    ratio: (p.width / p.height).toFixed(2),
    pulse: p.likes_count + p.favorites_count * 2
  })).sort((a,b) => b.pulse - a.pulse);
  
  console.log(mapped);
}
check();
