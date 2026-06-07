'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPhotographers, getPhotos } from '@/lib/data';
import type { Photographer } from '@/lib/types';
import { PhotographerCard } from '@/components/home/PhotographerCard';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';
import { computeRankMasters } from '@/lib/ranking-system';
import { rankPhotographers } from '@/lib/pulse-engine-v4';

// ===== Photographers directory — /photographers =====

type FilterValue = 'all' | 'photographers' | 'voyageurs' | 'ambassadors';
type SortValue = 'pulse' | 'followers' | 'photos' | 'newest';

export default function PhotographersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allPhotographers, setAllPhotographers] = useState<Photographer[]>([]);
  const [allPhotos, setAllPhotos] = useState<{ by: string; src: string }[]>([]);

  const [filter, setFilter] = useState<FilterValue>('all');
  const [sort, setSort] = useState<SortValue>('pulse');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setAllPhotographers(getPhotographers());
        setAllPhotos(getPhotos().map(p => ({ by: p.by, src: p.src })));
        setLoading(false);
        return;
      }

      const { data: usersData } = await supabase.from('users').select('*');
      const users = usersData || [];
      const { data: photosData } = await supabase.from('photos').select('*');
      const { data: followsData } = await supabase.from('follows').select('*');
      const follows = followsData || [];
      const rankMasters = computeRankMasters(photosData || []);

      // V5 HOF scoring
      const inputList = users.map(u => {
        const uPhotos = (photosData || []).filter(p => p.photographer_id === u.id);
        const ageDays = Math.floor((Date.now() - new Date(u.created_at || new Date()).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: u.id,
          photoScores: uPhotos.map(p => p.pulse || p.engagement || 0),
          accountAgeDays: ageDays,
        };
      });
      const hofResults = rankPhotographers(inputList);

      const mappedPhotographers: Photographer[] = users.map(u => {
        const uPhotos = (photosData || []).filter(p => p.photographer_id === u.id);
        const hofRes = hofResults.find(r => r.item.id === u.id);
        const cats = new Set<string>();
        uPhotos.forEach(p => { if (p.category) cats.add(p.category); });

        return {
          id: u.id,
          username: u.username || u.display_name || u.id,
          name: u.display_name || u.username || 'User',
          loc: u.location || '',
          bio: u.bio || '',
          avatar: u.avatar_url || '',
          cover: u.cover_url || '',
          followers: follows.filter(f => f.following_id === u.id).length,
          photos: uPhotos.length,
          totalLikes: uPhotos.reduce((s, p) => s + (p.likes_count || 0), 0),
          totalViews: uPhotos.reduce((s, p) => s + (p.impressions_count || 0), 0),
          totalSaves: uPhotos.reduce((s, p) => s + (p.favorites_count || 0), 0),
          categories: Array.from(cats).slice(0, 3),
          hofScore: hofRes?.hofScore ?? null,
          avgPulse: hofRes?.avgScore || 0,
          isAmbassador: u.is_ambassador || false,
          isCustomer: u.is_customer || false,
          isRankMaster: rankMasters.has(u.username || u.display_name || u.id),
          customerTrips: [],
          joined: u.created_at || '',
          cameras: [],
        };
      });

      const mappedPhotos = (photosData || []).map(p => {
        const owner = users.find(u => u.id === p.photographer_id);
        return { by: owner?.username || owner?.display_name || 'unknown', src: p.storage_url };
      });

      if (mappedPhotographers.length > 0) {
        setAllPhotographers(mappedPhotographers);
        setAllPhotos(mappedPhotos);
      } else {
        setAllPhotographers(getPhotographers());
        setAllPhotos(getPhotos().map(p => ({ by: p.by, src: p.src })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter
  let list: Photographer[] = allPhotographers.slice();
  if (filter === 'voyageurs')    list = list.filter(p => p.isCustomer);
  if (filter === 'ambassadors')  list = list.filter(p => p.isAmbassador);
  if (filter === 'photographers') list = list.filter(p => !p.isCustomer && !p.isAmbassador);

  // Sort
  if (sort === 'pulse') {
    list = [...list].sort((a, b) => {
      if (a.hofScore != null && b.hofScore != null) return b.hofScore - a.hofScore;
      if (a.hofScore != null) return -1;
      if (b.hofScore != null) return 1;
      if ((a.avgPulse || 0) !== (b.avgPulse || 0)) return (b.avgPulse || 0) - (a.avgPulse || 0);
      return (b.totalLikes || 0) - (a.totalLikes || 0);
    });
  } else if (sort === 'followers') list = [...list].sort((a, b) => b.followers - a.followers);
  else if (sort === 'photos')    list = [...list].sort((a, b) => b.photos - a.photos);
  else if (sort === 'newest')    list = [...list].sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());

  const filterChips: { v: FilterValue; l: string; n: number }[] = [
    { v: 'all',           l: 'All',           n: allPhotographers.length },
    { v: 'photographers', l: 'Photographers',  n: allPhotographers.filter(p => !p.isCustomer && !p.isAmbassador).length },
    { v: 'voyageurs',     l: 'Travellers ◆',   n: allPhotographers.filter(p => p.isCustomer).length },
    { v: 'ambassadors',   l: 'Ambassadors ★',  n: allPhotographers.filter(p => p.isAmbassador).length },
  ];

  const top10 = [...allPhotographers]
    .sort((a, b) => {
      if (a.hofScore != null && b.hofScore != null) return b.hofScore - a.hofScore;
      if (a.hofScore != null) return -1;
      if (b.hofScore != null) return 1;
      return b.followers - a.followers;
    })
    .slice(0, 10);

  return (
    <div className="page-fade">
      <PageCover
        photoId="p018"
        eyebrow="Directory"
        title="All Photographers"
        subtitle="ค้นพบช่างภาพและนักเดินทางที่ร่วมส่งภาพบนเวที GOGRAPHY Ranking"
      />

      {/* Filter / Sort bar */}
      <section className="py-[32px] border-t border-rule border-b border-rule sticky top-[60px] z-40 bg-bg/95 backdrop-blur-sm">
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
                      active ? 'border-fg bg-fg text-bg' : 'border-rule bg-transparent text-fg'
                    }`}
                  >
                    <span>{f.l}</span>
                    <span className="opacity-55 mono">{f.n}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="caps opacity-55">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="px-3 py-2 border border-rule bg-transparent text-fg text-[12px] tracking-[.12em] uppercase cursor-pointer"
              >
                <option value="pulse">Pulse Rank</option>
                <option value="followers">Most followers</option>
                <option value="photos">Most photos</option>
                <option value="newest">Newest joined</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-[56px] pb-[96px]">
        <div className="wrap">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-10 xl:gap-12 items-start">

            {/* Photographer grid */}
            <div>
              {loading ? (
                <div className="py-[120px] text-center opacity-40 mono text-[12px] uppercase tracking-widest">
                  Loading...
                </div>
              ) : list.length === 0 ? (
                <div className="py-[120px] text-center text-fg-soft th">ไม่พบช่างภาพในตัวกรองนี้</div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {list.map((p, i) => (
                    <PhotographerCard
                      key={p.username}
                      photographer={p}
                      variant={p.isCustomer ? 'voyageur' : 'general'}
                      photos={allPhotos}
                      rank={i + 1}
                    />
                  ))}
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-rule mono text-[11px] opacity-55 tracking-[.14em]">
                SHOWING {list.length} OF {allPhotographers.length} PHOTOGRAPHERS
              </div>
            </div>

            {/* Top 10 sidebar */}
            <aside className="hidden xl:block">
              <div className="border border-rule p-6">
                <div className="caps opacity-55 mb-5">Top 10 — Pulse Rank</div>
                <div className="flex flex-col gap-0">
                  {top10.map((p, i) => (
                    <div
                      key={p.username}
                      className="flex items-center gap-3 py-3 border-b border-rule last:border-0 cursor-pointer group"
                      onClick={() => router.push(`/photographer/${p.username}`)}
                    >
                      <span className={`mono text-[12px] w-5 shrink-0 ${i < 3 ? 'text-gold font-semibold' : 'opacity-35'}`}>
                        {i + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.username}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate group-hover:opacity-70 transition-opacity">
                          {p.name}
                        </div>
                        <div className="mono text-[10px] opacity-40 truncate">@{p.username}</div>
                      </div>
                      {p.hofScore != null && (
                        <span className="mono text-[11px] opacity-55 shrink-0">{p.hofScore.toFixed(0)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
