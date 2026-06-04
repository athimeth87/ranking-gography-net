'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Photographer, Photo } from '@/lib/types';
import { PhotographerCard } from './PhotographerCard';
import { SectionNumber } from '@/components/editorial/SectionNumber';

interface FeaturedPhotographersSectionProps {
  photographers: Photographer[];
  allPhotos: Photo[];
}

export function FeaturedPhotographersSection({
  photographers,
  allPhotos,
}: FeaturedPhotographersSectionProps) {
  const router = useRouter();
  const t = useTranslations('FeaturedPhotographersSection');
  const topPhotographers = [...photographers]
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 4);

  return (
    <section className="py-10 pb-24 bg-black text-white">
      <div className="wrap">
        <SectionNumber n={3} label={t('section_label')} />
        <div className="flex justify-between items-baseline pb-7 mb-8 border-b border-[var(--rule)]">
          <div>
            <h2
              className="font-normal m-0 leading-none text-[clamp(36px,4.2vw,56px)] tracking-[-.025em]"
            >
              {t('title')}
            </h2>
          </div>
          <button
            onClick={() => router.push('/photographers')}
            className="caps cursor-pointer border-b border-[var(--fg)] pb-1"
          >
            {t('view_all')} →
          </button>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {topPhotographers.map((p) => (
            <PhotographerCard key={p.username} photographer={p} variant="general" photos={allPhotos} />
          ))}
        </div>
      </div>
    </section>
  );
}
