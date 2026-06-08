import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRankMasterEmail, sendTop10Email } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const getWeekKey = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'unknown';
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0] as string;
};

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase service credentials not configured' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. Fetch all photos
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('id, by, date, pulse');
    
  if (photosError || !photos) {
    return NextResponse.json({ error: 'Failed to fetch photos', detail: photosError }, { status: 500 });
  }

  // 2. Fetch all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, email, display_name');

  if (usersError || !users) {
    return NextResponse.json({ error: 'Failed to fetch users', detail: usersError }, { status: 500 });
  }

  // 3. Group and compute rankings per week
  const photosByWeek: Record<string, typeof photos> = {};
  photos.forEach(p => {
    if (!p.date) return;
    const wk = getWeekKey(p.date);
    if (!photosByWeek[wk]) photosByWeek[wk] = [];
    photosByWeek[wk].push(p);
  });

  const weekRankings: Record<string, { username: string, totalScore: number }[]> = {};
  Object.entries(photosByWeek).forEach(([wk, weekPhotos]) => {
    const scoresByPhotographer: Record<string, number> = {};
    weekPhotos.forEach(p => {
      const score = p.pulse || 0;
      scoresByPhotographer[p.by] = (scoresByPhotographer[p.by] || 0) + score;
    });
    const sorted = Object.entries(scoresByPhotographer)
      .map(([username, totalScore]) => ({ username, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore);
    weekRankings[wk] = sorted;
  });

  const sortedWeeks = Object.keys(photosByWeek).sort();
  if (sortedWeeks.length === 0) {
    return NextResponse.json({ ok: true, message: 'No photos to process' });
  }

  const minDate = new Date(sortedWeeks[0]!);
  const maxDate = new Date(sortedWeeks[sortedWeeks.length - 1]!);
  const allWeeks: string[] = [];
  let curr = new Date(minDate);
  while (curr <= maxDate) {
    allWeeks.push(curr.toISOString().split('T')[0] as string);
    curr.setDate(curr.getDate() + 7);
  }

  const allUsernames = Array.from(new Set(photos.map(p => p.by)));
  const rankMasterUsernames = new Set<string>();

  allUsernames.forEach(username => {
    let streak = 0;
    for (const wk of allWeeks) {
      const rankings = weekRankings[wk] || [];
      const rankIndex = rankings.findIndex(r => r.username === username);
      const rankedTop3 = rankIndex !== -1 && rankIndex < 3;
      if (rankedTop3) {
        streak += 1;
        if (streak >= 3) {
          rankMasterUsernames.add(username);
        }
      } else {
        streak = 0;
      }
    }
  });

  const latestWeek = sortedWeeks[sortedWeeks.length - 1]!;
  const latestRankings = weekRankings[latestWeek] || [];
  const top10 = latestRankings.slice(0, 10);

  // 4. Fetch current user_ranks
  const { data: userRanks, error: userRanksError } = await supabase
    .from('user_ranks')
    .select('*');
    
  if (userRanksError) {
    return NextResponse.json({ error: 'user_ranks table missing or inaccessible', detail: userRanksError }, { status: 500 });
  }

  const userRanksMap = new Map((userRanks || []).map(ur => [ur.username, ur]));

  const notificationsSent = { rankMaster: 0, top10: 0 };

  // Process Rank Masters
  for (const username of Array.from(rankMasterUsernames)) {
    const user = users.find(u => u.username === username);
    if (!user) continue;
    
    const currentRank = userRanksMap.get(username);
    if (!currentRank || !currentRank.is_rank_master) {
      // Send email
      if (user.email && user.email.includes('@')) { // Basic sanity check
        await sendRankMasterEmail(user.email, user.display_name || user.username);
        notificationsSent.rankMaster++;
      }
      
      // Update DB
      await supabase.from('user_ranks').upsert({
        user_id: user.id,
        username: user.username,
        is_rank_master: true,
        rank_master_since: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      // Update local map to prevent re-upsert if also in Top 10 loop
      if (currentRank) {
        currentRank.is_rank_master = true;
      } else {
        userRanksMap.set(username, { user_id: user.id, username: user.username, is_rank_master: true });
      }
    }
  }

  // Process Top 10
  for (let i = 0; i < top10.length; i++) {
    const r = top10[i];
    if (!r) continue;
    const user = users.find(u => u.username === r.username);
    if (!user) continue;
    
    const currentRank = userRanksMap.get(r.username);
    if (!currentRank || currentRank.latest_top_10_week !== latestWeek) {
      // Send email
      if (user.email && user.email.includes('@')) {
        await sendTop10Email(user.email, user.display_name || user.username, i + 1);
        notificationsSent.top10++;
      }
      
      // Update DB
      await supabase.from('user_ranks').upsert({
        user_id: user.id,
        username: user.username,
        latest_top_10_week: latestWeek,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ 
    ok: true, 
    latestWeek,
    rankMastersFound: rankMasterUsernames.size,
    top10Found: top10.length,
    notificationsSent
  });
}
