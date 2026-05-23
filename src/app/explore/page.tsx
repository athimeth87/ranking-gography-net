'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPhotos } from '@/lib/data';
import type { Photo } from '@/lib/types';
import type { SortKey } from '@/lib/data';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';

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

export default function ExplorePage() {
  const [sort, setSort] = useState<SortKey>('pulse');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [showPicksOnly, setShowPicksOnly] = useState(false);
  const router = useRouter();

  let photos: Photo[] = getPhotos({ sort });
  if (showPicksOnly) photos = photos.filter((p: Photo) => p.picks.length > 0);

  return (
    <div className="page-fade">
      <PageCover
        photoId="p013"
        eyebrow="Explore"
        title="Every photo"
        subtitle="เลือกชมภาพถ่ายทั้งหมด — กรองตามหมวด เวลา และอันดับ"
      />
      {/* Header */}
      <section className="pt-[64px] pb-[40px]">
        <div className="wrap">
          <div className="flex justify-between items-baseline pb-8">
            <div>
              <div className="caps opacity-55 mb-[14px]">Explore</div>
              <h1
                className="display-hero text-[clamp(48px,5vw,72px)] m-0 tracking-[-.025em]"
              >
                Every photo
              </h1>
            </div>
            <div className="mono text-[11px] opacity-55 text-right leading-[1.7]">
              {photos.length * 7} PHOTOS<br />
              SORTED BY {sort.toUpperCase()}<br />
              {timeRange.toUpperCase()}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-7 border-b border-rule pb-0">
            {TABS.map((t) => {
              const active = t.id === null;
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
          <div className="flex justify-between items-center py-5 border-b border-rule">
            <div className="flex gap-8 items-center">
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
            <div className="mono text-[11px] opacity-55">
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
          {photos.length === 0 ? (
            <EmptyState />
          ) : (
            <PhotoGrid photos={photos} cols={3} showRank={sort === 'pulse'} />
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
  );
}
