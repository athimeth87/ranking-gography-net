'use client';
import { notFound, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Photo } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { VoyageurMark, CrownIcon } from '@/components/icons';
import { useFollowState } from '@/hooks/useFollowState';
import { FollowListModal, type FollowTab } from '@/components/account/FollowListModal';
import { type PickType } from '@/lib/pulse-engine';
import { computeRankMasters, getCashbackPercentage } from '@/lib/ranking-system';
import { SpecimenCard } from '@/components/collection/SpecimenCard';
import { ArchiveDrawer } from '@/components/collection/ArchiveDrawer';
import { selectCuration, type SeasonAward } from '@/lib/provenance';

// ===== Photographer public profile — /photographer/[username] · "The Collection" =====

function mapPublicPhoto(p: any, username: string) {
  const likes = p.likes_count || 0;
  const favorites = p.favorites_count || 0;
  const comments = p.comments_count || 0;
  const pulse = p.pulse != null ? Number(p.pulse) : 0;
  const exif = p.exif || null;
  const exifSettings = exif
    ? [exif.aperture, exif.shutter, exif.iso ? `ISO ${exif.iso}` : null].filter(Boolean).join(' · ')
    : '';
  const year = p.uploaded_at ? new Date(p.uploaded_at).getFullYear().toString() : '';
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
    exif: {
      camera: p.camera || 'Unknown',
      lens: p.lens || 'Unknown',
      iso: exif?.iso ?? 100,
      shutter: exif?.shutter ?? '1/100',
      aperture: exif?.aperture ?? 'f/8',
      focal: exif?.focal ?? '50mm',
    },
    likes,
    likes24h: 0,
    comments,
    favorites,
    hours: 1,
    picks: p.pick_type === 'editor' || p.pick_type === 'both' ? ['editor'] : [],
    date: p.uploaded_at,
    pulse,
    impressions: p.impressions_count || 0,
    rank: 0,
    // Collection fields
    location: p.location || '',
    camera: p.camera || '',
    lens: p.lens || '',
    year,
    exifSettings,
    pickType: (p.pick_type || 'none') as PickType,
    badge: p.badge ?? null,
    peakPulse: p.peak_pulse != null ? Number(p.peak_pulse) : null,
  };
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

// Editorial section head — "— 01  Curated Set" with hairline rule above.
function SectionHead({ num, title, small }: { num: string; title: string; small?: string }) {
  return (
    <div className="flex items-baseline justify-between border-t border-rule pt-6 md:pt-[26px] pb-6 md:pb-[34px] mt-12 md:mt-[70px] gap-4">
      <h2 className="font-serif text-[24px] md:text-[30px] font-medium leading-none">
        <span className="mono text-gold text-[11px] tracking-[.3em] mr-[14px] align-middle">{num}</span>
        {title}
      </h2>
      {small && <span className="th text-[11px] md:text-[12px] tracking-[.04em] text-fg-soft text-right shrink-0">{small}</span>}
    </div>
  );
}

function CollStat({ b, s }: { b: string | number; s: string }) {
  return (
    <div className="bg-bg px-[14px] md:px-[18px] py-[18px] md:py-[22px]">
      <b className="block font-serif text-[26px] md:text-[30px] font-medium">{b}</b>
      <span className="mono text-[9px] md:text-[10px] tracking-[.22em] text-fg-soft">{s}</span>
    </div>
  );
}

const MOBILE_BTN_SOLID = 'flex-1 inline-flex items-center justify-center min-h-[44px] px-4 text-[13px] font-semibold tracking-[.03em] uppercase border border-fg bg-fg text-bg cursor-pointer';
const MOBILE_BTN_GHOST = 'flex-1 inline-flex items-center justify-center min-h-[44px] px-4 text-[13px] font-semibold tracking-[.03em] uppercase border border-black/15 dark:border-white/25 bg-transparent text-fg cursor-pointer';

export function PhotographerClient({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [photographer, setPhotographer] = useState<any>(null);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [myFavorites, setMyFavorites] = useState<any[]>([]);
  const [seasonAwards, setSeasonAwards] = useState<Map<string, SeasonAward>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [voyageurRank, setVoyageurRank] = useState<number | null>(null);
  const [topCategory, setTopCategory] = useState<string | null>(null);
  const [followModalTab, setFollowModalTab] = useState<FollowTab | null>(null);

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

        // Per-photo season-award provenance (permanent achievement history)
        const ids = photosData.map(p => p.id);
        if (ids.length > 0) {
          const { data: sw } = await supabase
            .from('season_winners')
            .select('photo_id, category, seasons ( name )')
            .in('photo_id', ids);
          const m = new Map<string, SeasonAward>();
          (sw || []).forEach((w: any) => {
            m.set(w.photo_id, { seasonName: w.seasons?.name || 'Season', category: w.category });
          });
          setSeasonAwards(m);
        }

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
  }, [username]);

  // Realtime: patch engagement counts without refetch
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

  const openPhoto = (id: string) => router.push(`/photo/${id}`);

  if (isLoading) return (
    <div className="page-fade py-32 text-center text-fg-soft font-mono text-xs uppercase tracking-widest">
      Loading Profile...
    </div>
  );
  if (!photographer) return notFound();

  const { curated, archive } = selectCuration(myPhotos, seasonAwards);
  const seasonAwardsCount = seasonAwards.size;
  const avgPulse = myPhotos.length
    ? (myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0) / myPhotos.length).toFixed(0)
    : '—';
  const myCategories = Array.from(new Set(myPhotos.map((p: any) => p.cat)));
  const cameras = Array.from(new Set(myPhotos.map((p: any) => p.camera).filter((c: string) => c && c !== 'Unknown')));
  const lenses = Array.from(new Set(myPhotos.map((p: any) => p.lens).filter((l: string) => l && l !== 'Unknown')));
  const gear = [...cameras, ...lenses];
  const primaryCamera = cameras[0];
  const nameWords = String(photographer.name).trim().split(/\s+/);
  const firstName = nameWords[0] ?? photographer.name;
  const restName = nameWords.slice(1).join(' ');
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const collectionLabel = photographer.isCustomer && !photographer.isAmbassador ? 'Traveller' : 'Photographer';

  return (
    <div className="page-fade">

      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden min-h-screen bg-bg text-fg">

        {/* Sticky top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-[52px] px-[14px] backdrop-blur-[8px] bg-[var(--bg-nav)] border-b border-rule">
          <button onClick={() => router.back()} aria-label="Back" className="w-9 h-9 bg-transparent border-0 cursor-pointer p-0 inline-flex items-center justify-center text-fg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-[6px] text-fg">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">@{photographer.username}</span>
            {photographer.isCustomer && <span className="w-[5px] h-[5px] bg-gold rotate-45 inline-block" />}
          </div>
          <button onClick={handleShare} aria-label="Share" className="w-9 h-9 bg-transparent border-0 cursor-pointer p-0 inline-flex items-center justify-center text-fg">
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            )}
          </button>
        </header>

        {/* Cover image */}
        <div className="relative w-full h-[160px] overflow-hidden bg-tile">
          {photographer.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photographer.cover} alt="" className="w-full h-full object-cover block" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[40%] to-black/45" />
          {photographer.isRankMaster && (
            <div className="absolute left-[14px] top-3 z-[2] inline-flex items-center gap-[5px] bg-fg text-bg px-2 py-[3px] mono text-[9px] tracking-[.14em] uppercase font-semibold">Rank Master</div>
          )}
          {photographer.isAmbassador && (
            <div className="absolute right-[14px] top-3 z-[2] inline-flex items-center gap-[5px] bg-gold text-white px-2 py-[3px] mono text-[9px] tracking-[.14em] uppercase font-semibold">Ambassador</div>
          )}
          {photographer.isCustomer && !photographer.isAmbassador && (
            <div className="absolute right-[14px] top-3 z-[2] inline-flex items-center gap-[5px] text-gold bg-black/50 backdrop-blur-[4px] px-2 py-[3px] mono text-[9px] tracking-[.14em] uppercase"><span className="w-[5px] h-[5px] bg-gold rotate-45" />Traveller</div>
          )}
        </div>

        {/* Avatar + stat row */}
        <div className="px-4 flex items-end gap-5">
          <div className="w-20 h-20 rounded-full bg-tile border-[3px] border-bg overflow-hidden shrink-0 z-[2] -mt-[42px]">
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
                <button key={l} onClick={() => setFollowModalTab(tab)} className="bg-transparent border-0 p-0 cursor-pointer active:opacity-60 transition-opacity">{body}</button>
              ) : (
                <div key={l}>{body}</div>
              );
            })}
          </div>
        </div>

        {/* Name + bio */}
        <div className="px-4 pt-[14px]">
          <div className="mono text-[9px] tracking-[.34em] uppercase text-gold mb-2">The Private Collection of</div>
          <h1 className="font-serif text-[30px] font-medium leading-[1.05] mb-1">
            {firstName}{restName && <> <em className="text-gold">{restName}</em></>}
          </h1>
          {photographer.bio && (
            <p className="font-thai text-[15px] leading-[1.65] text-fg-soft max-w-[50ch] mt-3 mb-4">{photographer.bio}</p>
          )}
          <div className="mb-5"><SocialIconRow p={photographer} /></div>
          <div className="mono text-[11px] tracking-[.06em] text-fg-soft uppercase">{photographer.loc} · Joined {photographer.joined}{primaryCamera ? ` · ${primaryCamera}` : ''}</div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pt-4 flex gap-2">
          {!follow.isSelf && (
            <button onClick={onFollowClick} disabled={follow.loading} className={MOBILE_BTN_SOLID}>{follow.following ? 'Following' : 'Follow'}</button>
          )}
          <button onClick={handleShare} className={follow.isSelf ? MOBILE_BTN_SOLID : MOBILE_BTN_GHOST}>{copied ? 'Copied!' : 'Share'}</button>
        </div>

        {/* Pulse strip */}
        {myPhotos.length > 0 && (
          <div className="mx-4 mt-[10px] px-[14px] py-[11px] flex items-center justify-between gap-3 bg-cream border border-rule">
            <div className="flex items-center gap-[9px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l4-8 3 6 3-3" /></svg>
              <span className="mono text-[13px] font-semibold">Pulse {Math.round(myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0)).toLocaleString()}</span>
            </div>
            <span className="mono text-[10px] tracking-[.1em] uppercase text-fg-soft">Avg {avgPulse}</span>
          </div>
        )}

        {/* Curated Set */}
        <div className="px-4">
          {curated.length > 0 ? (
            <>
              <SectionHead num="— 01" title="Curated Set" small={`${pad2(curated.length)} / 12 ชิ้น`} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {curated.map((p: any, i: number) => (
                  <SpecimenCard key={p.id} photo={p} index={i} awards={seasonAwards} onOpen={openPhoto} />
                ))}
              </div>
              <ArchiveDrawer photos={archive} onOpen={openPhoto} cols={3} />
            </>
          ) : (
            <ProfileEmpty msg="ยังไม่มีภาพในคอลเลกชันนี้" />
          )}
        </div>

        {/* Saved */}
        {myFavorites.length > 0 && (
          <div className="px-4">
            <SectionHead num="— 02" title="Saved" small="ภาพที่บันทึกไว้" />
            <div className="grid grid-cols-3 gap-[2px]">
              {myFavorites.map((p: any) => (
                <button key={p.id} type="button" onClick={() => openPhoto(p.id)} className="aspect-square bg-tile cursor-pointer overflow-hidden p-0 border-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.title || ''} className="w-full h-full object-cover block" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        <div className="px-4 pt-2 pb-[40px]">
          <SectionHead num="— 03" title="About" />
          {photographer.isCustomer && (
            <div className="mb-6 bg-cream border border-rule p-4">
              <div className="flex items-center gap-[6px] mb-3 mono text-[10px] tracking-[.14em] uppercase text-gold"><span className="w-[6px] h-[6px] bg-gold rotate-45" />Traveller · Season 01</div>
              <div className="mono text-[12px] leading-[2.2]">
                <div className="flex justify-between border-b border-rule pb-[6px] mb-[6px]"><span className="text-fg-soft">Photos submitted</span><span className="font-semibold">{myPhotos.length}</span></div>
                {voyageurRank != null && topCategory && (
                  <div className="flex justify-between border-b border-rule pb-[6px] mb-[6px]"><span className="text-fg-soft">Rank ({topCategory})</span><span className="font-semibold">#{voyageurRank}</span></div>
                )}
                <div className="flex justify-between"><span className="text-fg-soft">Cashback tier</span><span className="font-semibold text-gold">{getCashbackPercentage(voyageurRank)}% {getCashbackPercentage(voyageurRank) > 0 ? '✓' : ''}</span></div>
              </div>
            </div>
          )}
          <p className="font-thai text-[14px] leading-[1.7] m-0 text-fg-soft mb-5">{photographer.bio}</p>
          {myCategories.length > 0 && (
            <div>
              <div className="mono text-[10px] tracking-[.16em] uppercase text-fg-soft mb-[10px]">Categories</div>
              <div className="flex gap-[6px] flex-wrap">
                {myCategories.map((cat: string) => (
                  <span key={cat} className="px-[10px] py-1 border border-rule mono text-[10px] tracking-[.12em] uppercase">{cat}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-[40px]" />
        <Footer />
      </div>

      {/* ===================== DESKTOP LAYOUT ===================== */}
      <div className="hidden md:block">
        <div className="wrap pb-[80px]">

          {/* Slim action bar */}
          <div className="flex justify-between items-center py-5 border-b border-rule">
            <span className="caps text-fg-soft">The Collection</span>
            <div className="flex gap-[10px]">
              {!follow.isSelf && (
                <button className={`btn btn-sm ${follow.following ? '' : 'btn-solid'}`} onClick={onFollowClick} disabled={follow.loading}>{follow.following ? 'Following' : 'Follow'}</button>
              )}
              <button onClick={handleShare} className="btn btn-sm">{copied ? 'Copied!' : 'Share'}</button>
            </div>
          </div>

          {/* Hero */}
          <header className="pt-[60px] pb-[40px] grid grid-cols-[1.4fr_1fr] gap-[60px] items-end">
            <div>
              <div className="mono text-[10.5px] tracking-[.4em] uppercase text-gold mb-[22px]">The Private Collection of</div>
              <h1 className="font-serif text-[clamp(44px,5.5vw,72px)] font-medium leading-[1.02] tracking-[.01em]">
                {firstName}{restName && <><br /><em className="text-gold">{restName}</em></>}
              </h1>
              <p className="font-thai text-[14.5px] leading-[1.8] text-fg-soft max-w-[46ch] mt-6">{photographer.bio}</p>
              <div className="flex gap-[14px] mt-7 flex-wrap items-center">
                {photographer.isAmbassador && <span className="mono text-[10px] tracking-[.18em] uppercase border border-gold text-gold px-[13px] py-[6px]">✦ Ambassador</span>}
                {photographer.isRankMaster && <span className="mono text-[10px] tracking-[.18em] uppercase border border-gold text-gold px-[13px] py-[6px] inline-flex items-center gap-[6px]"><CrownIcon /> Rank Master</span>}
                {photographer.isCustomer && !photographer.isAmbassador && <span className="mono text-[10px] tracking-[.18em] uppercase border border-gold text-gold px-[13px] py-[6px] inline-flex items-center gap-[6px]"><VoyageurMark size={7} /> Traveller</span>}
                <span className="mono text-[10px] tracking-[.18em] uppercase border border-rule text-fg-soft px-[13px] py-[6px]">{photographer.loc}</span>
                {primaryCamera && <span className="mono text-[10px] tracking-[.18em] uppercase border border-rule text-fg-soft px-[13px] py-[6px]">{primaryCamera}</span>}
              </div>
              <SocialIconRow p={photographer} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px bg-rule border border-rule">
              <CollStat b={pad2(curated.length)} s="CURATED" />
              <CollStat b={pad2(archive.length)} s="IN ARCHIVE" />
              <CollStat b={pad2(seasonAwardsCount)} s="SEASON AWARDS" />
            </div>
          </header>

          {/* Next Drop — deferred until the scheduled-release (drops) feature exists. */}

          {/* Curated Set */}
          {curated.length > 0 ? (
            <>
              <SectionHead num="— 01" title="Curated Set" small={`${pad2(curated.length)} / 12 ชิ้น — คัดอัตโนมัติจากผลงานเด่น`} />
              <div className="grid grid-cols-3 gap-x-[34px] gap-y-[46px]">
                {curated.map((p: any, i: number) => (
                  <SpecimenCard key={p.id} photo={p} index={i} awards={seasonAwards} onOpen={openPhoto} />
                ))}
              </div>
              <ArchiveDrawer photos={archive} onOpen={openPhoto} cols={6} />
            </>
          ) : (
            <ProfileEmpty msg="ยังไม่มีภาพในคอลเลกชันนี้" />
          )}

          {/* Saved */}
          {myFavorites.length > 0 && (
            <>
              <SectionHead num="— 02" title="Saved" small={`ภาพที่ ${String(photographer.name).split(' ')[0]} เลือกบันทึกไว้`} />
              <PhotoGrid photos={myFavorites} cols={4} />
            </>
          )}

          {/* About */}
          <SectionHead num={myFavorites.length > 0 ? '— 03' : '— 02'} title="About" />
          {photographer.isCustomer && (
            <div className="p-[32px_36px] bg-cream border border-rule mb-[48px] grid gap-[48px] items-center grid-cols-[1.5fr_1fr]">
              <div>
                <div className="caps opacity-55 mb-3 flex items-center gap-2"><VoyageurMark size={9} /> Traveller</div>
                <h3 className="th text-[26px] font-normal tracking-[-0.015em] m-0 leading-[1.25]">ลูกค้าทริป GOGRAPHY — มีสิทธิ์ลุ้นรางวัล Travellers Awards</h3>
                <div className="mono mt-5 text-[12px] leading-[1.9]">
                  <div className="opacity-55 mb-2">TRIPS COMPLETED</div>
                  {(photographer.customerTrips ?? []).map((t: string) => (<div key={t}>· {t}</div>))}
                </div>
              </div>
              <div className="border-l border-rule pl-8">
                <div className="caps opacity-55 mb-3">Travellers · Season 01</div>
                <div className="th text-[14px] leading-[1.7]">
                  <div className="flex justify-between py-2 border-b border-rule"><span>Photos submitted</span><span className="mono font-medium">{myPhotos.length}</span></div>
                  {voyageurRank != null && topCategory && (
                    <div className="flex justify-between py-2 border-b border-rule"><span>Current rank ({topCategory})</span><span className="mono font-medium">#{voyageurRank}</span></div>
                  )}
                  <div className="flex justify-between py-2"><span>Cashback tier</span><span className="mono font-medium">{getCashbackPercentage(voyageurRank)}% {getCashbackPercentage(voyageurRank) > 0 ? '✓' : ''}</span></div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-[80px] pt-4">
            <div>
              <h3 className="th text-[24px] font-normal tracking-[-0.015em] m-0 mb-5">เกี่ยวกับ {photographer.name}</h3>
              <p className="th text-[15px] leading-[1.75] text-fg-soft">{photographer.bio}</p>
              <div className="mt-5 mono text-[11px] tracking-[.06em] uppercase text-fg-soft">{collectionLabel} · Joined {photographer.joined}</div>
            </div>
            <div>
              {gear.length > 0 && (
                <>
                  <div className="caps opacity-55 mb-4">Gear</div>
                  <ul className="list-none p-0 m-0 mono">
                    {gear.map((cam: string) => (
                      <li key={cam} className="py-3 border-b border-rule text-[13px]">{cam}</li>
                    ))}
                  </ul>
                </>
              )}
              <div className={`caps opacity-55 mb-4 ${gear.length > 0 ? 'mt-8' : ''}`}>Categories</div>
              <ul className="list-none p-0 m-0 mono">
                {myCategories.map((cat: string) => (<li key={cat} className="py-3 border-b border-rule text-[13px]">{cat}</li>))}
              </ul>
            </div>
          </div>
        </div>

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
