'use client';
// Interactive ambassador controls — needs router.push(), so must be client component
import { useRouter } from 'next/navigation';

export function ProfileButton({ username }: { username: string }) {
  const router = useRouter();
  return (
    <button
      className="btn btn-sm mt-[24px]"
      onClick={() => router.push(`/photographer/${username}`)}
    >
      View profile
    </button>
  );
}

export function PhotoThumb({ id, src, title }: { id: string; src: string; title: string }) {
  const router = useRouter();
  return (
    <div className="cursor-pointer" onClick={() => router.push(`/photo/${id}`)}>
      <div className="aspect-square bg-[var(--tile)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} loading="lazy" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
