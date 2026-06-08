'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Photo } from '@/lib/types';
import type { SortKey } from '@/lib/data';
import { RealtimePhotoGrid } from '@/components/photo/RealtimePhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { MobileExplore } from '@/components/mobile/MobileExplore';

// ===== Explore page (/explore) =====
// Masonry grid + filters (sort, time range, picks only)

const TIME_OPTIONS = [
  { v: 'day', l: '24 hours' },
  { v: 'week', l: 'This week' },
  { v: 'month', l: 'This month' },
  { v: 'season', l: 'Season 01' },
  { v: 'all', l: 'All time' },
] as const;

type TimeRange = (typeof TIME_OPTIONS)[number]['v'];

const SORT_OPTIONS: { v: SortKey; l: string; short: string }[] = [
  { v: 'pulse', l: 'Pulse score', short: 'Pulse' },
  { v: 'recent', l: 'Most recent', short: 'Recent' },
  { v: 'likes', l: 'Most liked', short: 'Liked' },
];

const TABS = [
  { id: null, label: 'All', gold: false },
  { id: 'voyageurs', label: 'Travellers', gold: true },
  { id: 'landscape', label: 'Landscape', gold: false },
  { id: 'portrait', label: 'Portrait', gold: false },
  { id: 'bw', label: 'Black & White', gold: false },
] as const;

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
        className={`flex gap-2 items-center cursor-pointer text-[11px] tracking-[.12em] uppercase border px-3.5 py-[7px] transition-colors duration-150 ${
          open ? 'border-fg' : 'border-[var(--rule)] hover:border-fg'
        }`}
      >
        <span className="opacity-45">{label}</span>
        <span className="font-medium">{current?.l}</span>
        <span className={`text-[8px] opacity-45 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 bg-bg border border-fg min-w-[200px] z-10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
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

function VoyageurCrown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 7l4.5 3L12 4l4.5 6L21 7l-1.6 11H4.6L3 7z" />
    </svg>
  );
}

const SKELETON_RATIOS = [
  'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[1/1]', 'aspect-[5/6]', 'aspect-[4/5]',
  'aspect-[3/4]', 'aspect-[1/1]', 'aspect-[4/5]', 'aspect-[5/6]',
];

function SkeletonGrid() {
  return (
    <div className="gap-6 columns-1 md:columns-2 lg:columns-3" aria-hidden="true">
      {SKELETON_RATIOS.map((r, i) => (
        <div key={i} className="break-inside-avoid mb-8 animate-pulse motion-reduce:animate-none">
          <div className={`w-full ${r} bg-tile`} />
          <div className="mt-3 h-3 w-2/3 bg-tile" />
          <div className="mt-2 h-2.5 w-1/3 bg-tile" />
        </div>
      ))}
    </div>
  );
}

export default function ExplorePage() {
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
      const { data } = await supabase
        .from('photos')
        .select('id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, description, users:users!photos_photographer_id_fkey(username, display_name, avatar_url, is_customer)');

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
            photographerName: p.users?.display_name || p.users?.username || 'Unknown',
            photographerAvatar: p.users?.avatar_url || '',
            isVoyageur: Boolean(p.users?.is_customer),
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
            pulse: p.pulse != null ? Number(p.pulse) : 0,
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

        // Filtering picks (mocked as empty array for now since no db column yet)
        if (showPicksOnly) {
          mapped = mapped.filter((p) => p.picks.length > 0);
        }

        setPhotos(mapped);
      }
      setIsLoading(false);
    };

    fetchPhotos();
  }, [sort, timeRange, showPicksOnly]);

  return (
    <>
      <div className="md:hidden">
        <MobileExplore dbPhotos={photos} />
      </div>
    <div className="page-fade hidden md:block">
      {/* ── Cinematic Hero Header ── */}
      <section className="relative overflow-hidden bg-black h-[42vh] min-h-[340px] max-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos.length > 0 ? photos[0].src : 'https://ranking.gography.net/cover-of-the-week.jpg'}
          alt="Explore"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.32)_0%,rgba(0,0,0,.06)_38%,rgba(0,0,0,.74)_100%)]" />

        {/* content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="wrap pb-10 md:pb-16">
            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/75">Season 01</span>
              <span className="h-px w-10 bg-white/30" />
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/55 tabular-nums">{photos.length} frames</span>
            </div>
            {/* title */}
            <h1 className="text-white font-light text-[clamp(48px,9vw,104px)] leading-[.9] tracking-[-.04em] m-0">
              Explore
            </h1>
          </div>
        </div>
      </section>

      {/* ── Category Tabs + Filter Bar ── */}
      <section className="sticky top-0 z-30 bg-[var(--bg)] border-b border-[var(--rule)]">
        <div className="wrap">
          {/* Category Tabs */}
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const active = t.id === null;
              if (t.gold) {
                return (
                  <button
                    key="voyageurs"
                    onClick={() => router.push('/explore/voyageurs')}
                    className="group relative py-[18px] px-5 cursor-pointer"
                    aria-label="Travellers"
                  >
                    <span className="inline-flex items-center gap-1.5 bg-gold text-black px-3 py-[6px] text-[11px] tracking-[.16em] uppercase font-semibold transition-[filter] duration-150 group-hover:brightness-[1.06]">
                      <VoyageurCrown />
                      {t.label}
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={t.id ?? 'all'}
                  onClick={() => router.push(t.id ? `/explore/${t.id}` : '/explore')}
                  className={`
                    relative py-[18px] px-5 text-[12px] tracking-[.16em] uppercase cursor-pointer font-medium
                    transition-all duration-200
                    ${active
                      ? 'opacity-100'
                      : 'opacity-40 hover:opacity-70'
                    }
                  `}
                >
                  {t.label}
                  {/* active indicator */}
                  {active && (
                    <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-[var(--fg)]" />
                  )}
                </button>
              );
            })}

            {/* right-side metadata */}
            <div className="ml-auto hidden md:flex items-center gap-6">
              <div className="mono text-[10px] tracking-[.14em] uppercase opacity-40">
                Sorted by {sort} · {timeRange}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 py-[14px] border-t border-[var(--rule)]">
            {/* Sort — segmented control */}
            <div className="flex items-center gap-3">
              <span className="mono text-[10px] tracking-[.22em] uppercase opacity-40">Sort</span>
              <div className="flex items-center border border-[var(--rule)]">
                {SORT_OPTIONS.map((o, i) => {
                  const on = sort === o.v;
                  return (
                    <button
                      key={o.v}
                      onClick={() => setSort(o.v)}
                      className={`px-3.5 py-[7px] text-[11px] tracking-[.12em] uppercase transition-colors duration-150 ${
                        i > 0 ? 'border-l border-[var(--rule)]' : ''
                      } ${on ? 'bg-fg text-bg' : 'opacity-55 hover:opacity-100'}`}
                    >
                      {o.short}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time — dropdown pill */}
            <FilterDropdown
              label="Time"
              value={timeRange}
              options={TIME_OPTIONS as unknown as { v: string; l: string }[]}
              onChange={(v) => setTimeRange(v as TimeRange)}
            />

            {/* Picks toggle */}
            <label
              className={`flex items-center gap-2 cursor-pointer text-[11px] tracking-[.12em] uppercase px-3.5 py-[7px] border transition-colors duration-150 ${
                showPicksOnly
                  ? 'bg-fg text-bg border-fg'
                  : 'border-[var(--rule)] opacity-60 hover:opacity-100 hover:border-fg'
              }`}
            >
              <input
                type="checkbox"
                checked={showPicksOnly}
                onChange={(e) => setShowPicksOnly(e.target.checked)}
                className="sr-only"
              />
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8.5L6 12.5L14 3.5" />
              </svg>
              Picks only
            </label>

            {/* keyboard hint */}
            <div className="ml-auto mono text-[10px] opacity-35 hidden md:flex items-center gap-1">
              <kbd className="border border-[var(--rule)] px-[5px] py-[1px] rounded-sm text-[9px]">J</kbd>
              <kbd className="border border-[var(--rule)] px-[5px] py-[1px] rounded-sm text-[9px]">K</kbd>
              <span className="ml-1">navigate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-10 md:py-14 pb-20">
        <div className="wrap">
          {/* Result bar */}
          {!isLoading && photos.length > 0 && (
            <div className="flex items-baseline justify-between border-b border-rule pb-4 mb-10">
              <div className="flex items-baseline gap-3">
                <span className="mono text-[12px] tabular-nums tracking-[.1em]">
                  {String(photos.length).padStart(3, '0')}
                </span>
                <span className="caps opacity-55">Frames</span>
              </div>
              <div className="mono text-[10px] tracking-[.16em] uppercase opacity-45">
                {sort} · {timeRange}{showPicksOnly ? ' · picks' : ''}
              </div>
            </div>
          )}

          {isLoading ? (
            <SkeletonGrid />
          ) : photos.length === 0 ? (
            <EmptyState />
          ) : (
            <RealtimePhotoGrid photos={photos} cols={3} showRank={sort === 'pulse'} showLike liveSort={sort === 'pulse'} />
          )}
        </div>
      </section>

      {/* End of results marker */}
      {!isLoading && photos.length > 0 && (
        <section className="pb-24">
          <div className="wrap">
            <div className="flex items-center justify-center gap-4 text-fg-faint">
              <span className="h-px w-16 bg-rule" />
              <span className="mono text-[10px] tracking-[.24em] uppercase tabular-nums">
                End · {photos.length} frames
              </span>
              <span className="h-px w-16 bg-rule" />
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
    </>
  );
}
