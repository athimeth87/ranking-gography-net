import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PickType } from '@/lib/pulse-engine';
import { rankField } from '@/lib/pulse-engine-v2';

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
    .select('id, likes_count, favorites_count, comments_count, impressions_count, uploaded_at, pick_type')
    .eq('is_hidden', false)
    .eq('status', 'published');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const ranked = rankField(
    (photos ?? []).map((p) => ({
      id: p.id as string,
      likes_count: p.likes_count || 0,
      favorites_count: p.favorites_count || 0,
      comments_count: p.comments_count || 0,
      impressions_count: p.impressions_count || 0,
      created_at: p.uploaded_at as string,
      pick_type: (p.pick_type as PickType) ?? 'none',
    })),
    now,
  );

  const updates = ranked.map((r) => ({
    id: r.id,
    pulse: r.displayScore,
    score_v2: Math.round(r.rankingScore * 1e6) / 1e6,
    percentile: Math.round(r.percentile * 1e4) / 1e4,
    badge: r.badge ?? '',
  }));

  const CHUNK = 1000;
  let updated = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const batch = updates.slice(i, i + CHUNK);
    const { data: n, error: rpcErr } = await supabase.rpc('apply_photo_pulse_v2', { updates: batch });
    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message, updated }, { status: 500 });
    }
    updated += typeof n === 'number' ? n : batch.length;
  }

  return NextResponse.json({ ok: true, scored: updates.length, updated, model: 'v2-master' });
}
