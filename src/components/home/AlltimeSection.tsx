'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Photo } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { SectionNumber } from '@/components/editorial/SectionNumber';
import { CategoryChips } from './CategoryChips';

interface AlltimeSectionProps {
  allPhotos: Photo[];
  voyageurUsernames: Set<string>;
}

export function AlltimeSection({ allPhotos, voyageurUsernames }: AlltimeSectionProps) {
  const router = useRouter();
  const t = useTranslations('AlltimeSection');
  const [alltimeCat, setAlltimeCat] = useState('All');

  const computeAlltime = (p: Photo): number => p.likes;

  let alltimeSource: Photo[];
  if (alltimeCat === 'All') alltimeSource = allPhotos.slice();
  else if (alltimeCat === 'Voyageurs')
    alltimeSource = allPhotos.filter((p) => p.voyageurOnly);
  else alltimeSource = allPhotos.filter((p) => p.cat === alltimeCat);

  const alltimeBoard = alltimeSource
    .slice()
    .map((p) => ({ ...p, _allTimeScore: computeAlltime(p) }))
    .sort((a, b) => b._allTimeScore - a._allTimeScore)
    .map((p, i) => ({ ...p, rank: i + 1, pulse: p._allTimeScore }))
    .slice(0, 8);

  return (
    <section className="pb-20">
      <div className="wrap">
        <SectionNumber n={2} label={t('section_label')} />
        <div className="flex justify-between items-end pb-6 mb-6 border-b border-[var(--rule)]">
          <div>
            <h2 className="text-[48px] font-normal leading-none m-0 tracking-[-.025em]">
              {t('title')}
            </h2>
            <p className="th mt-[14px] text-[13px] text-[var(--fg-soft)] max-w-[540px] leading-[1.6]">
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={() => router.push('/explore')}
            className="caps cursor-pointer border-b border-[var(--fg)] pb-1"
          >
            {t('see_archive')} →
          </button>
        </div>
        <CategoryChips value={alltimeCat} onChange={setAlltimeCat} showVoyageurs />
        <div className="mt-8">
          <PhotoGrid photos={alltimeBoard} cols={4} showRank showRankDelta uniform showLike />
        </div>
      </div>
    </section>
  );
}
