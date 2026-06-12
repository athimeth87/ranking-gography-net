'use client';
import { VoteAspect } from '@/components/photo/VoteAspect';

// Home "trends" quick-vote — the plain heart is replaced by the aspect chips
// (vote color / composition; the power bar unlocks once you've voted).
export function TrendsHeart({ photoId }: { photoId: string }) {
  return <VoteAspect photoId={photoId} variant="ranking" />;
}
