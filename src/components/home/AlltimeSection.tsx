'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [alltimeCat, setAlltimeCat] = useState('All');

  const computeAlltime = (p: Photo): number => p.likes + p.favorites * 2;

  let alltimeSource: Photo[];
  if (alltimeCat === 'All') alltimeSource = allPhotos.slice();
  else if (alltimeCat === 'Voyageurs')
    alltimeSource = allPhotos.filter((p) => voyageurUsernames.has(p.by));
  else alltimeSource = allPhotos.filter((p) => p.cat === alltimeCat);

  const alltimeBoard = alltimeSource
    .slice()
    .map((p) => ({ ...p, _allTimeScore: computeAlltime(p) }))
    .sort((a, b) => b._allTimeScore - a._allTimeScore)
    .map((p, i) => ({ ...p, rank: i + 1, pulse: p._allTimeScore / 10 }))
    .slice(0, 8);

  return (
    <section className="pb-20">
      <div className="wrap">
        <SectionNumber n={2} label="All-time · Beyond this week" />
        <div className="flex justify-between items-end pb-6 mb-6 border-b border-[var(--rule)]">
          <div>
            <h2 className="th text-[48px] font-normal leading-none m-0 tracking-[-.025em]">
              All-time
            </h2>
            <p className="th mt-[14px] text-[13px] text-[var(--fg-soft)] max-w-[540px] leading-[1.6]">
              Photos older than 1 week — ranked by lifetime engagement (likes + favorites), without time decay
            </p>
          </div>
          <button
            onClick={() => router.push('/explore')}
            className="caps cursor-pointer border-b border-[var(--fg)] pb-1"
          >
            See archive →
          </button>
        </div>
        <CategoryChips value={alltimeCat} onChange={setAlltimeCat} showVoyageurs />
        <div className="mt-8">
          <PhotoGrid photos={alltimeBoard} cols={4} showRank showRankDelta uniform pulseLabel="Total" />
        </div>
      </div>
    </section>
  );
}
