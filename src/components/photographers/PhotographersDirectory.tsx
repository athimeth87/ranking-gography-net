'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPhotographers, getPhotos } from '@/lib/data';
import type { Photographer } from '@/lib/types';
import { computeRankMasters } from '@/lib/ranking-system';
import { PhotographerCardEditorial } from './PhotographerCardEditorial';

type FilterValue = 'all' | 'voyageurs' | 'ambassadors' | 'general';
type SortValue = 'featured' | 'followers' | 'photos' | 'newest';

const PAGE_SIZE = 12;
const VALID_FILTERS: FilterValue[] = ['all', 'voyageurs', 'ambassadors', 'general'];
const VALID_SORTS: SortValue[] = ['featured', 'followers', 'photos', 'newest'];

const SORT_OPTIONS: { v: SortValue; l: string }[] = [
  { v: 'featured', l: 'Featured' },
  { v: 'followers', l: 'Most followers' },
  { v: 'photos', l: 'Most photos' },
  { v: 'newest', l: 'Newest joined' },
];

interface PhotographersDirectoryProps {
  initialFilter?: FilterValue;
}

export function PhotographersDirectory({ initialFilter = 'all' }: PhotographersDirectoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allPhotographers, setAllPhotographers] = useState<Photographer[]>([]);
  const [previewsByUser, setPreviewsByUser] = useState<Record<string, string[]>>({});
  const [followingByUser, setFollowingByUser] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // --- state derived from the URL (shareable / restorable) ---
  const filterParam = searchParams.get('filter');
  const filter: FilterValue = VALID_FILTERS.includes(filterParam as FilterValue)
    ? (filterParam as FilterValue)
    : initialFilter;
  const sortParam = searchParams.get('sort');
  const sort: SortValue = VALID_SORTS.includes(sortParam as SortValue)
    ? (sortParam as SortValue)
    : 'featured';
  const urlQ = searchParams.get('q') ?? '';
  const shown = Math.max(PAGE_SIZE, Number(searchParams.get('shown')) || PAGE_SIZE);

  // search box is locally controlled for responsiveness, debounced into the URL
  const [qInput, setQInput] = useState(urlQ);
  useEffect(() => {
    setQInput(urlQ);
  }, [urlQ]);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>, resetShown = false) => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '') sp.delete(k);
        else sp.set(k, String(v));
      });
      if (resetShown) sp.delete('shown');
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    if (qInput === urlQ) return;
    const t = setTimeout(() => updateParams({ q: qInput.trim() || null }, true), 300);
    return () => clearTimeout(t);
  }, [qInput, urlQ, updateParams]);

  // --- data load (Supabase with mock-data fallback) ---
  useEffect(() => {
    let cancelled = false;

    const loadFallback = () => {
      const photos = getPhotos();
      const rankMasters = computeRankMasters(photos);
      const ppl = getPhotographers().map((p) => ({
        ...p,
        isRankMaster: rankMasters.has(p.username),
      }));
      const scored: Record<string, { src: string; score: number }[]> = {};
      photos.forEach((ph) => {
        if (!ph.by || !ph.src) return;
        (scored[ph.by] ||= []).push({ src: ph.src, score: ph.pulse ?? 0 });
      });
      const previews = topPreviews(scored);
      if (!cancelled) {
        setAllPhotographers(ppl);
        setPreviewsByUser(previews);
        setFollowingByUser({});
        setLoading(false);
      }
    };

    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        loadFallback();
        return;
      }
      try {
        const [{ data: usersData }, { data: photosData }, { data: followsData }] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('photos').select('*'),
          supabase.from('follows').select('*'),
        ]);
        const users = usersData || [];
        const photos = photosData || [];
        const follows = followsData || [];
        if (users.length === 0) {
          loadFallback();
          return;
        }
        const rankMasters = computeRankMasters(photos);
        const usernameById: Record<string, string> = {};
        const ppl: Photographer[] = users.map((u) => {
          const username = u.username || u.display_name || u.id;
          usernameById[u.id] = username;
          return {
            id: u.id,
            username,
            name: u.display_name || u.username || 'User',
            loc: u.location || '',
            bio: u.bio || '',
            avatar: u.avatar_url || '',
            cover: u.cover_url || '',
            followers: follows.filter((f) => f.following_id === u.id).length,
            photos: photos.filter((p) => p.photographer_id === u.id).length,
            isAmbassador: u.is_ambassador || false,
            isCustomer: u.is_customer || false,
            isRankMaster: rankMasters.has(username),
            customerTrips: [],
            joined: u.created_at || '',
            cameras: [],
          };
        });
        const scored: Record<string, { src: string; score: number }[]> = {};
        photos.forEach((p) => {
          const uname = usernameById[p.photographer_id];
          if (!uname || !p.storage_url) return;
          const score = (p.likes_count || 0) + (p.favorites_count || 0) * 2;
          (scored[uname] ||= []).push({ src: p.storage_url, score });
        });
        const previews = topPreviews(scored);
        const followingCounts: Record<string, number> = {};
        follows.forEach((f) => {
          const uname = usernameById[f.follower_id];
          if (uname) followingCounts[uname] = (followingCounts[uname] || 0) + 1;
        });
        if (!cancelled) {
          setAllPhotographers(ppl);
          setPreviewsByUser(previews);
          setFollowingByUser(followingCounts);
          setLoading(false);
        }
      } catch {
        loadFallback();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: allPhotographers.length,
      voyageurs: allPhotographers.filter((p) => p.isCustomer).length,
      ambassadors: allPhotographers.filter((p) => p.isAmbassador).length,
      general: allPhotographers.filter((p) => !p.isCustomer && !p.isAmbassador).length,
    }),
    [allPhotographers],
  );

  const processed = useMemo(() => {
    let list = allPhotographers.slice();
    if (filter === 'voyageurs') list = list.filter((p) => p.isCustomer);
    else if (filter === 'ambassadors') list = list.filter((p) => p.isAmbassador);
    else if (filter === 'general') list = list.filter((p) => !p.isCustomer && !p.isAmbassador);

    const term = qInput.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          (p.loc || '').toLowerCase().includes(term),
      );
    }

    if (sort === 'followers') list.sort((a, b) => b.followers - a.followers);
    else if (sort === 'photos') list.sort((a, b) => b.photos - a.photos);
    else if (sort === 'newest') list.sort((a, b) => (b.joined || '').localeCompare(a.joined || ''));
    else {
      const rank = (p: Photographer) =>
        p.isAmbassador ? 0 : p.isCustomer ? 1 : p.isRankMaster ? 2 : 3;
      list.sort((a, b) => rank(a) - rank(b) || b.followers - a.followers);
    }
    return list;
  }, [allPhotographers, filter, sort, qInput]);

  const visible = processed.slice(0, shown);
  const hasMore = shown < processed.length;
  const remaining = processed.length - shown;

  const chips: { v: FilterValue; l: string; n: number }[] = [
    { v: 'all', l: 'All', n: counts.all },
    { v: 'voyageurs', l: 'Travellers', n: counts.voyageurs },
    { v: 'ambassadors', l: 'Ambassadors', n: counts.ambassadors },
    { v: 'general', l: 'Photographers', n: counts.general },
  ];

  return (
    <>
      {/* Sticky filter / search / sort bar */}
      <section className="sticky top-[48px] z-40 border-y border-rule bg-bg md:top-[60px]">
        <div className="wrap flex flex-col gap-4 py-4 md:py-5">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-fg-faint"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              aria-label="Search photographers"
              placeholder="Search by name, @username, or location"
              className="w-full border-b border-rule bg-transparent py-2 pl-7 pr-8 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg"
            />
            {qInput && (
              <button
                type="button"
                onClick={() => setQInput('')}
                aria-label="Clear search"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-fg-faint transition-colors hover:text-fg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter chips + sort */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {chips.map((f) => {
                const active = filter === f.v;
                return (
                  <button
                    key={f.v}
                    type="button"
                    onClick={() => updateParams({ filter: f.v === initialFilter ? null : f.v }, true)}
                    aria-pressed={active}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border px-[16px] py-[9px] text-[11px] font-medium uppercase tracking-[.14em] transition-colors ${
                      active ? 'border-fg bg-fg text-bg' : 'border-rule bg-transparent text-fg hover:border-rule-strong'
                    }`}
                  >
                    <span>{f.l}</span>
                    <span className="mono opacity-55">{f.n}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="caps text-fg-soft">Sort</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) =>
                    updateParams({ sort: e.target.value === 'featured' ? null : e.target.value }, true)
                  }
                  aria-label="Sort photographers"
                  className="cursor-pointer appearance-none border border-rule bg-transparent py-2 pl-3 pr-9 text-[12px] uppercase tracking-[.12em] text-fg transition-colors hover:border-rule-strong focus:border-fg focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-soft"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-[56px] pb-[96px]">
        <div className="wrap">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : processed.length === 0 ? (
            <div className="py-[120px] text-center">
              <div className="th text-fg-soft">
                {qInput.trim()
                  ? `ไม่พบช่างภาพที่ตรงกับ “${qInput.trim()}”`
                  : 'ไม่พบช่างภาพในตัวกรองนี้'}
              </div>
              {qInput.trim() && (
                <button
                  type="button"
                  onClick={() => setQInput('')}
                  className="caps mt-5 cursor-pointer border-b border-rule pb-[4px] text-fg-soft transition-colors hover:text-fg"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="pgrid-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {visible.map((p, i) => (
                  <PhotographerCardEditorial
                    key={p.username}
                    photographer={p}
                    previews={previewsByUser[p.username]}
                    following={followingByUser[p.username] ?? 0}
                    index={i}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-14 flex justify-center">
                  <button
                    type="button"
                    onClick={() => updateParams({ shown: shown + PAGE_SIZE })}
                    className="btn btn-ghost"
                  >
                    Load more
                    <span className="mono opacity-55">+{Math.min(PAGE_SIZE, remaining)}</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Count footer */}
          {!loading && processed.length > 0 && (
            <div className="mono mt-14 flex items-center justify-between border-t border-rule pt-6">
              <span className="text-[11px] uppercase tracking-[.14em] opacity-55">
                Showing {visible.length} of {processed.length} photographers
              </span>
              <button
                type="button"
                onClick={() => router.push('/explore')}
                className="caps cursor-pointer border-b border-rule pb-[4px] opacity-65 transition-opacity hover:opacity-100"
              >
                Browse photos instead →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// Highest-scoring photos first, so previews[0] is the best shot (used as cover fallback).
function topPreviews(
  scored: Record<string, { src: string; score: number }[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  Object.entries(scored).forEach(([uname, arr]) => {
    out[uname] = arr
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.src);
  });
  return out;
}

function SkeletonCard() {
  return (
    <div className="border border-rule bg-bg">
      <div className="skel h-[150px] w-full sm:h-[160px]" />
      <div className="flex flex-col items-center px-5 pb-6 text-center">
        <div className="skel -mt-[34px] mb-3 h-[68px] w-[68px] rounded-full border-[3px] border-bg" />
        <div className="skel h-4 w-32" />
        <div className="skel mt-2 h-3 w-20" />
        <div className="skel mt-3 h-3 w-40" />
        <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-rule pt-4">
          <div className="skel mx-auto h-7 w-12" />
          <div className="skel mx-auto h-7 w-12" />
          <div className="skel mx-auto h-7 w-12" />
        </div>
      </div>
    </div>
  );
}
