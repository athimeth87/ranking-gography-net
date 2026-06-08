import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { assignScores, assignBadge } from './src/lib/pulse-engine-v4.ts';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function runV4Manual() {
  console.log('🚀 Fetching photos to calculate Pulse V4...');
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, engagement, impressions_count, uploaded_at')
    .eq('is_hidden', false)
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching photos:', error);
    return;
  }

  const now = Date.now();
  
  // Prepare the active pool
  const activePool = photos.map((p) => ({
    id: p.id,
    engagement: Number(p.engagement || 0),
    views: Number(p.impressions_count || 0),
    created_at: p.uploaded_at,
  }));

  console.log(`📊 Processing ${activePool.length} photos using V4 Engine...`);
  
  // Calculate scores using Pulse V4 Viral Compression logic
  const ranked = assignScores(activePool);

  const updates = ranked.map((r) => {
    // Treat all test photos as active for the sake of the badge logic in this manual run
    const active = true; 
    const badge = assignBadge({ score: r.score, views: r.item.views, active });
    
    return {
      id: r.item.id,
      pulse: r.score,
      score: r.score,
      percentile: r.percentile,
      badge: badge ?? '',
    };
  });

  const jsonUpdates = JSON.stringify(updates);
  const applyPulseSql = `-- Apply the fully calculated Pulse V4 Scores\nSELECT public.apply_photo_pulse_v4('${jsonUpdates}'::jsonb);\n`;
  
  fs.writeFileSync('supabase/apply_v4_test.sql', applyPulseSql);
  
  console.log(`✅ Success! Generated supabase/apply_v4_test.sql`);
  console.log(`🎉 Open that file and run it in Supabase SQL Editor to apply V4 scores!`);
}

runV4Manual();
