import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { rankField } from './src/lib/pulse-engine-v2.ts';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching photos to simulate full ecosystem test...');
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, likes_count, favorites_count, comments_count, impressions_count, uploaded_at, pick_type')
    .eq('is_hidden', false)
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching photos:', error);
    return;
  }

  // 1. SIMULATE VIEWS: Give every photo realistic views so they pass the Badge gates
  let viewsSql = `-- 1. Inject realistic fake views (impressions) to pass badge gates\n`;
  const simulatedPhotos = photos.map((p) => {
    let simulatedViews = p.impressions_count || 0;
    
    // Give at least 150 views + 5 views per like
    if (simulatedViews < 100) {
      simulatedViews = (p.likes_count * 5) + 150 + Math.floor(Math.random() * 50);
      viewsSql += `UPDATE public.photos SET impressions_count = ${simulatedViews} WHERE id = '${p.id}';\n`;
    }
    
    return {
      id: p.id,
      likes_count: p.likes_count || 0,
      favorites_count: p.favorites_count || 0,
      comments_count: p.comments_count || 0,
      impressions_count: simulatedViews, // Use simulated views
      created_at: p.uploaded_at,
      pick_type: p.pick_type || 'none',
    };
  });

  // 2. RUN RANKING LOGIC (Bayesian + Decay)
  console.log(`Calculating V2 scores for ${simulatedPhotos.length} photos...`);
  const now = Date.now();
  const ranked = rankField(simulatedPhotos, now);

  const updates = ranked.map((r) => ({
    id: r.id,
    pulse: r.displayScore,
    score_v2: Math.round(r.rankingScore * 1e6) / 1e6,
    percentile: Math.round(r.percentile * 1e4) / 1e4,
    badge: r.badge ?? '',
  }));

  // 3. GENERATE SQL
  const jsonUpdates = JSON.stringify(updates);
  const applyPulseSql = `\n-- 2. Apply the fully calculated Pulse V2 Scores & Badges\nSELECT public.apply_photo_pulse_v2('${jsonUpdates}'::jsonb);\n`;
  
  const finalSql = viewsSql + applyPulseSql;
  fs.writeFileSync('supabase/apply_full_test.sql', finalSql);
  
  console.log('✅ Done! Open supabase/apply_full_test.sql and run it in Supabase SQL Editor.');
}

run();
