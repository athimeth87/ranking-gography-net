// DB parity check: SQL recompute_pulse_active() vs the TS v4 engine.
// Skipped in normal runs (touches the live DB). Run explicitly with:
//   export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
//   RUN_DB_PARITY=1 npx vitest run realtime-pulse-parity
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { assignScores, assignBadge } from '@/lib/pulse-engine-v4';

dotenv.config({ path: '.env.local' });

const RUN = process.env.RUN_DB_PARITY === '1';
const ENGAGEMENTS = [3, 8, 8, 15, 40, 120, 2, 0, 55, 9];

describe.skipIf(!RUN)('SQL recompute_pulse_active parity with v4 TS engine', () => {
  it('matches assignScores/assignBadge within rounding tolerance', async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const db = createClient(url, key, { auth: { persistSession: false } });
    const tag = 'parity-test-' + Date.now();

    const { data: anyUser, error: uErr } = await db.from('users').select('id').limit(1).single();
    if (uErr || !anyUser) throw uErr ?? new Error('no users to attribute test photos to');

    const rows = ENGAGEMENTS.map((e, i) => ({
      photographer_id: anyUser.id,
      title: `${tag}-${i}`, slug: `${tag}-${i}`, category: 'landscape',
      storage_url: 'https://example.com/x.webp', status: 'published', is_hidden: false,
      engagement: e, impressions_count: 150, uploaded_at: new Date().toISOString(),
    }));
    const { data: photos, error: pErr } = await db.from('photos').insert(rows).select('id');
    if (pErr) throw pErr;

    try {
      await db.rpc('recompute_pulse_active');
      const { data: after } = await db.from('photos')
        .select('id, pulse, badge, impressions_count').in('id', photos!.map((p) => p.id));
      const { data: activeAll } = await db.from('photos')
        .select('id, engagement, impressions_count')
        .eq('status', 'published').eq('is_hidden', false)
        .gte('uploaded_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
      const tsPool = (activeAll ?? []).map((p) => ({ id: p.id as string, engagement: Number(p.engagement), views: Number(p.impressions_count) }));
      const tsById = new Map(assignScores(tsPool).map((r) => [r.item.id, r]));

      for (const p of after ?? []) {
        const t = tsById.get(p.id)!;
        const badge = assignBadge({ score: t.score, views: Number(p.impressions_count), active: true });
        expect(Math.abs(Number(p.pulse) - t.score)).toBeLessThanOrEqual(0.11);
        expect(p.badge ?? null).toBe(badge ?? null);
      }
      expect((after ?? []).length).toBe(ENGAGEMENTS.length);
    } finally {
      await db.from('photos').delete().in('id', photos!.map((p) => p.id));
    }
  }, 30000);
});
