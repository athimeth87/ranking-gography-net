'use client';
import { useEffect, useId, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LivePulse } from '@/lib/realtime-pulse';

// Subscribe to live photo updates. Returns a map id -> LivePulse, patched as
// Supabase Realtime delivers UPDATEs on the photos table.
export function useRealtimePulse(photoIds: string[]): Record<string, LivePulse> {
  const [live, setLive] = useState<Record<string, LivePulse>>({});
  const instanceId = useId();
  const key = photoIds.join(',');

  useEffect(() => {
    if (photoIds.length === 0) return;
    const supabase = getSupabaseBrowserClient();
    const ids = new Set(photoIds);
    const channel = supabase
      .channel(`pulse-live-${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = row.id as string;
          if (!ids.has(id)) return;
          // Patch only the columns this UPDATE carried; absent counts must not reset to 0.
          const patch: LivePulse = {};
          if (row.pulse != null) patch.pulse = Number(row.pulse);
          if ('peak_pulse' in row) patch.peakPulse = row.peak_pulse != null ? Number(row.peak_pulse) : null;
          if ('percentile' in row) patch.percentile = row.percentile != null ? Number(row.percentile) : null;
          if ('badge' in row) patch.badge = (row.badge as string) || null;
          if (row.likes_count != null) patch.likes = Number(row.likes_count);
          if (row.favorites_count != null) patch.favorites = Number(row.favorites_count);
          if (row.comments_count != null) patch.comments = Number(row.comments_count);
          setLive((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, instanceId]);

  return live;
}
