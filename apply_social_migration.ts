import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { error } = await supabase.rpc('exec_sql', { query: `
    alter table public.users
    add column if not exists social_twitter text,
    add column if not exists social_instagram text,
    add column if not exists social_facebook text;
  `});
  if (error) console.error(error);
  else console.log('success');
}
run();
