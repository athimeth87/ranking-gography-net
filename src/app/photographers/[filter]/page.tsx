'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getPhotographers, getPhotos } from '@/lib/data';
import type { Photographer } from '@/lib/types';
import { PhotographerCard } from '@/components/home/PhotographerCard';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';

// ===== Filtered photographers directory — /photographers/[filter] =====
// Valid filter values: 'all' | 'voyageurs' | 'ambassadors' | 'general'

type FilterValue = 'all' | 'voyageurs' | 'ambassadors' | 'general';
type SortValue = 'featured' | 'followers' | 'photos' | 'newest';

const VALID_FILTERS: FilterValue[] = ['all', 'voyageurs', 'ambassadors', 'general'];

export default function PhotographersFilterPage({ params }: { params: { filter: string } }) {
  const initialFilter: FilterValue = VALID_FILTERS.includes(params.filter as FilterValue)
    ? (params.filter as FilterValue)
    : (() => { notFound(); })() as never;

  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const [sort, setSort] = useState<SortValue>('featured');

  const allPhotographers = getPhotographers();
  const allPhotos = getPhotos();

  let list: Photographer[] = allPhotographers.slice();
  if (filter === 'voyageurs') list = list.filter((p: Photographer) => p.isCustomer);
  if (filter === 'ambassadors') list = list.filter((p: Photographer) => p.isAmbassador);
  if (filter === 'general') list = list.filter((p: Photographer) => !p.isCustomer && !p.isAmbassador);

  if (sort === 'followers') list = [...list].sort((a: Photographer, b: Photographer) => b.followers - a.followers);
  else if (sort === 'photos') list = [...list].sort((a: Photographer, b: Photographer) => b.photos - a.photos);
  else if (sort === 'newest') list = [...list].sort((a: Photographer, b: Photographer) => b.joined.localeCompare(a.joined));

  const filterChips: { v: FilterValue; l: string; n: number }[] = [
    { v: 'all', l: 'All', n: allPhotographers.length },
    { v: 'voyageurs', l: 'Voyageurs ◆', n: allPhotographers.filter((p: Photographer) => p.isCustomer).length },
    { v: 'ambassadors', l: 'Ambassadors ★', n: allPhotographers.filter((p: Photographer) => p.isAmbassador).length },
    { v: 'general', l: 'Photographers', n: allPhotographers.filter((p: Photographer) => !p.isCustomer && !p.isAmbassador).length },
  ];

  const coverPhotoId = filter === 'voyageurs' ? 'p015' : filter === 'ambassadors' ? 'p002' : 'p018';
  const coverTitle = filter === 'voyageurs' ? 'Voyageurs' : filter === 'ambassadors' ? 'Ambassadors' : 'All photographers';
  const coverSubtitle = filter === 'voyageurs'
    ? 'ลูกค้า GOGRAPHY ที่เคยร่วมทริปและมีภาพอยู่บนเวที'
    : filter === 'ambassadors'
    ? 'ช่างภาพรับเชิญที่ GOGRAPHY ไว้วางใจให้คัดเลือกภาพ'
    : 'รวมช่างภาพและ Voyageurs ที่อยู่บนเวที GOGRAPHY Photo Awards';

  return (
    <div className="page-fade">
      <PageCover
        photoId={coverPhotoId}
        eyebrow="Directory"
        title={coverTitle}
        subtitle={coverSubtitle}
      />

      {/* Filter / Sort bar */}
      <section className="py-[32px] border-t border-rule border-b border-rule">
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {filterChips.map((f) => {
                const active = filter === f.v;
                return (
                  <button
                    key={f.v}
                    onClick={() => setFilter(f.v)}
                    className={`inline-flex items-center gap-2 px-[16px] py-[9px] border text-[11px] tracking-[.14em] uppercase font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'border-fg bg-fg text-bg'
                        : 'border-rule bg-transparent text-fg'
                    }`}
                  >
                    <span>{f.l}</span>
                    <span className="opacity-55 mono">{f.n}</span>
                  </button>
                );
              })}
            </div>
            {/* Sort */}
            <div className="flex items-center gap-3">
              <span className="caps opacity-55">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="px-3 py-2 border border-rule bg-transparent text-fg text-[12px] tracking-[.12em] uppercase cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="followers">Most followers</option>
                <option value="photos">Most photos</option>
                <option value="newest">Newest joined</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-[56px] pb-[96px]">
        <div className="wrap">
          {list.length === 0 ? (
            <div className="py-[120px] text-center text-fg-soft th">ไม่พบช่างภาพในตัวกรองนี้</div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {list.map((p: Photographer) => (
                <PhotographerCard
                  key={p.username}
                  photographer={p}
                  variant={p.isCustomer ? 'voyageur' : 'general'}
                  photos={allPhotos}
                />
              ))}
            </div>
          )}

          {/* Footer count */}
          <div className="mt-14 pt-6 border-t border-rule flex justify-between items-center mono">
            <span className="text-[11px] opacity-55 tracking-[.14em]">
              SHOWING {list.length} OF {allPhotographers.length} PHOTOGRAPHERS
            </span>
            <button
              onClick={() => router.push('/explore')}
              className="caps cursor-pointer border-b border-rule pb-[4px] opacity-65"
            >
              Browse photos instead →
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
