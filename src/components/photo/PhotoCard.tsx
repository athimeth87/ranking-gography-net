'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Photo, PhotoVisibility } from '@/lib/types';
import { PickBadge } from '@/components/icons';
import { VoteAspect } from './VoteAspect';
import { PhotoCardDeleteButton } from './PhotoCardDeleteButton';
import { PhotoCardVisibilityButton } from './PhotoCardVisibilityButton';
import { PhotoCardCurateButton } from './PhotoCardCurateButton';
import { PulseStatusBadge } from './PulseStatusBadge';
import { SHOW_LIKE_COUNTS } from '@/lib/flags';

const VISIBILITY_LABELS: Record<PhotoVisibility, string> = {
  public: 'Competition',
  portfolio: 'Portfolio',
  private: 'Private',
};

interface PhotoCardProps {
  photo: Photo;
  showRank?: boolean;
  showRankDelta?: boolean;
  leaderTopScore?: number | null;
  uniform?: boolean;
  pulseLabel?: string;
  showLike?: boolean;
  ownerId?: string | null;
  deletable?: boolean;
  onDeleted?: (id: string) => void;
  showVisibility?: boolean;
  onVisibilityChanged?: (id: string, visibility: PhotoVisibility) => void;
  onCurateChanged?: (id: string, isCurated: boolean) => void;
}

export function PhotoCard({
  photo,
  showRank = false,
  uniform = false,
  showLike = false,
  ownerId,
  deletable = false,
  onDeleted,
  showVisibility = false,
  onVisibilityChanged,
  onCurateChanged,
}: PhotoCardProps) {
  const router = useRouter();
  const t = useTranslations('PhotoCard');

  return (
    <div className="pcard relative group" onClick={() => router.push(`/photo/${photo.id}`)}>
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
              <span>{photo.by}</span>
              <span className="pimg-overlay-sep">·</span>
              <span>{photo.exif?.camera || t('unknown_camera')}</span>
            </div>
            {SHOW_LIKE_COUNTS && (
              <div className="pimg-overlay-pulse">
                <span className="pimg-overlay-pulse-num">{photo.likes}</span>
                <span className="pimg-overlay-pulse-lab">{t('likes')}</span>
              </div>
            )}
          </div>
        </div>
        {showLike && <VoteAspect photoId={photo.id} ownerId={ownerId} variant="card" />}
        {deletable && onDeleted && (
          <PhotoCardDeleteButton photoId={photo.id} storageUrl={photo.src} onDeleted={onDeleted} />
        )}
        {onVisibilityChanged && (
          <PhotoCardVisibilityButton
            photoId={photo.id}
            visibility={photo.visibility ?? 'public'}
            onChanged={onVisibilityChanged}
          />
        )}
        {onCurateChanged && (
          <PhotoCardCurateButton
            photoId={photo.id}
            isCurated={photo.isCurated ?? false}
            onChanged={onCurateChanged}
          />
        )}
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
            <div className="pby">{photo.by}</div>
            {showVisibility && (
              <div className="caps text-[9px] opacity-55 mt-1">
                {VISIBILITY_LABELS[photo.visibility ?? 'public']}
              </div>
            )}
            <PulseStatusBadge pulse={photo.peakPulse ?? photo.pulse} badge={photo.badge} className="mt-[6px]" />
          </div>
        </div>
        {SHOW_LIKE_COUNTS && (
          <div className="shrink-0 ml-4 text-right">
            <div className="pulse">
              <span className="big">{photo.likes}</span>
              <span className="lab">{t('likes')}</span>
            </div>
            <div className="mono text-[10px] text-fg-soft mt-1 tracking-[.04em] flex gap-2 justify-end">
              {photo.favorites > 0 && <span>★ {photo.favorites}</span>}
              {photo.comments > 0 && <span>· {photo.comments} {t('comments')}</span>}
            </div>
          </div>
        )}
      </div>
      {(photo.picks?.length || 0) > 0 && (
        <div className="absolute top-3 right-3 flex gap-[6px]">
          {photo.picks?.includes('editor') && photo.picks?.includes('ambassador') ? (
            <PickBadge kind="both" />
          ) : (
            <>
              {photo.picks?.includes('editor') && <PickBadge kind="editor" />}
              {photo.picks?.includes('ambassador') && <PickBadge kind="ambassador" />}
            </>
          )}
        </div>
      )}
      {photo.voyageurOnly && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/30 text-[9px] tracking-widest font-medium uppercase px-2 py-1 rounded-sm flex items-center gap-1.5 z-10 shadow-lg pointer-events-none">
          <span className="text-[10px]">👑</span>
          {t('voyageur_only')}
        </div>
      )}
    </div>
  );
}
