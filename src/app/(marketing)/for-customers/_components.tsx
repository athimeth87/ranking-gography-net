'use client';
// LoginButton — needs router.push(), so must be client component
import { useRouter } from 'next/navigation';

export function LoginButton({
  label,
  to,
  className,
}: {
  label: string;
  to: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button className={className} onClick={() => router.push(to)}>
      {label}
    </button>
  );
}
