import type { Photo } from '@/lib/types';
import { PhotoCard } from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  cols?: number;
  showRank?: boolean;
  showRankDelta?: boolean;
  uniform?: boolean;
  pulseLabel?: string;
  showLike?: boolean;
}

export function PhotoGrid({
  photos,
  cols = 3,
  showRank = false,
  showRankDelta = false,
  uniform = false,
  pulseLabel = 'Pulse',
  showLike = false,
}: PhotoGridProps) {
  const leaderTopScore =
    showRankDelta && photos.length > 0 ? Math.max(...photos.map((p) => p.pulse)) : null;

  const gridColsMap: Record<number, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };
  const columnsMap: Record<number, string> = {
    1: 'lg:columns-1',
    2: 'lg:columns-2',
    3: 'lg:columns-3',
    4: 'lg:columns-4',
  };

  if (uniform) {
    return (
      <div
        className={`pgrid pgrid-stagger grid gap-6 grid-cols-1 md:grid-cols-2 ${gridColsMap[cols] || 'lg:grid-cols-3'}`}
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
              showLike={showLike}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`pgrid pgrid-stagger gap-6 columns-1 md:columns-2 ${columnsMap[cols] || 'lg:columns-3'}`}
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
            showLike={showLike}
          />
        </div>
      ))}
    </div>
  );
}
