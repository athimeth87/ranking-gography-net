'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Photo } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { SectionNumber } from '@/components/editorial/SectionNumber';
import { CategoryChips } from './CategoryChips';

interface LeaderboardSectionProps {
  allPhotos: Photo[];
  voyageurUsernames: Set<string>;
}

export function LeaderboardSection({ allPhotos, voyageurUsernames }: LeaderboardSectionProps) {
  const router = useRouter();
  const t = useTranslations('LeaderboardSection');
  const [leaderCat, setLeaderCat] = useState('All');

  let leaderboardSource: Photo[];
  if (leaderCat === 'All') leaderboardSource = allPhotos.slice();
  else if (leaderCat === 'Travellers')
    leaderboardSource = allPhotos.filter((p) => p.voyageurOnly);
  else leaderboardSource = allPhotos.filter((p) => p.cat === leaderCat);
  const leaderboard = leaderboardSource.slice(0, 8);

  return (
    <section className="py-10 pb-20">
      <div className="wrap">
        <SectionNumber n={1} label={t('section_label')} />
        <div className="flex justify-between items-end pb-6 mb-6 border-b border-[var(--rule)]">
          <div>
            <h2 className="text-[48px] font-normal leading-none m-0 tracking-[-.025em]">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={() =>
              router.push(
                leaderCat === 'Travellers'
                  ? '/photographers/travellers'
                  : leaderCat === 'All'
                    ? '/explore'
                    : `/explore/${leaderCat.toLowerCase()}`,
              )
            }
            className="caps cursor-pointer border-b border-[var(--fg)] pb-1"
          >
            {t('see_all')} →
          </button>
        </div>
        <CategoryChips value={leaderCat} onChange={setLeaderCat} showVoyageurs />
        <div className="mt-8">
          <PhotoGrid photos={leaderboard} cols={4} showRank showRankDelta uniform showLike />
        </div>
      </div>
    </section>
  );
}
