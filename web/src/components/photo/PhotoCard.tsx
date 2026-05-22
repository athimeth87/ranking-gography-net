'use client';
import { useRouter } from 'next/navigation';
import type { Photo } from '@/lib/types';
import { getPhotographer } from '@/lib/data';
import { PickBadge } from '@/components/icons';

interface PhotoCardProps {
  photo: Photo;
  showRank?: boolean;
  showRankDelta?: boolean;
  leaderTopScore?: number | null;
  uniform?: boolean;
  pulseLabel?: string;
}

export function PhotoCard({
  photo,
  showRank = false,
  showRankDelta = false,
  leaderTopScore = null,
  uniform = false,
  pulseLabel = 'Pulse',
}: PhotoCardProps) {
  const router = useRouter();
  const photographer = getPhotographer(photo.by);
  const delta =
    showRankDelta && leaderTopScore != null && photo.rank > 1
      ? photo.pulse - leaderTopScore
      : null;

  return (
    <div className="pcard" onClick={() => router.push(`/photo/${photo.id}`)}>
      <div
        className="pimg"
        style={{ aspectRatio: uniform ? '4/5' : `${photo.w}/${photo.h}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.title} loading="lazy" />
      </div>
      <div className="pmeta">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1, minWidth: 0 }}>
          {showRank && (
            <span className="rank" style={{ flexShrink: 0 }}>
              {String(photo.rank).padStart(2, '0')}
            </span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="ptitle"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {photo.title}
            </div>
            <div className="pby">{photographer ? photographer.name : photo.by}</div>
          </div>
        </div>
        <div style={{ flexShrink: 0, marginLeft: 16, textAlign: 'right' }}>
          <div className="pulse">
            <span className="big">{photo.pulse.toFixed(0)}</span>
            <span className="lab">{pulseLabel}</span>
          </div>
          {delta !== null && (
            <div
              className="mono"
              style={{ fontSize: 10, color: 'var(--fg-soft)', marginTop: 4, letterSpacing: '.04em' }}
            >
              {delta.toFixed(1)} from #1
            </div>
          )}
        </div>
      </div>
      {photo.picks.length > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          {photo.picks.includes('editor') && photo.picks.includes('ambassador') ? (
            <PickBadge kind="both" />
          ) : (
            <>
              {photo.picks.includes('editor') && <PickBadge kind="editor" />}
              {photo.picks.includes('ambassador') && <PickBadge kind="ambassador" />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
