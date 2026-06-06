import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assignScores, assignBadge } from '@/lib/pulse-engine-v4';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Scheduled by vercel.json. Pulse v2 (pulse-scoring-MASTER.md): score the whole
// field with the weighted-engagement → Bayesian rate → decay model, percentile-
// rank it, and persist pulse(display) + score_v2(ranking) + percentile + badge.
//
// NOTE: the "field" here is all published photos. The spec's rolling 7-day window
// (§7.1) is a decision point — filter the select by uploaded_at to scope it.
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

  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, engagement, impressions_count, uploaded_at')
    .eq('is_hidden', false)
    .eq('status', 'published');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const activePool = (photos ?? []).map((p) => ({
    id: p.id as string,
    engagement: Number(p.engagement || 0),
    views: Number(p.impressions_count || 0),
    created_at: p.uploaded_at as string,
  }));

  const ranked = assignScores(activePool);

  const updates = ranked.map((r) => {
    const hours = (now - new Date(r.item.created_at).getTime()) / 3600000;
    const active = hours <= 24;
    const badge = assignBadge({ score: r.score, views: r.item.views, active });
    return {
      id: r.item.id,
      pulse: r.score,
      score: r.score,
      percentile: r.percentile,
      badge: badge ?? '',
    };
  });

  const CHUNK = 1000;
  let updated = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const batch = updates.slice(i, i + CHUNK);
    const { data: n, error: rpcErr } = await supabase.rpc('apply_photo_pulse_v4', { updates: batch });
    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message, updated }, { status: 500 });
    }
    updated += typeof n === 'number' ? n : batch.length;
  }

  return NextResponse.json({ ok: true, scored: updates.length, updated, model: 'v4-final' });
}
