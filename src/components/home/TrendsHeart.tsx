'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useLikeState } from '@/hooks/useLikeState';

export function TrendsHeart({ photoId }: { photoId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { liked, count, toggle } = useLikeState(photoId);

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
      className={`heart ${liked ? 'on' : ''} !py-[6px] !px-[10px] !text-[11px]`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        width="12"
        height="12"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </button>
  );
}
