const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countPhotos() {
  const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .like('slug', 'sim-photo-%');
    
  console.log('Total sim photos:', count);
}

countPhotos();
