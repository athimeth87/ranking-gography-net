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

type FilterValue = 'all' | 'rankmaster' | 'voyageurs' | 'ambassadors';
type SortValue = 'pulse' | 'followers' | 'photos' | 'newest';

export default function PhotographersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allPhotographers, setAllPhotographers] = useState<Photographer[]>([]);
  const [allPhotos, setAllPhotos] = useState<{ by: string; src: string }[]>([]);

  const [filter, setFilter] = useState<FilterValue>('all');
  const [sort, setSort] = useState<SortValue>('pulse');
  const [search, setSearch] = useState('');

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
      const { data: photosData } = await supabase.from('photos').select('*').order('pulse', { ascending: false }).limit(200); // Only fetch some photos for cover previews
      const { data: followsData } = await supabase.from('follows').select('*');
      const follows = followsData || [];
      const { data: seasonsData } = await supabase.from('seasons').select('id, status');
      
      const rankMasters = computeRankMasters(photosData || []);
      const liveSeasonId = seasonsData?.find(s => s.status === 'active' || s.status === 'live')?.id || null;
      
      // V5 HOF scoring via Database RPC! Super fast and accurate.
      const { data: rankData } = await supabase.rpc('get_v5_hall_of_fame', { p_season_id: liveSeasonId });
      const hofResults = rankData || [];

      const mappedPhotographers: Photographer[] = users.map(u => {
        const uPhotos = (photosData || []).filter(p => p.photographer_id === u.id);
        const hofRes = hofResults.find(r => r.photographer_id === u.id);
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
          socialTwitter: u.social_twitter || '',
          socialInstagram: u.social_instagram || '',
          socialFacebook: u.social_facebook || '',
          website: u.portfolio_url || '',
          hofScore: hofRes?.hof_score ?? null, // From the DB RPC
          avgPulse: uPhotos.length > 0 ? uPhotos.reduce((sum, p) => sum + (p.pulse || 0), 0) / uPhotos.length : 0, // True average of all photos
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
  const q = search.toLowerCase().trim();
  let list: Photographer[] = allPhotographers.slice();
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
  );
  if (filter === 'voyageurs')   list = list.filter(p => p.isCustomer);
  if (filter === 'ambassadors') list = list.filter(p => p.isAmbassador);
  if (filter === 'rankmaster')  list = list.filter(p => p.isRankMaster);

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
    { v: 'all',          l: 'All',            n: allPhotographers.length },
    { v: 'rankmaster',   l: 'Rank Master ♛',  n: allPhotographers.filter(p => p.isRankMaster).length },
    { v: 'voyageurs',    l: 'Travellers ◆',   n: allPhotographers.filter(p => p.isCustomer).length },
    { v: 'ambassadors',  l: 'Ambassadors ★',  n: allPhotographers.filter(p => p.isAmbassador).length },
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
      {/* ── Cinematic Hero Header ── */}
      <section className="relative overflow-hidden bg-black h-[42vh] min-h-[340px] max-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={allPhotos.length > 0 ? allPhotos[2]?.src || allPhotos[0]?.src : 'https://ranking.gography.net/cover-of-the-week.jpg'}
          alt="Directory"
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
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/75">Directory</span>
              <span className="h-px w-10 bg-white/30" />
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/55 tabular-nums">{allPhotographers.length} photographers</span>
            </div>
            {/* title */}
            <h1 className="text-white font-light text-[clamp(48px,9vw,104px)] leading-[.9] tracking-[-.04em] m-0">
              All Photographers
            </h1>
            <p className="th text-white/75 text-[15px] leading-[1.6] mt-5 mb-0 max-w-[460px]">
              ค้นพบช่างภาพและนักเดินทางที่ร่วมส่งภาพบนเวที GOGRAPHY Ranking
            </p>

            {/* Search */}
            <div className="relative w-full max-w-[420px] mt-8">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search photographers, name or username…"
                className="w-full bg-white/10 backdrop-blur-sm border border-white/25 text-white placeholder:text-white/40 px-4 py-3 pr-10 text-[13px] outline-none focus:border-white/60 transition-colors"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Filter / Sort bar */}
      <section className="border-b border-white/5 sticky top-[60px] z-40 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-10 2xl:px-16">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4 md:gap-6">
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
            <div className="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto shrink-0 pt-2 border-t border-white/5 lg:border-t-0 lg:pt-0">
              <span className="caps opacity-55">Sort By</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="px-4 py-2 border border-rule bg-[#111] text-fg text-[12px] tracking-[.12em] uppercase cursor-pointer outline-none focus:border-white/40"
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

      {/* Main Content Layout */}
      <section className="py-[40px] pb-[96px]">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-10 2xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12">

            {/* Photographer grid */}
            <div className="lg:col-span-8 xl:col-span-9">
              {loading ? (
                <div className="py-[120px] text-center opacity-40 mono text-[12px] uppercase tracking-widest">
                  Loading...
                </div>
              ) : list.length === 0 ? (
                <div className="py-[120px] text-center text-fg-soft th">ไม่พบช่างภาพในตัวกรองนี้</div>
              ) : (
                <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <aside className="block mt-12 lg:mt-0 lg:col-span-4 xl:col-span-3">
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
