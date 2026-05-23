import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function picsum(seed: string, w = 1200, h?: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h ?? Math.round(w * 1.25)}`;
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}
