import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { assignScores, assignBadge } from './src/lib/pulse-engine-v4.ts';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { data: photos } = await supabase
    .from('photos')
    .select('id, likes_count, favorites_count, comments_count, impressions_count, uploaded_at, engagement')
    .eq('is_hidden', false)
    .eq('status', 'published');

  const now = Date.now();
  const activePool = photos!.map((p) => ({
    ...p,
    engagement: Number(p.engagement || 0),
    views: Number(p.impressions_count || 0),
    created_at: p.uploaded_at,
  }));

  const ranked = assignScores(activePool).sort((a, b) => b.engagement - a.engagement);

  let md = "| Rank | ID (Short) | Likes | Favs | Com | Views | Engagement | Pulse | Badge |\n";
  md += "|---|---|---|---|---|---|---|---|---|\n";
  
  ranked.forEach(r => {
    const active = true;
    const badge = assignBadge({ score: r.score, views: r.item.views, active });
    md += `| ${ranked.length - r.rank + 1} | \`${r.item.id.substring(0,6)}\` | ${r.item.likes_count} | ${r.item.favorites_count} | ${r.item.comments_count} | ${r.item.views} | **${Math.round(r.engagement)}** | **${r.score.toFixed(1)}** | ${badge || '-'} |\n`;
  });
  
  console.log(md);
}

run();
