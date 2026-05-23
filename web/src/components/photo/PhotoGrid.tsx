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
        className="pgrid pgrid-stagger grid gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {photos.map((p, i) => (
          <div key={p.id} style={{ '--i': i } as React.CSSProperties}>
            <PhotoCard
              photo={p}
              showRank={showRank}
              showRankDelta={showRankDelta}
              leaderTopScore={leaderTopScore}
              uniform
              pulseLabel={pulseLabel}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="pgrid pgrid-stagger gap-6"
      style={{ columnCount: cols } as React.CSSProperties}
    >
      {photos.map((p, i) => (
        <div
          key={p.id}
          className="break-inside-avoid mb-8"
          style={{ '--i': i } as React.CSSProperties}
        >
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
