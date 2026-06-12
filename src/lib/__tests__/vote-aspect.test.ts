import { describe, it, expect } from 'vitest';
import { isVoted, EMPTY_SELECTION, type AspectSelection } from '@/lib/data/likes';
import { voteAspectWeight } from '@/lib/pulse-engine-v4';

const sel = (color: boolean, composition: boolean, light: boolean): AspectSelection => ({ color, composition, light });

describe('Vote Aspect — selection state', () => {
  it('isVoted: true when any aspect is picked, false when none', () => {
    expect(isVoted(EMPTY_SELECTION)).toBe(false);
    expect(isVoted(sel(true, false, false))).toBe(true);
    expect(isVoted(sel(false, true, false))).toBe(true);
    expect(isVoted(sel(false, false, true))).toBe(true);
  });

  it('clearing every aspect = un-vote (the only way a vote is removed)', () => {
    expect(isVoted(sel(false, false, false))).toBe(false);
  });

  it('weight follows the count: 1 side = 1.0, 2–3 sides = 1.25', () => {
    expect(voteAspectWeight({ aspectColor: true, aspectComposition: false, aspectLight: false })).toBe(1.0);
    expect(voteAspectWeight({ aspectColor: false, aspectComposition: true, aspectLight: false })).toBe(1.0);
    expect(voteAspectWeight({ aspectColor: true, aspectComposition: false, aspectLight: true })).toBe(1.25);
    expect(voteAspectWeight({ aspectColor: true, aspectComposition: true, aspectLight: true })).toBe(1.25);
  });
});
