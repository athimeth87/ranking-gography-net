const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Fetching users...');
  const { data: users, error: userError } = await supabase.from('users').select('*');
  if (userError) {
    console.error('User fetch failed:', userError);
  } else {
    console.log('Users found:', users?.length);
  }

  console.log('Fetching photos...');
  const { data: photos, error: photoError } = await supabase.from('photos').select('*');
  if (photoError) {
    console.error('Photo fetch failed:', photoError);
  } else {
    console.log('Photos found:', photos?.length);
  }
}

testConnection();
