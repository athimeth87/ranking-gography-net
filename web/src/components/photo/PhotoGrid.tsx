import type { Photo } from '@/lib/types';
import { PhotoCard } from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  cols?: number;
  showRank?: boolean;
  showRankDelta?: boolean;
  uniform?: boolean;
  pulseLabel?: string;
}

export function PhotoGrid({
  photos,
  cols = 3,
  showRank = false,
  showRankDelta = false,
  uniform = false,
  pulseLabel = 'Pulse',
}: PhotoGridProps) {
  const leaderTopScore =
    showRankDelta && photos.length > 0 ? Math.max(...photos.map((p) => p.pulse)) : null;

  if (uniform) {
    return (
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {photos.map((p) => (
          <PhotoCard
            key={p.id}
            photo={p}
            showRank={showRank}
            showRankDelta={showRankDelta}
            leaderTopScore={leaderTopScore}
            uniform
            pulseLabel={pulseLabel}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="gap-6" style={{ columnCount: cols }}>
      {photos.map((p) => (
        <div key={p.id} className="break-inside-avoid mb-8">
          <PhotoCard
            photo={p}
            showRank={showRank}
            showRankDelta={showRankDelta}
            leaderTopScore={leaderTopScore}
            pulseLabel={pulseLabel}
          />
        </div>
      ))}
    </div>
  );
}
