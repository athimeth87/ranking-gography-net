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

type FilterValue = 'all' | 'photographers' | 'voyageurs' | 'ambassadors';
type SortValue = 'featured' | 'followers' | 'photos' | 'newest';

export default function PhotographersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [sort, setSort] = useState<SortValue>('featured');

  const [allPhotographers, setAllPhotographers] = useState<Photographer[]>([]);
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setAllPhotographers(getPhotographers());
        setAllPhotos(getPhotos());
        setLoading(false);
        return;
      }

      const { data: usersData } = await supabase.from('users').select('*');
      const users = usersData || [];
      const { data: photosData } = await supabase.from('photos').select('*');
      const { data: followsData } = await supabase.from('follows').select('*');
      const follows = followsData || [];
      const rankMasters = computeRankMasters(photosData || []);

      const mappedPhotographers: Photographer[] = users.map(u => ({
        username: u.username || u.display_name || u.id,
        name: u.display_name || u.username || 'User',
        loc: u.location || '',
        bio: u.bio || '',
        avatar: u.avatar_url || '',
        cover: u.cover_url || '',
        followers: follows.filter(f => f.following_id === u.id).length,
        photos: (photosData || []).filter(p => p.photographer_id === u.id).length,
        isAmbassador: u.is_ambassador || false,
        isCustomer: u.is_customer || false,
        isRankMaster: rankMasters.has(u.username || u.display_name || u.id),
        customerTrips: [],
        joined: u.created_at || '',
        cameras: []
      }));

      const mappedPhotos = (photosData || []).map(p => {
        const owner = users.find(u => u.id === p.photographer_id);
        return {
          id: p.id,
          by: owner?.username || owner?.display_name || 'unknown',
          src: p.storage_url,
          avatarUrl: owner?.avatar_url
        };
      });

      if (mappedPhotographers.length > 0) {
        setAllPhotographers(mappedPhotographers);
        setAllPhotos(mappedPhotos);
      } else {
        setAllPhotographers(getPhotographers());
        setAllPhotos(getPhotos());
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  let list: Photographer[] = allPhotographers.slice();
  if (filter === 'voyageurs') list = list.filter(p => p.isCustomer);
  if (filter === 'ambassadors') list = list.filter(p => p.isAmbassador);
  if (filter === 'photographers') list = list.filter(p => !p.isCustomer && !p.isAmbassador);

  if (sort === 'followers') list = [...list].sort((a, b) => b.followers - a.followers);
  else if (sort === 'photos') list = [...list].sort((a, b) => b.photos - a.photos);
  else if (sort === 'newest') list = [...list].sort((a, b) => b.joined.localeCompare(a.joined));

  const filterChips = [
    { v: 'all' as FilterValue, l: 'ALL', n: allPhotographers.length },
    { v: 'photographers' as FilterValue, l: 'PHOTOGRAPHERS', n: allPhotographers.filter(p => !p.isCustomer && !p.isAmbassador).length },
    { v: 'voyageurs' as FilterValue, l: 'TRAVELLERS', n: allPhotographers.filter(p => p.isCustomer).length },
    { v: 'ambassadors' as FilterValue, l: 'AMBASSADORS', n: allPhotographers.filter(p => p.isAmbassador).length },
  ];

  const top10 = [...allPhotographers].sort((a, b) => b.followers - a.followers).slice(0, 10);

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      {/* Custom Hero */}
      <PageCover
        photoId="p018"
        eyebrow="Directory"
        title="All Photographers"
        subtitle="ค้นพบช่างภาพและนักเดินทางทั่วโลกผ่านภาพถ่ายที่เล่าเรื่องราวได้อย่างน่าประทับใจ"
        align="center"
        height="500px"
      >
        <div className="flex flex-col items-center w-full mt-6">
          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-10 md:gap-16 mb-8">
            <div className="flex flex-col items-center text-center">
              <span className="font-bold text-[22px]">802</span>
              <span className="text-[10px] tracking-widest uppercase text-white/50 mt-1">Photographers</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-bold text-[22px]">198</span>
              <span className="text-[10px] tracking-widest uppercase text-white/50 mt-1">Travellers</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-bold text-[22px]">23</span>
              <span className="text-[10px] tracking-widest uppercase text-white/50 mt-1">Ambassadors</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-bold text-[22px]">128</span>
              <span className="text-[10px] tracking-widest uppercase text-white/50 mt-1">Countries</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xl mx-auto">
            <input 
              type="text" 
              placeholder="Search photographers, countries, or keywords..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 pl-5 pr-12 text-[14px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-md transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 text-[16px] opacity-70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
          </div>
        </div>
      </PageCover>

      {/* Filter / Sort bar */}
      <section className="border-b border-white/5 sticky top-[60px] z-40 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-[1560px] mx-auto px-4 md:px-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4 gap-4">
            {/* Filter chips */}
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {filterChips.map((f) => {
                const active = filter === f.v;
                return (
                  <button
                    key={f.v}
                    onClick={() => setFilter(f.v)}
                    className="flex flex-col text-left group shrink-0"
                  >
                    <span className={`text-[11px] tracking-widest uppercase font-semibold flex items-center gap-1 ${active ? 'text-[#cda256]' : 'text-white/40 group-hover:text-white/70'}`}>
                      {f.l} {active && <span className="w-1.5 h-1.5 bg-[#cda256] rounded-full inline-block"></span>}
                    </span>
                    <span className={`text-[13px] mt-1 ${active ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}>{f.n.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Dropdowns */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40 ml-2">Sort by</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortValue)} className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white appearance-none outline-none focus:border-white/30 min-w-[120px]">
                  <option value="featured">Featured</option>
                  <option value="followers">Followers</option>
                  <option value="photos">Photos</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40 ml-2">Country</span>
                <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white appearance-none outline-none focus:border-white/30 min-w-[100px]">
                  <option>All</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40 ml-2">Category</span>
                <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white appearance-none outline-none focus:border-white/30 min-w-[100px]">
                  <option>All</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-white/40 ml-2">Followers</span>
                <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-[12px] text-white appearance-none outline-none focus:border-white/30 min-w-[100px]">
                  <option>All</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 self-end ml-2">
                <button className="border border-white/10 rounded-lg px-4 py-1.5 text-[12px] text-white hover:bg-white/5 flex items-center gap-2 h-[33px]">
                  <span className="opacity-50">⎈</span> Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="py-[40px] pb-[96px]">
        <div className="max-w-[1560px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
            
            {/* Left Grid (4 cols on XL) */}
            <div className="lg:col-span-3 xl:col-span-4">
              {loading ? (
                <div className="py-[120px] text-center text-white/40 text-[12px] uppercase tracking-widest">Loading...</div>
              ) : list.length === 0 ? (
                <div className="py-[120px] text-center text-white/40">ไม่พบช่างภาพในตัวกรองนี้</div>
              ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
              
              <div className="mt-12 flex justify-center">
                <button className="border border-white/10 rounded-full px-6 py-3 text-[13px] text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                  Load More Photographers <span className="text-[10px]">▼</span>
                </button>
              </div>
            </div>

            {/* Right Sidebar (1 col on XL) */}
            <div className="lg:col-span-1 xl:col-span-1 hidden lg:block space-y-10">
              
              {/* Top 10 Widget */}
              <div className="bg-[#111111] border border-white/5 rounded-[12px] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-[11px] uppercase tracking-widest font-semibold text-white/80">Top 10 This Week</h4>
                </div>
                
                <div className="flex flex-col gap-4">
                  {top10.map((p, i) => (
                    <div key={p.username} className="flex items-center justify-between group cursor-pointer" onClick={() => router.push(`/photographer/${p.username}`)}>
                      <div className="flex items-center gap-3">
                        <span className={`text-[12px] font-mono w-[16px] ${i < 3 ? 'text-[#cda256] font-bold' : 'text-white/40'}`}>{i + 1}</span>
                        <div className="relative">
                          <img src={p.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.username} className="w-8 h-8 rounded-full border border-white/10" alt={p.username} />
                          {i === 0 && <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#cda256] rounded-full border-[2px] border-[#111111]"></span>}
                        </div>
                        <span className="text-[12px] font-medium text-white/80 group-hover:text-white truncate max-w-[100px]">{p.name.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-mono text-white/70">{(p.followers * 1.5).toFixed(1)}K</span>
                        <span className="text-[#4ade80] text-[10px]">↑</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="mt-6 w-full border border-white/10 rounded-lg py-2.5 text-[11px] uppercase tracking-widest text-white/60 hover:bg-white/5 transition-colors">
                  View Full Ranking →
                </button>
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="max-w-[1560px] mx-auto px-4 md:px-10 pb-[60px]">
        <div className="bg-[#111111] border border-white/10 rounded-[12px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-[60px] h-[60px] border border-[#cda256] rounded-full flex items-center justify-center">
              <span className="text-[24px]">👑</span>
            </div>
            <div>
              <h3 className="text-[20px] font-serif mb-1">Join Our Global Community</h3>
              <p className="text-white/50 text-[13px]">แบ่งปันผลงานของคุณและเป็นส่วนหนึ่งของ GOGRAPHY Ranking</p>
            </div>
          </div>
          <button className="border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-colors text-[13px] font-medium flex items-center gap-2">
            Join Now <span>→</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 border-t border-white/10 pt-10">
          {[
            { t: 'Global Community', d: 'ชุมชนช่างภาพและนักเดินทางจากทั่วโลก' },
            { t: 'Fair Ranking System', d: 'ระบบจัดอันดับที่โปร่งใสและยุติธรรม' },
            { t: 'Inspire & Connect', d: 'สร้างแรงบันดาลใจและเชื่อมต่อกัน' },
            { t: 'Get Featured', d: 'โอกาสแสดงผลงานสู่สายตาชาวโลก' },
          ].map(f => (
            <div key={f.t} className="flex gap-3">
              <div className="flex flex-col">
                <h5 className="text-[13px] font-bold mb-1">{f.t}</h5>
                <p className="text-[11px] text-white/40 leading-relaxed max-w-[140px]">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
