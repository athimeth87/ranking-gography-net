import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zotxmuifufctgikdyyuz.supabase.co',
  'sb_publishable_wEdoRyZ3JOSa189xQF1ylA_o8FjUIvb'
);

async function run() {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'athimeth87')
    .single();

  console.log(user);
}

run();
