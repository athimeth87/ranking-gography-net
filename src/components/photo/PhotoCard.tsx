'use client';
import { useRouter } from 'next/navigation';
import type { Photo } from '@/lib/types';
import { getPhotographer } from '@/lib/data';
import { PickBadge } from '@/components/icons';
import { CardLikeButton } from './CardLikeButton';

interface PhotoCardProps {
  photo: Photo;
  showRank?: boolean;
  showRankDelta?: boolean;
  leaderTopScore?: number | null;
  uniform?: boolean;
  pulseLabel?: string;
  showLike?: boolean;
}

export function PhotoCard({
  photo,
  showRank = false,
  showRankDelta = false,
  leaderTopScore = null,
  uniform = false,
  pulseLabel = 'Pulse',
  showLike = false,
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
        {/* Hover overlay: photo metadata fades in from bottom */}
        <div className="pimg-overlay">
          <div className="pimg-overlay-grad" />
          <div className="pimg-overlay-content">
            <div className="pimg-overlay-cat">{photo.cat}</div>
            <div className="pimg-overlay-title">{photo.title}</div>
            <div className="pimg-overlay-meta">
              <span>{photographer ? photographer.name : photo.by}</span>
              <span className="pimg-overlay-sep">·</span>
              <span>{photo.exif?.camera || 'Unknown Camera'}</span>
            </div>
            <div className="pimg-overlay-pulse">
              <span className="pimg-overlay-pulse-num">{photo.pulse.toFixed(0)}</span>
              <span className="pimg-overlay-pulse-lab">PULSE</span>
            </div>
          </div>
        </div>
        {showLike && <CardLikeButton photoId={photo.id} />}
      </div>
      <div className="pmeta">
        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          {showRank && (
            <span className="rank shrink-0">
              {String(photo.rank).padStart(2, '0')}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="ptitle truncate">
              {photo.title}
            </div>
            <div className="pby">{photographer ? photographer.name : photo.by}</div>
          </div>
        </div>
        <div className="shrink-0 ml-4 text-right">
          <div className="pulse">
            <span className="big">{photo.pulse.toFixed(0)}</span>
            <span className="lab">{pulseLabel}</span>
          </div>
          {delta !== null && (
            <div className="mono text-[10px] text-fg-soft mt-1 tracking-[.04em]">
              {delta.toFixed(1)} from #1
            </div>
          )}
        </div>
      </div>
      {photo.picks.length > 0 && (
        <div className="absolute top-3 right-3 flex gap-[6px]">
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
      {photo.voyageurOnly && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/30 text-[9px] tracking-widest font-medium uppercase px-2 py-1 rounded-sm flex items-center gap-1.5 z-10 shadow-lg pointer-events-none">
          <span className="text-[10px]">👑</span>
          Voyageur Only
        </div>
      )}
    </div>
  );
}
