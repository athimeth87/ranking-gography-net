import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computePulsePrecise, type PickType } from '@/lib/pulse-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Scheduled by vercel.json → recomputes pulse for every published photo and
// keeps peak_pulse = max(peak_pulse, pulse). Single source of truth: the TS
// engine writes the score the DB then ranks by.
export async function GET(request: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
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
    .select('id, likes_count, favorites_count, comments_count, impressions_count, uploaded_at, pick_type, title, category, location, camera, lens')
    .eq('is_hidden', false)
    .eq('status', 'published');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute every score in-process with the TS engine...
  const updates = (photos ?? []).map((p) => ({
    id: p.id,
    pulse: computePulsePrecise({
      likes_count: p.likes_count || 0,
      favorites_count: p.favorites_count || 0,
      comments_count: p.comments_count || 0,
      impressions_count: p.impressions_count || 0,
      uploaded_at: p.uploaded_at,
      pick_type: (p.pick_type as PickType) ?? 'none',
      has_title: !!p.title,
      has_category: !!p.category,
      has_descriptor: !!(p.location || p.camera || p.lens),
    }),
  }));

  // ...then write them back in one set-based UPDATE per chunk (peak handled in SQL).
  const CHUNK = 1000;
  let updated = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const batch = updates.slice(i, i + CHUNK);
    const { data: n, error: rpcErr } = await supabase.rpc('apply_photo_pulse', { updates: batch });
    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message, updated }, { status: 500 });
    }
    updated += typeof n === 'number' ? n : batch.length;
  }

  return NextResponse.json({ ok: true, scored: updates.length, updated });
}
