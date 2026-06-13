import { describe, it, expect } from 'vitest';
import { cn, formatCount } from '@/lib/utils';

describe('utils', () => {
  it('cn merges and dedupes tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });
  it('formatCount adds thousands separators', () => {
    expect(formatCount(1284)).toBe('1,284');
  });
});
