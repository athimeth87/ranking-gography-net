'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useLikeState } from '@/hooks/useLikeState';

export interface CardLikeButtonProps {
  photoId: string;
  ownerId?: string | null;
}

export function CardLikeButton({ photoId, ownerId }: CardLikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser } = useApp();
  const { liked, toggle } = useLikeState(photoId);

  if (authUser && ownerId && authUser.id === ownerId) return null;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const result = await toggle();
    if (result.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      className="absolute bottom-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors text-white"
    >
      <svg
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        height="16"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
