'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Photo } from '@/lib/types';
import type { SortKey } from '@/lib/data';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { MobileExplore } from '@/components/mobile/MobileExplore';

// ===== Explore page (/explore) =====
// Masonry grid + filters (sort, time range, picks only)

const TIME_OPTIONS = [
  { v: 'day', l: '24 hours' },
  { v: 'week', l: 'This week' },
  { v: 'month', l: 'This month' },
  { v: 'season', l: 'Spring 2026' },
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
  { id: 'voyageurs', label: 'Voyageurs', gold: true },
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
        .select('id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, description, users:users!photos_photographer_id_fkey(username, is_customer)');

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
      <section className="relative overflow-hidden bg-black" style={{ height: '42vh', minHeight: 340, maxHeight: 520 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos.length > 0 ? photos[0].src : 'https://ranking.gography.net/cover-of-the-week.jpg'}
          alt="Explore"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.25)_0%,rgba(0,0,0,.1)_30%,rgba(0,0,0,.55)_100%)]" />

        {/* content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="wrap pb-10 md:pb-14">
            {/* eyebrow */}
            <div className="mono text-[10px] tracking-[.28em] uppercase text-white/60 mb-4">
              Explore · {photos.length * 7} photos
            </div>
            {/* title */}
            <h1 className="text-white font-light text-[clamp(40px,8vw,88px)] leading-[.92] tracking-[-.035em] m-0">
              Explore
            </h1>
            <p className="th text-white/70 text-[15px] leading-[1.6] mt-4 mb-0 max-w-[440px]">
              เลือกชมภาพถ่ายทั้งหมด — กรองตามหมวด เวลา และอันดับ
            </p>
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
              return (
                <button
                  key={t.id ?? 'all'}
                  onClick={() => router.push(t.id ? `/explore/${t.id}` : '/explore')}
                  className={`
                    relative py-[18px] px-5 text-[12px] tracking-[.16em] uppercase cursor-pointer font-medium
                    transition-all duration-200
                    ${t.gold
                      ? 'text-gold opacity-100 hover:opacity-80'
                      : active
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
