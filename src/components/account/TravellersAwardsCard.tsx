'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { VoyageurMark } from '@/components/icons';
import { getSeasons } from '@/lib/data';
import { getSeasonInfo, TRAVELLER_MAX_CASHBACK_PERCENT } from '@/content/rules';

const CAT_LABELS: Record<string, string> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  bw: 'Black & White',
};

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

interface CardData {
  rank: number | null;
  category: string | null;
  daysLeft: number | null;
  activePct: number | null;
}

// Self-contained Travellers Awards status card — fetches its own data so it
// can also be dropped onto the home page later. Renders null for non-Travellers.
export function TravellersAwardsCard() {
  const [data, setData] = useState<CardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      const { data: me } = await supabase
        .from('users')
        .select('id, is_customer')
        .eq('id', uid)
        .maybeSingle();
      if (!me?.is_customer) return;

      const [{ data: travellers }, { data: seasonRows }, { data: cashRows }] = await Promise.all([
        supabase.from('users').select('id').eq('is_customer', true),
        supabase.from('seasons').select('id, status, end_date').order('start_date', { ascending: true }),
        supabase
          .from('cashback_eligibility')
          .select('percentage, computed_at')
          .eq('user_id', uid)
          .eq('is_active', true)
          .order('computed_at', { ascending: false })
          .limit(1),
      ]);

      // Traveller pool = published, not-hidden photos by Traveller accounts
      // (same rule as the Travellers explore tab). Ranked by pulse per category.
      let rank: number | null = null;
      let category: string | null = null;
      const travellerIds = (travellers ?? []).map((u: { id: string }) => u.id);
      if (travellerIds.length > 0) {
        const { data: pool } = await supabase
          .from('photos')
          .select('id, photographer_id, category, pulse')
          .eq('status', 'published')
          .eq('is_hidden', false)
          .in('photographer_id', travellerIds);

        const byCat = new Map<string, { photographer_id: string; pulse: number }[]>();
        for (const p of pool ?? []) {
          const cat = (p.category as string) || 'landscape';
          const entry = { photographer_id: p.photographer_id as string, pulse: p.pulse != null ? Number(p.pulse) : 0 };
          const list = byCat.get(cat);
          if (list) list.push(entry);
          else byCat.set(cat, [entry]);
        }
        byCat.forEach((list, cat) => {
          list.sort((a, b) => b.pulse - a.pulse);
          list.forEach((p, i) => {
            if (p.photographer_id === uid && (rank === null || i + 1 < rank)) {
              rank = i + 1;
              category = cat;
            }
          });
        });
      }

      const liveSeason = (seasonRows ?? []).find(
        (s: { status?: string }) => s.status === 'active' || s.status === 'live',
      );
      const endDate: string | null =
        liveSeason?.end_date ?? getSeasons().find((s) => s.status === 'live')?.endDate ?? null;

      const activePct: number | null =
        cashRows && cashRows.length > 0 && typeof cashRows[0]?.percentage === 'number'
          ? cashRows[0].percentage
          : null;

      if (!cancelled) {
        setData({ rank, category, daysLeft: endDate ? daysUntil(endDate) : null, activePct });
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const seasonLabel = getSeasonInfo().label;
  const catLabel = data.category ? (CAT_LABELS[data.category] ?? data.category) : null;
  const linkText =
    data.activePct != null
      ? `ทำอย่างไรถึงได้ ${TRAVELLER_MAX_CASHBACK_PERCENT}% →`
      : 'ทำอย่างไรถึงได้เครดิตเงินคืน →';

  return (
    <div className="p-6 md:py-7 md:px-8 bg-cream border border-rule">
      {/* Header row: programme label + cashback % */}
      <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b border-rule">
        <div className="caps opacity-55 flex items-center gap-2 min-w-0">
          <VoyageurMark size={9} />
          <span className="truncate">Travellers Awards · {seasonLabel}</span>
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          {data.activePct == null && (
            <span className="th text-[12px] text-gold opacity-80">สูงสุด</span>
          )}
          <span className="text-[28px] md:text-[32px] font-medium tracking-[-0.025em] text-gold leading-none">
            {data.activePct ?? TRAVELLER_MAX_CASHBACK_PERCENT}%
          </span>
          <span className="th mono text-[10px] opacity-55 tracking-[.12em]">เครดิตเงินคืน</span>
        </div>
      </div>

      {/* Headline: rank or empty state */}
      {data.rank != null ? (
        <>
          <h3 className="th text-[20px] md:text-[22px] font-normal tracking-[-0.01em] m-0 leading-[1.35] text-fg">
            คุณอยู่อันดับ <strong className="font-semibold">#{data.rank}</strong>
            {catLabel ? <> ในหมวด {catLabel}</> : null}
          </h3>
          <p className="th mt-3 text-[14px] text-fg-soft leading-[1.7] max-w-[480px]">
            {data.daysLeft != null ? `เหลือเวลา ${data.daysLeft} วัน ก่อนปิดประกวด` : 'ฤดูกาลกำลังดำเนินอยู่'}
          </p>
        </>
      ) : (
        <>
          <h3 className="th text-[20px] md:text-[22px] font-normal tracking-[-0.01em] m-0 leading-[1.35] text-fg">
            ยังไม่ได้ส่งภาพเข้าประกวด
          </h3>
          <p className="th mt-3 text-[14px] text-fg-soft leading-[1.7] max-w-[480px]">
            {data.daysLeft != null
              ? `เหลือเวลา ${data.daysLeft} วัน ก่อนปิดประกวด — เริ่มต้นวันนี้`
              : 'ฤดูกาลกำลังดำเนินอยู่ — เริ่มต้นวันนี้'}
          </p>
          <Link href="/upload" className="th inline-block mt-4 text-[14px] font-medium border-b border-rule-strong pb-[3px] text-fg">
            ส่งภาพแรก →
          </Link>
        </>
      )}

      <div className="mt-5">
        <Link
          href="/travellers/how-cashback-works"
          className="th text-[14px] font-medium text-gold hover:underline underline-offset-4"
        >
          {linkText}
        </Link>
      </div>
    </div>
  );
}
