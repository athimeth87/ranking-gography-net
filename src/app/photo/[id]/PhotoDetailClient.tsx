'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPhoto, getPhotographer, getCommentsFor, getPhotos } from '@/lib/data';
import type { Photo, Comment, Photographer, Category } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { PickBadge } from '@/components/icons';
import { Lightbox } from '@/components/photo/Lightbox';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useLikeState } from '@/hooks/useLikeState';
import { CommentSection } from '@/components/photo/CommentSection';
import { useFollowState } from '@/hooks/useFollowState';
import { useFavoriteState } from '@/hooks/useFavoriteState';
import { usePathname } from 'next/navigation';
import { computePulse, type PickType } from '@/lib/pulse-engine';
import { PhotoStatsPanel } from '@/components/photo/PhotoStatsPanel';
import { usePhotoImpression } from '@/hooks/usePhotoImpression';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTranslations } from 'next-intl';

// ===== Single photo detail page — /photo/[id] =====
// Large image + sidebar (photographer, EXIF, pulse/stats, comments), like/favorite toggles, lightbox.

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  link?: string;
  linkLabel?: string;
}

function SectionHeader({ title, eyebrow, link, linkLabel }: SectionHeaderProps) {
  return (
    <div className="section-h">
      <div>
        {eyebrow && <div className="caps opacity-55 mb-3">{eyebrow}</div>}
        <h2 className="th">{title}</h2>
      </div>
      {link && linkLabel && (
        <Link href={link} className="mono text-[11px] tracking-[.14em] uppercase opacity-65 border-b border-rule pb-[2px]">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

interface BreakdownStatProps {
  label: string;
  val: number | string;
  mult?: string;
}

function BreakdownStat({ label, val, mult }: BreakdownStatProps) {
  return (
    <div>
      <div className="caps opacity-55 mb-2">{label}</div>
      <div className="flex items-baseline gap-[6px]">
        <span className="text-[24px] mono font-medium">
          {typeof val === 'number' ? val.toLocaleString() : val}
        </span>
        {mult && <span className="mono text-[11px] opacity-55">{mult}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function PhotoDetailClient({ id }: { id: string }) {
  const params = { id };
  const router = useRouter();
  const t = useTranslations('PhotoDetail');
  
  // We will track if this photo came from the DB to enable DB-specific features (likes, comments, realtime)
  const [isDbPhoto, setIsDbPhoto] = useState(false);

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photographer, setPhotographer] = useState<Photographer | undefined>(undefined);
  const [photographerUserId, setPhotographerUserId] = useState<string | null>(null);
  const [more, setMore] = useState<Photo[]>([]);
  const [similar, setSimilar] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Count one impression per viewer/day for real DB photos.
  usePhotoImpression(photo?.id ?? null, isDbPhoto);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const pathname = usePathname();
  const follow = useFollowState(photographerUserId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = () => {
    setReportOpen(true);
  };

  useEffect(() => {
    const fetchPhoto = async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
      const supabase = getSupabaseBrowserClient();
      
      // Try to fetch from Supabase
      const column = isUUID ? 'id' : 'slug';
      const { data: pData } = await supabase.from('photos').select('*').eq(column, params.id).single();
      
      if (!pData) {
        // Fallback to mock data
        const p = getPhoto(params.id);
        if (!p) { setError(true); setLoading(false); return; }
        setPhoto(p);
        setPhotographer(getPhotographer(p.by));
        
        const allPhotos = getPhotos();
        setMore(allPhotos.filter((x) => x.by === p.by && x.id !== p.id).slice(0, 4));
        setSimilar(allPhotos.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 6));
        setLoading(false);
        return;
      }

      setIsDbPhoto(true);

      const { data: uData } = await supabase.from('users').select('*').eq('id', pData.photographer_id).single();

      const rawCat = pData.category as string;
      const mappedCat = (rawCat === 'bw' ? 'BW' : rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category;
      const ownerName = uData?.username || uData?.display_name || 'unknown';

      const realPhoto: Photo = {
        id: pData.id,
        slug: pData.slug || pData.id,
        title: pData.title,
        by: ownerName,
        cat: mappedCat,
        w: pData.width || 4,
        h: pData.height || 3,
        src: pData.storage_url,
        caption: pData.description || '',
        exif: { camera: pData.camera || 'Unknown', lens: pData.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
        likes: pData.likes_count || 0,
        likes24h: 0,
        comments: pData.comments_count || 0,
        favorites: pData.favorites_count || 0,
        hours: 24,
        picks: [],
        date: pData.uploaded_at,
        voyageurOnly: pData.voyageur_only,
        impressions: pData.impressions_count || 0,
        peakPulse: pData.peak_pulse != null ? Number(pData.peak_pulse) : null,
        pickType: (pData.pick_type as PickType) ?? 'none',
        percentile: pData.percentile != null ? Number(pData.percentile) : null,
        badge: (pData.badge as string) ?? null,
        pulse: pData.pulse != null ? Number(pData.pulse) : 0,
        rank: 0
      };

      setPhoto(realPhoto);
      setPhotographerUserId(pData.photographer_id);

      if (uData) {
        setPhotographer({
          username: ownerName,
          name: uData.display_name || ownerName,
          loc: 'Earth',
          bio: uData.bio || '',
          avatar: uData.avatar_url || '',
          cover: '',
          followers: 0,
          photos: 0,
          isAmbassador: uData.photographer_status === 'approved',
          isCustomer: uData.is_customer,
          joined: uData.created_at,
          cameras: []
        });
      }

      // We won't strictly fetch related photos from DB to save time, 
      // but let's just show an empty grid or recent photos
      const { data: moreData } = await supabase.from('photos').select('*').eq('photographer_id', pData.photographer_id).neq('id', pData.id).limit(4);
      if (moreData) {
        const mappedMore = moreData.map(md => ({
          id: md.id,
          slug: md.slug || md.id,
          title: md.title,
          by: ownerName,
          cat: (md.category === 'bw' ? 'BW' : md.category.charAt(0).toUpperCase() + md.category.slice(1)) as Category,
          w: md.width || 4,
          h: md.height || 3,
          src: md.storage_url,
          caption: md.description || '',
          exif: { camera: md.camera || 'Unknown', lens: md.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
          likes: md.likes_count || 0,
          likes24h: 0,
          comments: md.comments_count || 0,
          favorites: md.favorites_count || 0,
          hours: 24,
          picks: [],
          date: md.uploaded_at,
          voyageurOnly: md.voyageur_only,
          pulse: md.pulse != null ? Number(md.pulse) : 0,
          rank: 0
        }));
        setMore(mappedMore);
      }

      setLoading(false);
    };
    
    fetchPhoto();
  }, [params.id]);

  // Realtime counts: subscribe to the photo row so likes / comments /
  // favorites / pulse update without reloading.
  useEffect(() => {
    if (!isDbPhoto || !photo?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`photo-detail-${photo.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `id=eq.${photo.id}` },
        (payload) => {
          const next = payload.new as { likes_count?: number; comments_count?: number; favorites_count?: number };
          setPhoto((curr) => {
            if (!curr) return curr;
            const likes = typeof next.likes_count === 'number' ? next.likes_count : curr.likes;
            const comments = typeof next.comments_count === 'number' ? next.comments_count : curr.comments;
            const favorites = typeof next.favorites_count === 'number' ? next.favorites_count : curr.favorites;
            return {
              ...curr,
              likes,
              comments,
              favorites,
              pulse: computePulse({
                likes_count: likes,
                favorites_count: favorites,
                comments_count: comments,
                impressions_count: 0,
                uploaded_at: curr.date,
              }),
            };
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isDbPhoto, photo?.id]);

  const favoriteState = useFavoriteState(isDbPhoto && photo?.id ? photo.id : '');
  const onFavoriteClick = async () => {
    if (!isDbPhoto) return;
    const res = await favoriteState.toggle();
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  const likeState = useLikeState(isDbPhoto && photo?.id ? photo.id : '');
  const onLikeClick = async () => {
    const res = await likeState.toggle();
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  // Double-tap to like (IG-style). Single tap does nothing.
  const [heartBurst, setHeartBurst] = useState(0);
  const lastTapRef = useRef(0);
  const onImageTap = () => {
    if (!isDbPhoto) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      if (!likeState.liked) {
        likeState.toggle().then((res) => {
          if (res.kind === 'unauth') router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
        });
      }
      setHeartBurst((b) => b + 1);
    } else {
      lastTapRef.current = now;
    }
  };

  // Category slug for links
  const catSlug = photo ? photo.cat.toLowerCase() : '';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !photo) {
    return <div className="min-h-screen flex items-center justify-center">404 - Photo not found in database</div>;
  }

  return (
    <div className="page-fade">
      {/* Breadcrumb */}
      <div className="py-5 border-b border-rule">
        <div className="wrap mono flex flex-col md:flex-row justify-between gap-3 md:gap-0 text-[11px] tracking-[.14em] uppercase opacity-65">
          <div className="flex items-center flex-wrap gap-y-2">
            <Link href="/explore" className="opacity-70 shrink-0">{t('explore')}</Link>
            <span className="opacity-35 mx-2 md:mx-3 shrink-0">/</span>
            <Link href={`/explore/${catSlug}`} className="opacity-70 shrink-0">{photo.cat}</Link>
            <span className="opacity-35 mx-2 md:mx-3 shrink-0">/</span>
            <span className="truncate max-w-[120px] md:max-w-[200px]" title={photo.id}>{photo.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-y-2">
            <span><span className="opacity-55">{t('rank')}</span> #{String(photo.rank).padStart(3, '0')}</span>
            <span className="opacity-35 mx-2 md:mx-3">·</span>
            <span><span className="opacity-55">{t('posted')}</span> {new Date(photo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="wrap">
          {/* Two-column layout: main image/info + sidebar */}
          <div className="grid gap-10 md:gap-14 items-start grid-cols-1 lg:grid-cols-[1fr_360px]">

            {/* ---- Main column ---- */}
            <div>
              {/* Photo image — double-tap to like */}
              <div
                className="relative bg-tile overflow-hidden select-none"
                onClick={onImageTap}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-auto block"
                  loading="lazy"
                />
                {heartBurst > 0 && (
                  <svg
                    key={heartBurst}
                    viewBox="0 0 24 22"
                    fill="#fff"
                    width="110"
                    height="110"
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-1/2 animate-[heart-burst_1s_ease-out_forwards] drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
                  >
                    <path d="M12 20s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 2.6C20 14.8 12 20 12 20z" />
                  </svg>
                )}
              </div>

              {/* Title + picks */}
              <div className="mt-6 flex justify-between items-start gap-6">
                <div>
                  <div className="caps opacity-55 mb-[6px]">{photo.cat}</div>
                  <h1 className="th text-[40px] font-normal tracking-[-.02em] m-0 leading-[1.1]">
                    {photo.title}
                  </h1>
                  <p className="th mt-4 text-[15px] text-fg-soft leading-[1.7] max-w-[540px]">
                    {photo.caption}
                  </p>
                </div>
                {photo.picks.length > 0 && (
                  <div className="flex gap-2 shrink-0">
                    {photo.picks.includes('editor') && photo.picks.includes('ambassador') ? (
                      <PickBadge kind="both" />
                    ) : (
                      <>
                        {photo.picks.includes('editor') && <PickBadge kind="editor" />}
                        {photo.picks.includes('ambassador') && <PickBadge kind="ambassador" />}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Engage strip */}
              <div className="flex gap-3 mt-8 items-center">
                {isDbPhoto ? (
                  <button
                    className="heart"
                    onClick={onLikeClick}
                    aria-label={likeState.liked ? 'Unlike' : 'Like'}
                    aria-pressed={likeState.liked}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={likeState.liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      width="13"
                      height="13"
                      className={likeState.liked ? 'text-[#ff5d75]' : ''}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{likeState.count.toLocaleString()}</span>
                  </button>
                ) : (
                  <span className="heart" aria-label="Likes (read-only seed)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{photo.likes.toLocaleString()}</span>
                  </span>
                )}

                {/* Favorite button — real DB toggle for UUID-keyed photos,
                    read-only display for seed/mock IDs */}
                {isDbPhoto ? (
                  <button
                    className={`heart${favoriteState.favorited ? ' on' : ''}`}
                    onClick={onFavoriteClick}
                    aria-label={favoriteState.favorited ? 'Remove from favorites' : 'Add to favorites'}
                    aria-pressed={favoriteState.favorited}
                  >
                    <svg viewBox="0 0 24 24" fill={favoriteState.favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                    <span>{favoriteState.count}</span>
                  </button>
                ) : (
                  <span className="heart" aria-label="Favorites (read-only seed)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                    <span>{photo.favorites}</span>
                  </span>
                )}

                <button className="heart">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                  <span>{photo.comments}</span>
                </button>

                <div className="flex-1" />
                <button 
                  className="heart" 
                  onClick={handleCopyLink}
                >
                  {copied ? t('copied') : t('copy_link')}
                </button>
                <button 
                  className="heart"
                  onClick={handleReport}
                  disabled={reportDone}
                >
                  {reportDone ? t('reported') : t('report')}
                </button>
              </div>

              {/* Engagement breakdown */}
              <div className="mt-10 md:mt-14 py-6 md:py-8 border-t border-rule border-b border-rule">
                <div className="grid gap-4 md:gap-8 items-baseline grid-cols-2 md:grid-cols-4">
                  <div>
                    <div className="caps opacity-55 mb-2">{t('likes')}</div>
                    <div className="mono font-medium leading-[1] text-[48px] tracking-[-.02em]">
                      {photo.likes}
                    </div>
                  </div>
                  <BreakdownStat label={t('favorites')} val={photo.favorites} />
                  <BreakdownStat label={t('comments')} val={photo.comments} />
                  <BreakdownStat
                    label={t('curation')}
                    val={photo.picks.length === 2 ? t('curation_both') : photo.picks.length === 1 ? t('curation_1pick') : '—'}
                  />
                </div>
              </div>

              {/* 500px-style stats — mobile only (sidebar shows the desktop one) */}
              <div className="lg:hidden">
                <PhotoStatsPanel
                  likes={photo.likes}
                  impressions={photo.impressions ?? 0}
                  highestPulse={photo.peakPulse ?? photo.pulse}
                  pickType={photo.pickType}
                  badge={photo.badge}
                />
              </div>

              {/* Comments */}
              <CommentSection photoId={photo.id} />
            </div>

            {/* ---- Sidebar ---- */}
            <aside className="sticky top-[100px] lg:block">
              {/* Photographer card */}
              <div className="py-7 border-t border-fg border-b border-rule">
                {photographer ? (
                  <>
                    <Link
                      href={`/photographer/${photographer.username}`}
                      className="flex gap-[14px] items-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-tile overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photographer.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <div className="text-[16px] font-medium tracking-[-0.005em]">
                          {photographer.name}
                        </div>
                        <div className="caps opacity-55 mt-1">{photographer.loc}</div>
                      </div>
                    </Link>
                    <p className="th mt-[18px] text-[13px] text-fg-soft leading-[1.65]">
                      {photographer.bio}
                    </p>
                    <div className="mono flex gap-6 mt-5">
                      <div>
                        <div className="text-[18px] font-medium">{photographer.photos}</div>
                        <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-[2px]">{t('photos')}</div>
                      </div>
                      <div>
                        <div className="text-[18px] font-medium">
                          {(isDbPhoto ? follow.followersCount : photographer.followers).toLocaleString()}
                        </div>
                        <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-[2px]">{t('followers')}</div>
                      </div>
                    </div>
                    {isDbPhoto ? (
                      follow.isSelf ? (
                        <button className="btn btn-sm w-full mt-6 justify-center" disabled>{t('you')}</button>
                      ) : (
                        <button
                          className={`btn btn-sm w-full mt-6 justify-center ${follow.following ? '' : 'btn-solid'}`}
                          onClick={async () => {
                            const res = await follow.toggle();
                            if (res.kind === 'unauth') {
                              router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
                            }
                          }}
                          disabled={follow.loading}
                        >
                          {follow.following ? t('following') : t('follow')}
                        </button>
                      )
                    ) : (
                      <button className="btn btn-sm w-full mt-6 justify-center">{t('follow')}</button>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] opacity-55">{t('photographer_not_found')}</p>
                )}
              </div>

              {/* 500px-style stats — desktop sidebar (mobile version is in the main column) */}
              <div className="hidden lg:block">
                <PhotoStatsPanel
                  likes={photo.likes}
                  impressions={photo.impressions ?? 0}
                  highestPulse={photo.peakPulse ?? photo.pulse}
                  pickType={photo.pickType}
                  badge={photo.badge}
                />
              </div>

              {/* EXIF */}
              <div className="py-7 border-b border-rule">
                <div className="caps opacity-55 mb-4">{t('capture')}</div>
                <table className="w-full text-[12px] mono border-collapse">
                  <tbody>
                    {(
                      [
                        [t('camera'), photo.exif.camera],
                        [t('lens'), photo.exif.lens],
                        [t('iso'), String(photo.exif.iso)],
                        [t('aperture'), photo.exif.aperture],
                        [t('shutter'), photo.exif.shutter],
                        [t('focal'), photo.exif.focal],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-[6px] opacity-55 w-[40%]">{k.toUpperCase()}</td>
                        <td className="py-[6px]">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* More from this photographer */}
              {more.length > 0 && photographer && (
                <div className="py-7">
                  <div className="caps opacity-55 mb-4">
                    {t('more_from', { name: photographer.name.split(' ')[0] ?? photographer.name })}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {more.map((p: Photo) => (
                      <div
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/photo/${p.id}`)}
                      >
                        <div className="aspect-square bg-tile overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.src}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Similar photos */}
      <section className="py-10 pb-20 rule-top">
        <div className="wrap">
          <SectionHeader
            title={t('in_the_same_vein')}
            eyebrow={t('more_cat', { cat: photo.cat })}
            link={`/explore/${catSlug}`}
            linkLabel={t('see_category')}
          />
          <PhotoGrid photos={similar} cols={3} />
        </div>
      </section>

      <Footer />

      {/* Lightbox */}
      <Lightbox
        src={photo.src}
        alt={photo.title}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
      {/* Report Dialog */}
      <ConfirmDialog
        open={reportOpen}
        title={t('report_photo_title')}
        body={t('report_photo_body')}
        confirmLabel={t('submit_report')}
        onConfirm={() => {
          setReportOpen(false);
          setReportDone(true);
        }}
        onCancel={() => setReportOpen(false)}
      />
    </div>
  );
}
