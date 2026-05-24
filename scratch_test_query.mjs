import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('photos').select('id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, caption, users(username)');
console.log(error, data?.length);
