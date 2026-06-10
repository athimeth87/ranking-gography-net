'use client';
import { notFound, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Photo } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { VoyageurMark, CrownIcon } from '@/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageCover } from '@/components/layout/PageCover';
import { useFollowState } from '@/hooks/useFollowState';
import { NextDropCard } from '@/components/photo/NextDropCard';
import { FollowListModal, type FollowTab } from '@/components/account/FollowListModal';
import { computePulse, type PickType } from '@/lib/pulse-engine';

import { computeRankMasters, getCashbackPercentage } from '@/lib/ranking-system';

// ===== Photographer public profile — /photographer/[username] =====

function mapPublicPhoto(p: any, username: string) {
  const likes = p.likes_count || 0;
  const favorites = p.favorites_count || 0;
  const comments = p.comments_count || 0;
  const pulse = p.pulse != null ? Number(p.pulse) : 0;
  return {
    id: p.id,
    slug: p.id,
    src: p.storage_url,
    title: p.title,
    by: username,
    cat: p.category || 'General',
    w: p.width || 4,
    h: p.height || 3,
    caption: p.description || '',
    exif: { camera: 'Unknown', lens: 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
    likes,
    likes24h: 0,
    comments,
    favorites,
    hours: 1,
    picks: [],
    date: p.uploaded_at,
    pulse,
    impressions: p.impressions_count || 0,
    rank: 0,
  };
}

interface ProfileStatProps { label: string; val: string | number; onClick?: () => void; }
function ProfileStat({ label, val, onClick }: ProfileStatProps) {
  const inner = (
    <>
      <div className="text-[28px] font-medium tracking-[-0.015em]">{val}</div>
      <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-1">{label}</div>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="text-left bg-transparent border-0 p-0 cursor-pointer hover:opacity-65 transition-opacity">
        {inner}
      </button>
    );
  }
  return <div>{inner}</div>;
}

function SocialIconRow({ p }: { p: any }) {
  if (!p.socialTwitter && !p.socialInstagram && !p.socialFacebook && !p.website) return null;
  return (
    <div className="flex items-center gap-3 mt-4">
      {p.socialTwitter && (
        <a href={p.socialTwitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full border border-black dark:border-white hover:opacity-70 transition-opacity text-black dark:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
        </a>
      )}
      {p.socialInstagram && (
        <a href={p.socialInstagram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full border border-black dark:border-white hover:opacity-70 transition-opacity text-black dark:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        </a>
      )}
      {p.socialFacebook && (
        <a href={p.socialFacebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full border border-black dark:border-white hover:opacity-70 transition-opacity text-black dark:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
        </a>
      )}
      {p.website && (
        <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full border border-black dark:border-white hover:opacity-70 transition-opacity text-black dark:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        </a>
      )}
    </div>
  );
}

function ProfileEmpty({ msg }: { msg: string }) {
  return <div className="py-[120px] text-center text-fg-soft th">{msg}</div>;
}

const MOBILE_TABS = [
  { id: 'photos' as const,    label: 'Photos' },
  { id: 'favorites' as const, label: 'Saved' },
  { id: 'about' as const,     label: 'About' },
];

const MOBILE_BTN_SOLID = 'flex-1 inline-flex items-center justify-center min-h-[44px] px-4 text-[13px] font-semibold tracking-[.03em] uppercase border border-fg bg-fg text-bg cursor-pointer';
const MOBILE_BTN_GHOST = 'flex-1 inline-flex items-center justify-center min-h-[44px] px-4 text-[13px] font-semibold tracking-[.03em] uppercase border border-black/15 dark:border-white/25 bg-transparent text-fg cursor-pointer';

export function PhotographerClient({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [photographer, setPhotographer] = useState<any>(null);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [myFavorites, setMyFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<'photos' | 'favorites' | 'about'>('photos');
  const [copied, setCopied] = useState(false);
  const [voyageurRank, setVoyageurRank] = useState<number | null>(null);
  const [topCategory, setTopCategory] = useState<string | null>(null);
  const [followModalTab, setFollowModalTab] = useState<FollowTab | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabaseBrowserClient();

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (!userData) { setIsLoading(false); return; }

      // Fetch all photos to compute Rank Masters dynamically
      const { data: allPhotosData } = await supabase.from('photos').select('*');
      const rankMasters = computeRankMasters(allPhotosData || []);
      const isUserRankMaster = rankMasters.has(userData.username);

      setPhotographer({
        id: userData.id,
        username: userData.username,
        name: userData.display_name || userData.username,
        bio: userData.bio || 'No bio yet.',
        loc: userData.location || 'EARTH',
        avatar: userData.avatar_url,
        cover: userData.cover_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2938&auto=format&fit=crop',
        socialTwitter: userData.social_twitter || '',
        socialInstagram: userData.social_instagram || '',
        socialFacebook: userData.social_facebook || '',
        website: userData.portfolio_url || '',
        isCustomer: userData.is_customer,
        isAmbassador: userData.is_ambassador,
        isRankMaster: isUserRankMaster,
        followers: userData.followers_count ?? 0,
        following: userData.following_count ?? 0,
        joined: new Date(userData.created_at || Date.now()).getFullYear().toString(),
        cameras: ['Digital Camera'],
      });

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('photographer_id', userData.id)
        .order('uploaded_at', { ascending: false });

      if (photosData) {
        setMyPhotos(photosData.map(p => mapPublicPhoto(p, userData.username)));

        // Compute voyageur rank if this photographer is a customer
        if (userData.is_customer && photosData.length > 0) {
          const catCounts: Record<string, number> = {};
          const catBestLikes: Record<string, number> = {};
          for (const p of photosData) {
            if (!p.category) continue;
            catCounts[p.category] = (catCounts[p.category] || 0) + 1;
            catBestLikes[p.category] = Math.max(catBestLikes[p.category] || 0, p.likes_count || 0);
          }
          const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          if (topCat) {
            setTopCategory(topCat);
            const bestLikes = catBestLikes[topCat] || 0;
            const { data: vUsers } = await supabase
              .from('users').select('id').eq('is_customer', true).neq('id', userData.id);
            const vIds = (vUsers || []).map((u: any) => u.id as string);
            if (vIds.length > 0) {
              const { count } = await supabase
                .from('photos').select('id', { count: 'exact', head: true })
                .eq('category', topCat).gt('likes_count', bestLikes).in('photographer_id', vIds);
              setVoyageurRank((count ?? 0) + 1);
            } else {
              setVoyageurRank(1);
            }
          }
        }
      }

      const { data: favsData } = await supabase
        .from('favorites')
        .select('photos ( id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, description, users:users!photos_photographer_id_fkey(username) )')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (favsData) {
        setMyFavorites(favsData.map(f => {
          const p = (f as any).photos;
          if (!p) return null;
          const pUsername = (p as any).users?.username || 'Unknown';
          return mapPublicPhoto(p, pUsername);
        }).filter(Boolean));
      }

      setIsLoading(false);
    };

    fetchProfile();
  }, [username, reloadKey]);

  // Realtime: patch engagement counts + recompute pulse without refetch
  useEffect(() => {
    if (!photographer?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`photographer-photos-${photographer.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `photographer_id=eq.${photographer.id}` },
        (payload) => {
          const next = payload.new as { id: string; likes_count?: number; favorites_count?: number; comments_count?: number; };
          setMyPhotos((curr) =>
            curr.map((p) => {
              if (p.id !== next.id) return p;
              const likes = typeof next.likes_count === 'number' ? next.likes_count : p.likes;
              const favorites = typeof next.favorites_count === 'number' ? next.favorites_count : p.favorites;
              const comments = typeof next.comments_count === 'number' ? next.comments_count : p.comments;
              return { ...p, likes, favorites, comments };
            }),
          );
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [photographer?.id]);

  const follow = useFollowState(photographer?.id ?? null);

  const onFollowClick = async () => {
    const res = await follow.toggle();
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  const handleShare = async () => {
    const url = typeof location !== 'undefined' ? location.href : '';
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({ title: photographer?.name ?? '', url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1900);
  };

  if (isLoading) return (
    <div className="page-fade py-32 text-center text-fg-soft font-mono text-xs uppercase tracking-widest">
      Loading Profile...
    </div>
  );
  if (!photographer) return notFound();

  const totalViews = myPhotos.reduce((s: number, p: Photo) => s + (p.impressions ?? 0), 0);
  const avgPulse = myPhotos.length
    ? (myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0) / myPhotos.length).toFixed(0)
    : '—';
  const editorPickCount = myPhotos.filter((p: Photo) => p.picks.includes('editor')).length;
  const myCategories = Array.from(new Set(myPhotos.map((p: Photo) => p.cat)));
  const eyebrowParts = [
    photographer.isAmbassador ? 'Ambassador' : null,
    photographer.isCustomer ? 'Traveller' : 'Photographer',
    `@${photographer.username}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="page-fade">

      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden min-h-screen bg-white dark:bg-[#0a0a0a] text-fg">

        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-[52px] px-[14px] backdrop-blur-[8px] bg-white/[0.96] dark:bg-[#0a0a0a]/[0.96] border-b border-black/[0.08] dark:border-white/[0.08]">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-9 h-9 bg-transparent border-0 cursor-pointer p-0 inline-flex items-center justify-center text-fg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-[6px] text-fg">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">@{photographer.username}</span>
            {photographer.isCustomer && (
              <span className="w-[5px] h-[5px] bg-gold rotate-45 inline-block" />
            )}
          </div>

          <button
            onClick={handleShare}
            aria-label="Share"
            className="w-9 h-9 bg-transparent border-0 cursor-pointer p-0 inline-flex items-center justify-center text-fg"
          >
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>
        </header>

        {/* Cover image */}
        <div className="relative w-full h-[160px] overflow-hidden bg-[#f0ede7] dark:bg-[#1a1916]">
          {photographer.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photographer.cover} alt="" className="w-full h-full object-cover block" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[40%] to-black/45" />

          {photographer.isRankMaster && (
            <div className="absolute left-[14px] top-3 z-[2] inline-flex items-center gap-[5px] bg-fg text-bg px-2 py-[3px] mono text-[9px] tracking-[.14em] uppercase font-semibold">
              Rank Master
            </div>
          )}
          {photographer.isAmbassador && (
            <div className="absolute right-[14px] top-3 z-[2] inline-flex items-center gap-[5px] bg-gold text-white px-2 py-[3px] mono text-[9px] tracking-[.14em] uppercase font-semibold">
              Ambassador
            </div>
          )}
          {photographer.isCustomer && !photographer.isAmbassador && (
            <div className="absolute right-[14px] top-3 z-[2] inline-flex items-center gap-[5px] text-gold bg-black/50 backdrop-blur-[4px] px-2 py-[3px] mono text-[9px] tracking-[.14em] uppercase">
              <span className="w-[5px] h-[5px] bg-gold rotate-45" />
              Traveller
            </div>
          )}
        </div>

        {/* Avatar + stat row */}
        <div className="px-4 flex items-end gap-5">
          <div className="w-20 h-20 rounded-full bg-[#e8e4dc] dark:bg-[#1a1916] border-[3px] border-white dark:border-[#0a0a0a] overflow-hidden shrink-0 z-[2] -mt-[42px]">
            {photographer.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photographer.avatar} alt={photographer.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 grid grid-cols-3 text-center pt-3 pb-[2px]">
            {([
              [String(myPhotos.length), 'Photos', null],
              [follow.followersCount.toLocaleString(), 'Followers', 'followers'],
              [(photographer.following ?? 0).toLocaleString(), 'Following', 'following'],
            ] as const).map(([n, l, tab]) => {
              const body = (
                <>
                  <div className="mono text-[18px] font-semibold tracking-[-0.01em]">{n}</div>
                  <div className="mono text-[10px] text-fg-soft tracking-[.1em] uppercase mt-[2px]">{l}</div>
                </>
              );
              return tab ? (
                <button key={l} onClick={() => setFollowModalTab(tab)} className="bg-transparent border-0 p-0 cursor-pointer active:opacity-60 transition-opacity">
                  {body}
                </button>
              ) : (
                <div key={l}>{body}</div>
              );
            })}
          </div>
        </div>

        {/* Name + bio + location */}
        <div className="px-4 pt-[14px]">
          <div className="text-[15px] font-bold tracking-[-0.01em] leading-[1.3]">
            {photographer.name}
          </div>
          {photographer.bio && (
            <p className="font-thai text-[15px] leading-[1.65] text-fg-soft max-w-[50ch] mb-4">
              {photographer.bio}
            </p>
          )}
          <div className="mb-6">
            <SocialIconRow p={photographer} />
          </div>
          <div className="mono text-[11px] tracking-[.06em] text-fg-soft uppercase mt-1">
            {photographer.loc} · Joined {photographer.joined}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pt-3 flex gap-2">
          {follow.isSelf ? (
            <button onClick={() => router.push('/me')} className={MOBILE_BTN_SOLID}>Edit Profile</button>
          ) : (
            <button
              onClick={onFollowClick}
              disabled={follow.loading}
              className={MOBILE_BTN_SOLID}
            >
              {follow.following ? 'Following' : 'Follow'}
            </button>
          )}
          <button onClick={handleShare} className={MOBILE_BTN_GHOST}>
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Pulse strip */}
        {myPhotos.length > 0 && (
          <div className="mx-4 mt-[14px] px-[14px] py-[11px] flex items-center justify-between gap-3 bg-[#f9f7f4] dark:bg-[#1a1916] border border-black/[0.07] dark:border-white/[0.08]">
            <div className="flex items-center gap-[9px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l4-8 3 6 3-3" />
              </svg>
              <span className="mono text-[13px] font-semibold">
                Pulse {Math.round(myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0)).toLocaleString()}
              </span>
            </div>
            <span className="mono text-[10px] tracking-[.1em] uppercase text-fg-soft">
              Avg {avgPulse}
            </span>
          </div>
        )}

        {/* Mobile tab bar */}
        <div className="mt-4 border-t border-black/[0.08] dark:border-white/[0.1]">
          <div className="grid grid-cols-3">
            {MOBILE_TABS.map(({ id, label }) => {
              const active = mobileTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setMobileTab(id)}
                  className={`py-[13px] px-0 bg-transparent cursor-pointer border-x-0 border-t-0 border-b-2 mono text-[11px] tracking-[.1em] uppercase ${
                    active ? 'border-fg text-fg' : 'border-transparent text-fg-soft'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content — Photos */}
        {mobileTab === 'photos' && (
          <div className="px-4 pt-5">
            <NextDropCard photographerId={photographer.id} onReleased={() => setReloadKey((k) => k + 1)} />
          </div>
        )}
        {mobileTab === 'photos' && (
          myPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-[2px]">
              {myPhotos.map(p => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/photo/${p.id}`)}
                  className="aspect-square bg-[#f0ede7] dark:bg-[#1a1916] cursor-pointer overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.title || ''} className="w-full h-full object-cover block" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-[80px] text-center font-thai text-fg-soft">
              ยังไม่มีภาพในโปรไฟล์นี้
            </div>
          )
        )}

        {/* Tab content — Favorites */}
        {mobileTab === 'favorites' && (
          myFavorites.length > 0 ? (
            <div className="grid grid-cols-3 gap-[2px]">
              {myFavorites.map(p => (
                <div
                  key={(p as any).id}
                  onClick={() => router.push(`/photo/${(p as any).id}`)}
                  className="aspect-square bg-[#f0ede7] dark:bg-[#1a1916] cursor-pointer overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(p as any).src} alt={(p as any).title || ''} className="w-full h-full object-cover block" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-[80px] text-center font-thai text-fg-soft">
              ยังไม่มีภาพที่บันทึกไว้
            </div>
          )
        )}

        {/* Tab content — About */}
        {mobileTab === 'about' && (
          <div className="px-4 pt-5 pb-[40px]">

            {/* Voyageur card */}
            {photographer.isCustomer && (
              <div className="mb-6 bg-[#f9f7f4] dark:bg-[#1a1916] border border-black/[0.08] dark:border-white/[0.08] p-4">
                <div className="flex items-center gap-[6px] mb-3 mono text-[10px] tracking-[.14em] uppercase text-gold">
                  <span className="w-[6px] h-[6px] bg-gold rotate-45" />
                  Traveller · Season 01
                </div>
                <div className="mono text-[12px] leading-[2.2]">
                  <div className="flex justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-[6px] mb-[6px]">
                    <span className="text-fg-soft">Photos submitted</span>
                    <span className="font-semibold">{myPhotos.length}</span>
                  </div>
                  {voyageurRank != null && topCategory && (
                    <div className="flex justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-[6px] mb-[6px]">
                      <span className="text-fg-soft">Rank ({topCategory})</span>
                      <span className="font-semibold">#{voyageurRank}</span>
                    </div>
                  )}
                   <div className="flex justify-between">
                     <span className="text-fg-soft">Cashback tier</span>
                     <span className="font-semibold text-gold">
                       {getCashbackPercentage(voyageurRank)}% {getCashbackPercentage(voyageurRank) > 0 ? '✓' : ''}
                     </span>
                   </div>
                </div>
              </div>
            )}

            {/* Bio */}
            <div className="mb-5">
              <div className="mono text-[10px] tracking-[.16em] uppercase text-fg-soft mb-2">About</div>
              <p className="font-thai text-[14px] leading-[1.7] m-0 text-fg-soft">{photographer.bio}</p>
            </div>

            {/* Categories */}
            {myCategories.length > 0 && (
              <div>
                <div className="mono text-[10px] tracking-[.16em] uppercase text-fg-soft mb-[10px]">Categories</div>
                <div className="flex gap-[6px] flex-wrap">
                  {myCategories.map((cat: string) => (
                    <span
                      key={cat}
                      className="px-[10px] py-1 border border-black/[0.12] dark:border-white/[0.15] mono text-[10px] tracking-[.12em] uppercase"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-[40px]" />
        <Footer />
      </div>

      {/* ===================== DESKTOP LAYOUT ===================== */}
      <div className="hidden md:block">
        <PageCover
          src={photographer.cover}
          eyebrow={eyebrowParts}
          title={photographer.name}
          subtitle={photographer.bio}
          credit={`${photographer.loc} · ${myPhotos.length} photos · ${follow.followersCount.toLocaleString()} followers`}
        />

        {/* Identity header */}
        <section className="pt-8 md:pt-[64px] pb-6 md:pb-[48px] border-b border-rule">
          <div className="wrap">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 md:mb-[48px]">
              <div className="flex items-center gap-[10px]">
                {photographer.isRankMaster && (
                  <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] bg-fg text-bg text-[10.5px] tracking-[.16em] uppercase font-medium">
                    <CrownIcon /> Rank Master
                  </span>
                )}
                {photographer.isAmbassador && (
                  <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] bg-gold text-white text-[10.5px] tracking-[.16em] uppercase font-medium">
                    <CrownIcon /> Ambassador
                  </span>
                )}
                {photographer.isCustomer && (
                  <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] bg-fg text-bg text-[10.5px] tracking-[.16em] uppercase font-medium">
                    <VoyageurMark size={7} /> Voyageur
                  </span>
                )}
                <span className="mono text-[11px] tracking-[.18em] uppercase opacity-55">@{photographer.username}</span>
              </div>
              <div className="flex gap-[10px]">
                <button onClick={handleShare} className="btn btn-sm">
                  {copied ? 'Copied!' : 'Share'}
                </button>
                {follow.isSelf ? (
                  <button className="btn btn-sm" disabled>You</button>
                ) : (
                  <button
                    className={`btn btn-sm ${follow.following ? '' : 'btn-solid'}`}
                    onClick={onFollowClick}
                    disabled={follow.loading}
                  >
                    {follow.following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:gap-[48px] items-end grid-cols-[1fr_auto]">
              <div>
                <h1 className="th font-light m-0 leading-[.92] text-[clamp(40px,9vw,128px)] tracking-[-0.035em]">
                  {photographer.name}
                </h1>
                <div className="mt-6 flex gap-[28px] items-center caps">
                  <span className="opacity-65">{photographer.loc}</span>
                  <span className="opacity-35">·</span>
                  <span className="opacity-65">Joined {photographer.joined}</span>
                  <span className="opacity-35">·</span>
                  <span className="opacity-65">{photographer.cameras[0]}</span>
                </div>
              </div>
              <div className="w-[96px] h-[96px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden bg-tile shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photographer.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>

            <p className="th mt-7 text-[17px] leading-[1.55] max-w-[720px] text-fg-soft mb-0">
              {photographer.bio}
            </p>
            <div className="mt-6">
              <SocialIconRow p={photographer} />
            </div>
          </div>
        </section>

        {/* Stat strip + tabs */}
        <section>
          <div className="wrap">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 py-6 md:py-8 border-b border-rule mono">
              <ProfileStat label="Photos" val={myPhotos.length} />
              <ProfileStat label="Total Views" val={totalViews.toLocaleString()} />
              <ProfileStat label="Followers" val={follow.followersCount.toLocaleString()} onClick={() => setFollowModalTab('followers')} />
              <ProfileStat label="Following" val={(photographer.following ?? 0).toLocaleString()} onClick={() => setFollowModalTab('following')} />
              <ProfileStat label="Pulse avg" val={avgPulse} />
              <ProfileStat label="Rank Master" val={editorPickCount} />
            </div>

            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-rule gap-0 h-auto">
                <TabsTrigger value="photos" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                  Photos <span className="opacity-55 ml-[6px]">{myPhotos.length}</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                  Favorites <span className="opacity-55 ml-[6px]">{myFavorites.length}</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="px-0 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                  About
                </TabsTrigger>
              </TabsList>

              <div className="py-[48px] pb-[80px]">
                <TabsContent value="photos">
                  <NextDropCard photographerId={photographer.id} onReleased={() => setReloadKey((k) => k + 1)} />
                  {myPhotos.length > 0
                    ? <PhotoGrid photos={myPhotos} cols={3} showLike />
                    : <ProfileEmpty msg="ยังไม่มีภาพในโปรไฟล์นี้" />
                  }
                </TabsContent>

                <TabsContent value="favorites">
                  <p className="th text-[14px] text-fg-soft mt-0 mb-8 max-w-[600px]">
                    ภาพที่ {photographer.name.split(' ')[0]} เลือกบันทึกไว้ — ตั้งเป็น public โดยช่างภาพ
                  </p>
                  {myFavorites.length > 0 ? (
                    <PhotoGrid photos={myFavorites} cols={3} showLike />
                  ) : (
                    <ProfileEmpty msg="ยังไม่มีภาพที่บันทึกไว้" />
                  )}
                </TabsContent>

                <TabsContent value="about">
                  {photographer.isCustomer && (
                    <div className="p-6 md:p-[32px_36px] bg-cream border border-rule mb-8 md:mb-[48px] grid gap-8 md:gap-[48px] items-center grid-cols-1 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <div className="caps opacity-55 mb-3 flex items-center gap-2">
                          <VoyageurMark size={9} /> Traveller
                        </div>
                        <h3 className="th text-[26px] font-normal tracking-[-0.015em] m-0 leading-[1.25]">
                          ลูกค้าทริป GOGRAPHY — มีสิทธิ์ลุ้นรางวัล Travellers Awards
                        </h3>
                        <div className="mono mt-5 text-[12px] leading-[1.9]">
                          <div className="opacity-55 mb-2">TRIPS COMPLETED</div>
                          {(photographer.customerTrips ?? []).map((t: string) => (
                            <div key={t}>· {t}</div>
                          ))}
                        </div>
                      </div>
                      <div className="border-l border-rule pl-8">
                        <div className="caps opacity-55 mb-3">Travellers · Season 01</div>
                        <div className="th text-[14px] leading-[1.7]">
                          <div className="flex justify-between py-2 border-b border-rule">
                            <span>Photos submitted</span>
                            <span className="mono font-medium">{myPhotos.length}</span>
                          </div>
                          {voyageurRank != null && topCategory && (
                            <div className="flex justify-between py-2 border-b border-rule">
                              <span>Current rank ({topCategory})</span>
                              <span className="mono font-medium">#{voyageurRank}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2">
                             <span>Cashback tier</span>
                             <span className="mono font-medium">
                               {getCashbackPercentage(voyageurRank)}% {getCashbackPercentage(voyageurRank) > 0 ? '✓' : ''}
                             </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[80px] pt-4">
                    <div>
                      <h3 className="th text-[24px] font-normal tracking-[-0.015em] m-0 mb-5">
                        เกี่ยวกับ {photographer.name}
                      </h3>
                      <p className="th text-[15px] leading-[1.75] text-fg-soft">{photographer.bio}</p>
                    </div>
                    <div>
                      <div className="caps opacity-55 mb-4">Gear</div>
                      <ul className="list-none p-0 m-0 mono">
                        {photographer.cameras.map((cam: string) => (
                          <li key={cam} className="py-3 border-b border-rule text-[13px]">{cam}</li>
                        ))}
                      </ul>
                      <div className="caps opacity-55 mb-4 mt-8">Categories</div>
                      <ul className="list-none p-0 m-0 mono">
                        {myCategories.map((cat: string) => (
                          <li key={cat} className="py-3 border-b border-rule text-[13px]">{cat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>

        <Footer />
      </div>

      {photographer.id && (
        <FollowListModal
          open={followModalTab !== null}
          onOpenChange={(o) => { if (!o) setFollowModalTab(null); }}
          userId={photographer.id}
          username={photographer.username}
          initialTab={followModalTab ?? 'followers'}
          followersCount={follow.followersCount}
          followingCount={photographer.following ?? 0}
        />
      )}
    </div>
  );
}
