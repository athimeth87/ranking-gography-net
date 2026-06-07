import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Anon key
const supabase = createClient(supabaseUrl, supabaseKey);

const imageDir = '/Volumes/Back up data Devjuu/ranking-gography-net/posttest';

async function run() {
  console.log('Fetching bots...');
  // Fetch 10 bots
  const { data: bots, error: botErr } = await supabase
    .from('users')
    .select('id, username, email')
    .ilike('email', 'bot%')
    .limit(10);

  if (botErr || !bots || bots.length === 0) {
    console.error('Failed to fetch bots. Error:', botErr);
    return;
  }

  console.log(`Found ${bots.length} users to post images.`);

  const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  if (files.length === 0) {
    console.error('No images found in posttest directory.');
    return;
  }

  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    const fileName = files[i % files.length];
    const filePath = path.join(imageDir, fileName);
    
    console.log(`[Bot: ${bot.username}] Signing in...`);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: bot.email,
      password: 'password123'
    });
    
    if (authErr) {
      console.error(`Auth error for ${bot.username}:`, authErr);
      continue;
    }
    
    console.log(`[Bot: ${bot.username}] Uploading ${fileName}...`);
    const fileBuffer = fs.readFileSync(filePath);
    
    const ext = path.extname(fileName);
    const storagePath = `${bot.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('photos')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png'
      });
      
    if (uploadErr) {
      console.error(`Upload error for ${bot.username}:`, uploadErr);
      await supabase.auth.signOut();
      continue;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(storagePath);
    
    // Insert into photos table
    const photoTitle = `Test Photo by ${bot.username}`;
    const slug = photoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    
    const { error: dbErr } = await supabase.from('photos').insert({
      photographer_id: bot.id,
      title: photoTitle,
      slug: slug,
      description: 'Auto-uploaded test photo',
      category: 'landscape', // Just hardcoding a valid category
      storage_url: publicUrl,
      status: 'published',
      is_hidden: false,
      uploaded_at: new Date().toISOString()
    });
    
    if (dbErr) {
      console.error(`DB Insert error for ${bot.username}:`, dbErr);
    } else {
      console.log(`[Bot: ${bot.username}] Successfully posted! URL: ${publicUrl}`);
    }
    
    await supabase.auth.signOut();
  }
  
  console.log('Finished uploading bot photos!');
}

run().catch(console.error);
