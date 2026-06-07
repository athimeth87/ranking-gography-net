import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { rankPhotographers, photographerBadge, type PhotographerInput } from './src/lib/pulse-engine-v4.ts';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  console.log('Fetching users and photos...');
  const { data: users } = await supabase.from('users').select('id, username, display_name, created_at');
  const { data: photos } = await supabase.from('photos').select('photographer_id, pulse').eq('is_hidden', false).eq('status', 'published');

  if (!users || !photos) {
    console.log('Error fetching data');
    return;
  }

  // Group photo scores by photographer
  const scoresByUser: Record<string, number[]> = {};
  for (const p of photos) {
    if (!scoresByUser[p.photographer_id]) scoresByUser[p.photographer_id] = [];
    if (p.pulse != null) scoresByUser[p.photographer_id].push(Number(p.pulse));
  }

  const now = Date.now();
  const input: PhotographerInput[] = users.map(u => {
    const ageDays = (now - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return {
      id: u.id,
      username: u.username || u.display_name,
      photoScores: scoresByUser[u.id] || [],
      accountAgeDays: ageDays,
    };
  });

  console.log(`\nEvaluating ${input.length} photographers using V5 Hall of Fame Logic...\n`);
  const results = rankPhotographers(input);
  
  // Sort by hofScore desc
  results.sort((a, b) => (b.hofScore || 0) - (a.hofScore || 0));

  let md = "| Rank | Photographer | Photos | Avg Score | HOF Score | Badge |\n";
  md += "|---|---|---|---|---|---|\n";
  
  let i = 1;
  for (const r of results) {
    if (r.photoCount === 0) continue; // Skip empty users for clean output
    const badge = photographerBadge({ hofScore: r.hofScore, accountAgeDays: r.item.accountAgeDays });
    const qual = r.qualified ? '✅' : '❌';
    md += `| ${i++} | @${r.item.username} | ${r.photoCount} ${qual} | ${r.avgScore.toFixed(1)} | **${r.hofScore ? r.hofScore.toFixed(1) : '-'}** | ${badge || '-'} |\n`;
  }
  
  console.log(md);
}

run();
