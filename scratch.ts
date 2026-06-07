import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data, error } = await supabase.from('photos').select('id, title, engagement, impressions_count, likes_count, comments_count, uploaded_at').eq('id', '957cf4d6-2923-4f3d-a4a6-2beabdd9be3a').single();
  console.log(JSON.stringify(data, null, 2));
}
run();
