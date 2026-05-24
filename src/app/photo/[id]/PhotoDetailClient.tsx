'use client';
import { useState, useEffect } from 'react';
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
import { LikeButton as DBLikeButton } from '@/components/photo/LikeButton';
import { CommentSection } from '@/components/photo/CommentSection';
import { useFollowState } from '@/hooks/useFollowState';
import { useFavoriteState } from '@/hooks/useFavoriteState';
import { usePathname } from 'next/navigation';

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
  const isUUID = params.id.includes('-');

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photographer, setPhotographer] = useState<Photographer | undefined>(undefined);
  const [photographerUserId, setPhotographerUserId] = useState<string | null>(null);
  const [more, setMore] = useState<Photo[]>([]);
  const [similar, setSimilar] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pathname = usePathname();
  const follow = useFollowState(photographerUserId);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!isUUID) {
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

      // Fetch from Supabase
      const supabase = getSupabaseBrowserClient();
      const { data: pData } = await supabase.from('photos').select('*').eq('id', params.id).single();
      
      if (!pData) {
        setError(true);
        setLoading(false);
        return;
      }

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
        pulse: pData.likes_count || 0,
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
          pulse: md.likes_count || 0,
          rank: 0
        }));
        setMore(mappedMore);
      }

      setLoading(false);
    };
    
    fetchPhoto();
  }, [params.id, isUUID]);

  // Realtime counts: subscribe to the photo row so likes / comments /
  // favorites / pulse update without reloading.
  useEffect(() => {
    if (!isUUID) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`photo-detail-${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `id=eq.${params.id}` },
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
              pulse: likes,
            };
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isUUID, params.id]);

  const favoriteState = useFavoriteState(isUUID ? params.id : '');
  const onFavoriteClick = async () => {
    if (!isUUID) return;
    const res = await favoriteState.toggle();
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Category slug for links
  const catSlug = photo ? photo.cat.toLowerCase() : '';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error || !photo) {
    return <div className="min-h-screen flex items-center justify-center">404 - Photo not found in database</div>;
  }

  const comments: Comment[] = isUUID ? [] : getCommentsFor(photo.id);

  return (
    <div className="page-fade">
      {/* Breadcrumb */}
      <div className="py-5 border-b border-rule">
        <div className="wrap mono flex justify-between text-[11px] tracking-[.14em] uppercase opacity-65">
          <div className="flex items-center">
            <Link href="/explore" className="opacity-70">Explore</Link>
            <span className="opacity-35 mx-3">/</span>
            <Link href={`/explore/${catSlug}`} className="opacity-70">{photo.cat}</Link>
            <span className="opacity-35 mx-3">/</span>
            <span>{photo.id}</span>
          </div>
          <div>
            <span className="opacity-55">Rank</span> #{String(photo.rank).padStart(3, '0')}
            <span className="opacity-35 mx-3">·</span>
            <span className="opacity-55">Posted</span> {photo.date}
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="wrap">
          {/* Two-column layout: main image/info + sidebar */}
          <div className="grid gap-10 md:gap-14 items-start grid-cols-1 lg:grid-cols-[1fr_360px]">

            {/* ---- Main column ---- */}
            <div>
              {/* Photo image — click to open lightbox */}
              <div
                className="relative bg-tile cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-auto block"
                  loading="lazy"
                />
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
                {isUUID ? (
                  <DBLikeButton photoId={photo.id} />
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
                {isUUID ? (
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
                <button className="heart">Copy link</button>
                <button className="heart">Report</button>
              </div>

              {/* Pulse breakdown */}
              <div className="mt-10 md:mt-14 py-6 md:py-8 border-t border-rule border-b border-rule">
                <div className="grid gap-4 md:gap-8 items-baseline grid-cols-3 md:grid-cols-5">
                  <div>
                    <div className="caps opacity-55 mb-2">Pulse</div>
                    <div className="mono font-medium leading-[1] text-[48px] tracking-[-.02em]">
                      {photo.pulse.toFixed(0)}
                    </div>
                  </div>
                  <BreakdownStat label="Likes" val={photo.likes} mult="×1" />
                  <BreakdownStat label="24h likes" val={photo.likes24h} mult="×3" />
                  <BreakdownStat
                    label="Curation"
                    val={photo.picks.length === 2 ? '+100' : photo.picks.length === 1 ? '+50' : '+0'}
                  />
                  <BreakdownStat label="Hours since" val={photo.hours} mult="÷" />
                </div>
              </div>

              {/* Comments */}
              {isUUID ? (
                <CommentSection photoId={photo.id} />
              ) : (
                <div className="mt-14">
                  <SectionHeader title="Comments" eyebrow={`${comments.length} comments`} />
                  <div className="flex flex-col gap-6">
                    {comments.map((c: Comment, i: number) => {
                      const cuser: Photographer | undefined = getPhotographer(c.user);
                      return (
                        <div key={i} className="flex gap-4 pb-6 border-b border-rule">
                          <div className="w-9 h-9 rounded-full bg-tile overflow-hidden shrink-0">
                            {cuser && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={cuser.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-baseline">
                              <Link href={`/photographer/${c.user}`} className="text-[13px] font-medium tracking-[-0.005em]">
                                {cuser?.name ?? c.user}
                              </Link>
                              <span className="mono text-[11px] opacity-50">{c.at}</span>
                            </div>
                            <p className="th mt-2 text-[14px] leading-[1.6]">{c.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                        <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-[2px]">Photos</div>
                      </div>
                      <div>
                        <div className="text-[18px] font-medium">
                          {(isUUID ? follow.followersCount : photographer.followers).toLocaleString()}
                        </div>
                        <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-[2px]">Followers</div>
                      </div>
                    </div>
                    {isUUID ? (
                      follow.isSelf ? (
                        <button className="btn btn-sm w-full mt-6 justify-center" disabled>You</button>
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
                          {follow.following ? 'Following' : 'Follow'}
                        </button>
                      )
                    ) : (
                      <button className="btn btn-sm w-full mt-6 justify-center">Follow</button>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] opacity-55">Photographer not found</p>
                )}
              </div>

              {/* EXIF */}
              <div className="py-7 border-b border-rule">
                <div className="caps opacity-55 mb-4">Capture</div>
                <table className="w-full text-[12px] mono border-collapse">
                  <tbody>
                    {(
                      [
                        ['Camera', photo.exif.camera],
                        ['Lens', photo.exif.lens],
                        ['ISO', String(photo.exif.iso)],
                        ['Aperture', photo.exif.aperture],
                        ['Shutter', photo.exif.shutter],
                        ['Focal', photo.exif.focal],
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
                    More from {photographer.name.split(' ')[0]}
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
            title="In the same vein"
            eyebrow={`More ${photo.cat}`}
            link={`/explore/${catSlug}`}
            linkLabel="See category"
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
    </div>
  );
}
