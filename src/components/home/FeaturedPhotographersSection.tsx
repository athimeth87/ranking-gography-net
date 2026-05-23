'use client';
import { useRouter } from 'next/navigation';
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
  const featured = photographers.filter((p) => !p.isCustomer).slice(0, 4);

  return (
    <section className="py-10 pb-24">
      <div className="wrap">
        <SectionNumber n={3} label="Featured Photographers · Week 12" />
        <div className="flex justify-between items-baseline pb-7 mb-8 border-b border-[var(--rule)]">
          <div>
            <h2
              className="th font-normal m-0 leading-none text-[clamp(36px,4.2vw,56px)] tracking-[-.025em]"
            >
              Featured Photographers
            </h2>
          </div>
          <button
            onClick={() => router.push('/photographers')}
            className="caps cursor-pointer border-b border-[var(--fg)] pb-1"
          >
            View all photographers →
          </button>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {featured.map((p) => (
            <PhotographerCard key={p.username} photographer={p} variant="general" photos={allPhotos} />
          ))}
        </div>
      </div>
    </section>
  );
}
