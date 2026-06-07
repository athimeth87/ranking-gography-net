import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', '7f0cfa26-b54e-40c5-a8a9-08430c16bc01')
    .single();

  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
