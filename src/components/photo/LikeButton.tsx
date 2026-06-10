'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useLikeState } from '@/hooks/useLikeState';
import { SHOW_LIKE_COUNTS } from '@/lib/flags';

export interface LikeButtonProps {
  photoId: string;
  ownerId?: string | null;
}

export function LikeButton({ photoId, ownerId }: LikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser } = useApp();
  const { liked, count, toggle } = useLikeState(photoId);

  if (authUser && ownerId && authUser.id === ownerId) return null;

  const onClick = async () => {
    const result = await toggle();
    if (result.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  return (
    <button
      className={`heart${liked ? ' on' : ''}`}
      onClick={onClick}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
    >
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="13" height="13">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {SHOW_LIKE_COUNTS && <span>{count.toLocaleString()}</span>}
    </button>
  );
}
