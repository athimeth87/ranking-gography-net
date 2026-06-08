// DB check: SQL recompute_pulse_active() matches the engagement-curve formula
//   pulse = round(99.99 * (1 - exp(-0.03 * engagement)), 1)
// Skipped in normal runs (touches the live DB). Run explicitly with:
//   export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
//   RUN_DB_PARITY=1 npx vitest run realtime-pulse-parity
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const RUN = process.env.RUN_DB_PARITY === '1';
const ENGAGEMENTS = [3, 8, 8, 15, 40, 120, 2, 0, 55, 9];
const PULSE_K = 0.03;
const expectedPulse = (engagement: number) =>
  Math.round(99.99 * (1 - Math.exp(-PULSE_K * engagement)) * 10) / 10;

describe.skipIf(!RUN)('SQL recompute_pulse_active matches the engagement curve', () => {
  it('pulse = round(99.99*(1-exp(-0.03*engagement)),1) per photo', async () => {
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
    const { data: photos, error: pErr } = await db.from('photos').insert(rows).select('id, engagement');
    if (pErr) throw pErr;

    try {
      await db.rpc('recompute_pulse_active');
      const { data: after } = await db.from('photos')
        .select('id, engagement, pulse').in('id', photos!.map((p) => p.id));

      for (const p of after ?? []) {
        expect(Math.abs(Number(p.pulse) - expectedPulse(Number(p.engagement)))).toBeLessThanOrEqual(0.11);
      }
      expect((after ?? []).length).toBe(ENGAGEMENTS.length);
    } finally {
      await db.from('photos').delete().in('id', photos!.map((p) => p.id));
    }
  }, 30000);
});
