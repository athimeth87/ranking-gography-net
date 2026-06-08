import { createClient } from '@supabase/supabase-js';
import { rankPhotographers, photographerBadge, PULSE_V5_HOF } from '../src/lib/pulse-engine-v4';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching real data from Supabase...');
  const { data: usersData } = await supabase.from('users').select('id, username, display_name, created_at');
  const { data: photosData } = await supabase.from('photos').select('id, photographer_id, pulse, engagement, score_v2');

  const users = usersData || [];
  const photos = photosData || [];

  console.log(`Found ${users.length} users and ${photos.length} photos.`);
  console.log('--------------------------------------------------');
  console.log('SIMULATING V5 SEASON: RETROACTIVE REAL DATA TEST');
  console.log('Assumption: We pad everyone\'s photos to 22 by cloning their average quality.');
  console.log('--------------------------------------------------\n');

  const inputList = users.map(u => {
    const userPhotos = photos.filter(p => p.photographer_id === u.id);
    const scores = userPhotos.map(p => p.pulse || p.score_v2 || p.engagement || 0);
    
    // Simulate: If they have at least 1 photo but less than 22, we pad their scores to 22.
    // If they have 0 photos, we skip them (can't simulate style).
    let simulatedScores = [...scores];
    if (scores.length > 0 && scores.length < 22) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      while (simulatedScores.length < 22) {
        // add slight randomness +/- 2 to their average
        simulatedScores.push(avg + (Math.random() * 4 - 2));
      }
    }

    const ageDays = Math.floor((Date.now() - new Date(u.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: u.id,
      username: u.username || u.display_name,
      realPhotoCount: scores.length,
      photoScores: simulatedScores,
      accountAgeDays: ageDays
    };
  });

  // Filter out people with 0 photos
  const activeUsers = inputList.filter(u => u.realPhotoCount > 0);

  const results = rankPhotographers(activeUsers);
  results.sort((a, b) => (b.hofScore || 0) - (a.hofScore || 0));

  let rank = 1;
  for (const r of results) {
    if (r.hofScore == null) continue; // Skip unqualified (shouldn't happen due to padding)
    
    const badge = photographerBadge({ hofScore: r.hofScore, accountAgeDays: r.item.accountAgeDays });
    
    console.log(`Rank ${rank++}: @${r.item.username}`);
    console.log(`  Real Photos: ${r.item.realPhotoCount} (Simulated up to ${r.photoCount})`);
    console.log(`  Average Score: ${r.avgScore.toFixed(2)}`);
    console.log(`  V5 HOF Score:  ${r.hofScore.toFixed(2)}  [Badge: ${badge || 'None'}]`);
    console.log('---------------------------------');
  }
}

run().catch(console.error);
