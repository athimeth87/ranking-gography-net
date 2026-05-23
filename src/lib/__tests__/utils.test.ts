import { describe, it, expect } from 'vitest';
import { cn, picsum, formatCount } from '@/lib/utils';

describe('utils', () => {
  it('cn merges and dedupes tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
  it('picsum builds a seeded url with default ratio', () => {
    expect(picsum('x', 100)).toBe('https://picsum.photos/seed/x/100/125');
  });
  it('formatCount adds thousands separators', () => {
    expect(formatCount(1284)).toBe('1,284');
  });
});
