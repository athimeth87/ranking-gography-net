'use client';
import { useMemo } from 'react';
import { PhotoGrid } from './PhotoGrid';
import { useRealtimePulse } from '@/hooks/useRealtimePulse';
import { mergeLivePulse } from '@/lib/realtime-pulse';

type Props = React.ComponentProps<typeof PhotoGrid> & { liveSort?: boolean };

// Drop-in replacement for <PhotoGrid> that overlays live pulse/counters and,
// when liveSort is set, re-orders the grid as scores change.
export function RealtimePhotoGrid({ photos, liveSort = false, ...rest }: Props) {
  const ids = useMemo(() => photos.map((p) => p.id), [photos]);
  const live = useRealtimePulse(ids);
  const merged = useMemo(() => mergeLivePulse(photos, live, liveSort), [photos, live, liveSort]);
  return <PhotoGrid photos={merged} {...rest} />;
}
