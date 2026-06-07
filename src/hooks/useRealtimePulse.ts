'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LivePulse } from '@/lib/realtime-pulse';

// Subscribe to live photo updates. Returns a map id -> LivePulse, patched as
// Supabase Realtime delivers UPDATEs on the photos table.
export function useRealtimePulse(photoIds: string[]): Record<string, LivePulse> {
  const [live, setLive] = useState<Record<string, LivePulse>>({});
  const key = photoIds.join(',');

  useEffect(() => {
    if (photoIds.length === 0) return;
    const supabase = getSupabaseBrowserClient();
    const ids = new Set(photoIds);
    const channel = supabase
      .channel(`pulse-live-${key.slice(0, 40)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = row.id as string;
          if (!ids.has(id)) return;
          setLive((prev) => ({
            ...prev,
            [id]: {
              pulse: row.pulse != null ? Number(row.pulse) : 0,
              peakPulse: row.peak_pulse != null ? Number(row.peak_pulse) : null,
              percentile: row.percentile != null ? Number(row.percentile) : null,
              badge: (row.badge as string) || null,
              likes: Number(row.likes_count ?? 0),
              favorites: Number(row.favorites_count ?? 0),
              comments: Number(row.comments_count ?? 0),
            },
          }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return live;
}
