'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SortKey } from '@/lib/data';
import type { Category, Photo } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';
import { MobileExplore } from '@/components/mobile/MobileExplore';

// ===== Explore [category] page (/explore/landscape, /explore/portrait, /explore/bw) =====
// Masonry grid scoped to one category + same filter controls

const TIME_OPTIONS = [
  { v: 'day', l: '24 hours' },
  { v: 'week', l: 'This week' },
  { v: 'month', l: 'This month' },
  { v: 'season', l: 'Spring 2026' },
  { v: 'all', l: 'All time' },
] as const;

type TimeRange = (typeof TIME_OPTIONS)[number]['v'];

const SORT_OPTIONS: { v: SortKey; l: string }[] = [
  { v: 'pulse', l: 'Pulse score' },
  { v: 'recent', l: 'Most recent' },
  { v: 'likes', l: 'Most liked' },
];

const TABS = [
  { id: null, label: 'All' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'bw', label: 'Black & White' },
] as const;

/** Slug → Category mapping (matches source exactly) */
function slugToCategory(slug: string): Category | null {
  if (slug === 'landscape') return 'Landscape';
  if (slug === 'portrait') return 'Portrait';
  if (slug === 'bw') return 'BW';
  return null;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = options.find((o) => o.v === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex gap-[10px] items-center cursor-pointer text-[12px] tracking-[.12em] uppercase"
      >
        <span className="opacity-55">{label}</span>
        <span className="font-medium">{current?.l}</span>
        <span className="text-[9px] opacity-55">▾</span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+12px)] left-0 bg-bg border border-fg min-w-[200px] z-10">
          {options.map((o) => (
            <button
              key={o.v}
              onClick={() => { onChange(o.v); setOpen(false); }}
              className={`block w-full text-left px-4 py-3 text-[13px] cursor-pointer ${
                o.v === value ? 'bg-cream' : 'bg-transparent'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-[120px] text-center">
      <div className="text-[48px] font-light tracking-[-.02em] mb-4 th">
        No photos in this category yet
      </div>
      <p className="text-[15px] text-fg-soft max-w-[400px] mx-auto mb-8 th">
        เป็นคนแรกที่อัพโหลด — หรือชวนช่างภาพในเครือข่ายมาร่วมเวที
      </p>
      <button className="btn">Upload a photo</button>
    </div>
  );
}

export default function ExploreCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const catKey = slugToCategory(params.category);

  // notFound() on unknown category slug
  if (!catKey) {
    notFound();
  }

  const [sort, setSort] = useState<SortKey>('pulse');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [showPicksOnly, setShowPicksOnly] = useState(false);
  const router = useRouter();

  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      let query = supabase
        .from('photos')
        .select('id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, description, users:users!photos_photographer_id_fkey(username)');

      if (catKey) {
        query = query.ilike('category', catKey);
      }

      const { data } = await query;

      if (data) {
        let mapped = data.map((p: any) => {
          const likes = p.likes_count || 0;
          const favorites = p.favorites_count || 0;
          return {
            id: p.id,
            slug: p.id,
            src: p.storage_url,
            title: p.title,
            by: p.users?.username || 'Unknown',
            cat: p.category || 'General',
            w: p.width || 4,
            h: p.height || 3,
            caption: p.description || '',
            exif: { camera: 'Unknown', lens: 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
            likes,
            likes24h: 0,
            comments: p.comments_count || 0,
            favorites,
            hours: 1,
            picks: [],
            date: p.uploaded_at,
            pulse: likes + favorites * 2,
            rank: 0,
          };
        });

        // Sorting logic
        if (sort === 'pulse') {
          mapped.sort((a, b) => b.pulse - a.pulse);
          mapped.forEach((p, i) => (p.rank = i + 1));
        } else if (sort === 'recent') {
          mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else if (sort === 'likes') {
          mapped.sort((a, b) => b.likes - a.likes);
        }

        // Filtering picks (mocked as empty array for now)
        if (showPicksOnly) {
          mapped = mapped.filter((p) => p.picks.length > 0);
        }

        setPhotos(mapped);
      }
      setIsLoading(false);
    };

    fetchPhotos();
  }, [sort, timeRange, showPicksOnly, catKey]);

  const headingLabel = catKey === 'BW' ? 'Black & White' : catKey;

  const coverPhotoId = catKey === 'Landscape' ? 'p010' : catKey === 'Portrait' ? 'p004' : 'p002';
  const coverTitle = catKey === 'BW' ? 'Black & White' : catKey;
  const coverSubtitle = `เลือกชมหมวด ${catKey === 'BW' ? 'Black & White' : catKey} — เรียงตามอันดับ ภาพล่าสุด หรือยอดโหวต`;

  // Map category to MobileExplore's CAT type
  const mobileInitial: 'All' | 'Landscape' | 'Portrait' | 'BW' =
    catKey === 'Landscape' ? 'Landscape'
    : catKey === 'Portrait' ? 'Portrait'
    : catKey === 'BW' ? 'BW'
    : 'All';

  return (
    <>
    <div className="md:hidden">
      <MobileExplore initialCategory={mobileInitial} />
    </div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId={coverPhotoId}
        eyebrow="Category"
        title={coverTitle}
        subtitle={coverSubtitle}
      />
      {/* Header */}
      <section className="py-8 md:py-12 lg:py-16">
        <div className="wrap">
          <div className="flex flex-wrap justify-between items-baseline gap-4 pb-6 md:pb-8">
            <div>
              <div className="caps opacity-55 mb-3 md:mb-[14px]">Explore</div>
              <h1
                className="display-hero text-[clamp(32px,8vw,72px)] m-0 tracking-[-.025em]"
              >
                {headingLabel}
              </h1>
            </div>
            <div className="mono text-[11px] opacity-55 text-right leading-[1.7]">
              {photos.length * 7} PHOTOS<br />
              SORTED BY {sort.toUpperCase()}<br />
              {timeRange.toUpperCase()}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-5 md:gap-7 overflow-x-auto no-scrollbar border-b border-rule pb-0">
            {TABS.map((t) => {
              const active =
                (catKey !== null && catKey.toLowerCase() === t.id) ||
                (catKey === null && t.id === null);
              return (
                <button
                  key={t.id ?? 'all'}
                  onClick={() => router.push(t.id ? `/explore/${t.id}` : '/explore')}
                  className={`py-4 text-[13px] tracking-[.14em] uppercase border-b-2 -mb-px cursor-pointer font-medium ${
                    active
                      ? 'border-fg opacity-100'
                      : 'border-transparent opacity-55'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 py-4 md:py-5 border-b border-rule">
            <div className="flex flex-wrap gap-5 md:gap-8 items-center">
              <FilterDropdown
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={(v) => setSort(v as SortKey)}
              />
              <FilterDropdown
                label="Time"
                value={timeRange}
                options={TIME_OPTIONS as unknown as { v: string; l: string }[]}
                onChange={(v) => setTimeRange(v as TimeRange)}
              />
              {/* opacity is runtime-dynamic: depends on showPicksOnly state */}
              <label
                style={{ opacity: showPicksOnly ? 1 : 0.65 }}
                className="flex items-center gap-2 cursor-pointer text-[12px] tracking-[.12em] uppercase"
              >
                <input
                  type="checkbox"
                  checked={showPicksOnly}
                  onChange={(e) => setShowPicksOnly(e.target.checked)}
                  className="accent-fg"
                />
                Picks only
              </label>
            </div>
            <div className="mono text-[11px] opacity-55 hidden md:block">
              Press{' '}
              <span className="border border-rule px-[6px] py-[2px]">J</span>{' '}
              <span className="border border-rule px-[6px] py-[2px]">K</span>{' '}
              to navigate
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-[40px] pb-[80px]">
        <div className="wrap">
          {isLoading ? (
            <div className="py-20 text-center text-fg-soft">Loading...</div>
          ) : photos.length === 0 ? (
            <EmptyState />
          ) : (
            <PhotoGrid photos={photos} cols={3} showRank={sort === 'pulse'} showLike />
          )}
        </div>
      </section>

      {/* Load more (visual) */}
      {photos.length > 0 && (
        <section className="py-[40px] pb-[80px] text-center">
          <button className="btn btn-ghost" disabled>
            Loading more — infinite scroll
          </button>
        </section>
      )}

      <Footer />
    </div>
    </>
  );
}
