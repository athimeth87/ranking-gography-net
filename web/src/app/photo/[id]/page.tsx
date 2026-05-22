'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPhoto, getPhotographer, getCommentsFor, getPhotos } from '@/lib/data';
import type { Photo, Comment, Photographer } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { PickBadge } from '@/components/icons';
import { Lightbox } from '@/components/photo/Lightbox';

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

interface LikeButtonProps {
  photoId: string;
  baseLikes: number;
}

function LikeButton({ photoId: _photoId, baseLikes }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  // Runtime-dynamic: count changes based on liked state
  const count = liked ? baseLikes + 1 : baseLikes;

  return (
    <button
      className={`heart${liked ? ' on' : ''}`}
      onClick={() => setLiked((v) => !v)}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
    >
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="13" height="13">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{count.toLocaleString()}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PhotoDetailPage({ params }: { params: { id: string } }) {
  const photo = getPhoto(params.id);
  if (!photo) notFound();

  const photographer: Photographer | undefined = getPhotographer(photo.by);
  const comments: Comment[] = getCommentsFor(photo.id);
  const allPhotos: Photo[] = getPhotos();

  // More from same photographer (up to 4, excluding this photo)
  const more: Photo[] = allPhotos.filter((p) => p.by === photo.by && p.id !== photo.id).slice(0, 4);
  // Similar (same category, up to 6, excluding this photo)
  const similar: Photo[] = allPhotos.filter((p) => p.cat === photo.cat && p.id !== photo.id).slice(0, 6);

  const router = useRouter();

  // Favorite toggle (local mock state)
  const [favorited, setFavorited] = useState(false);
  // Favorite count changes based on favorited state (runtime-dynamic)
  const favoriteCount = favorited ? photo.favorites + 1 : photo.favorites;

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // J/K keyboard navigation between photos (source behavior)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxOpen) return; // don't navigate while lightbox is open
      const idx = allPhotos.findIndex((p) => p.id === photo.id);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        const next = allPhotos[Math.min(idx + 1, allPhotos.length - 1)];
        if (next) router.push(`/photo/${next.id}`);
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        const prev = allPhotos[Math.max(idx - 1, 0)];
        if (prev) router.push(`/photo/${prev.id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photo.id, allPhotos, router, lightboxOpen]);

  // Category slug for links
  const catSlug = photo.cat.toLowerCase();

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
          <div className="grid gap-14 items-start" style={{ gridTemplateColumns: '1fr 360px' }}>

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
                <LikeButton photoId={photo.id} baseLikes={photo.likes} />

                {/* Favorite button — runtime-dynamic class based on favorited state */}
                <button
                  className={`heart${favorited ? ' on' : ''}`}
                  onClick={() => setFavorited((v) => !v)}
                  aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={favorited}
                >
                  <svg viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                  <span>{favoriteCount}</span>
                </button>

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
              <div className="mt-14 py-8 border-t border-rule border-b border-rule">
                <div className="grid gap-8 items-baseline" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                  <div>
                    <div className="caps opacity-55 mb-2">Pulse</div>
                    {/* Runtime-dynamic font size for pulse number */}
                    <div className="mono font-medium leading-[1]" style={{ fontSize: 48, letterSpacing: '-.02em' }}>
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
                <div className="mt-4">
                  <Link
                    href="/about-ranking"
                    className="mono text-[11px] tracking-[.14em] uppercase opacity-65 border-b border-rule pb-[2px]"
                  >
                    How Pulse is calculated →
                  </Link>
                </div>
              </div>

              {/* Comments */}
              <div className="mt-14">
                <SectionHeader title="Comments" eyebrow={`${comments.length} comments`} />
                <div className="flex gap-3 mb-8">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="พิมพ์Commentsของคุณ — ใช้ @ เพื่อ mention"
                  />
                  <button className="btn">Post</button>
                </div>
                <div className="flex flex-col gap-6">
                  {comments.map((c: Comment, i: number) => {
                    const cuser: Photographer | undefined = getPhotographer(c.user);
                    return (
                      <div key={i} className="flex gap-4 pb-6 border-b border-rule">
                        <div className="w-9 h-9 rounded-full bg-tile overflow-hidden shrink-0">
                          {cuser && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cuser.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <Link
                              href={`/photographer/${c.user}`}
                              className="text-[13px] font-medium tracking-[-0.005em]"
                            >
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
            </div>

            {/* ---- Sidebar ---- */}
            <aside className="sticky top-[100px]">
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
                        <div className="text-[18px] font-medium">{photographer.followers.toLocaleString()}</div>
                        <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-[2px]">Followers</div>
                      </div>
                    </div>
                    <button className="btn btn-sm w-full mt-6 justify-center">Follow</button>
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
