'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { SectionHeader, LikeButton } from '@/components/Shared';

// ===== Ported from pages/photo.jsx =====
// Single photo page — large image + sidebar (photographer, EXIF, stats, comments)

function PagePhoto({ id }) {
  const photo = PHOTOS.find(p => p.id === id) || PHOTOS[0];
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const comments = COMMENTS[photo.id] || COMMENTS.default;
  const more = PHOTOS.filter(p => p.by === photo.by && p.id !== photo.id).slice(0, 4);
  const similar = PHOTOS.filter(p => p.cat === photo.cat && p.id !== photo.id).slice(0, 6);
  const router = useRouter();

  // J/K navigation
  React.useEffect(() => {
    const onKey = (e) => {
      const idx = PHOTOS.findIndex(p => p.id === photo.id);
      if (e.key === 'j' || e.key === 'ArrowDown') router.push(`/photo/${PHOTOS[Math.min(idx+1, PHOTOS.length-1)].id}`);
      if (e.key === 'k' || e.key === 'ArrowUp') router.push(`/photo/${PHOTOS[Math.max(idx-1, 0)].id}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photo.id]);

  return (
    <div className="page-fade">
      {/* Breadcrumb */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--rule)' }}>
        <div className="wrap mono" style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .65, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Link href="/explore" style={{ opacity: .7 }}>Explore</Link>
            <span style={{ opacity: .35, margin: '0 12px' }}>/</span>
            <Link href={`/explore/${photo.cat.toLowerCase()}`} style={{ opacity: .7 }}>{photo.cat}</Link>
            <span style={{ opacity: .35, margin: '0 12px' }}>/</span>
            <span>{photo.id}</span>
          </div>
          <div>
            <span style={{ opacity: .55 }}>Rank</span> #{String(photo.rank).padStart(3,'0')}
            <span style={{ opacity: .35, margin: '0 12px' }}>·</span>
            <span style={{ opacity: .55 }}>Posted</span> {photo.date}
          </div>
        </div>
      </div>

      <section style={{ padding: '48px 0' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56, alignItems: 'start' }}>
            {/* Photo */}
            <div>
              <div style={{ position: 'relative', background: 'var(--tile)' }}>
                <img src={photo.src} alt={photo.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                <div>
                  <div className="caps" style={{ opacity: .55, marginBottom: 6 }}>{photo.cat}</div>
                  <h1 style={{ fontSize: 40, fontWeight: 400, letterSpacing: '-.02em', margin: 0, lineHeight: 1.1 }} className="th">{photo.title}</h1>
                  <p style={{ marginTop: 16, fontSize: 15, color: 'var(--fg-soft)', lineHeight: 1.7, maxWidth: 540 }} className="th">{photo.caption}</p>
                </div>
                {photo.picks.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
              <div style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center' }}>
                <LikeButton photoId={photo.id} baseLikes={photo.likes} />
                <button className="heart">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                  <span>{photo.favorites}</span>
                </button>
                <button className="heart">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                  <span>{photo.comments}</span>
                </button>
                <div style={{ flex: 1 }} />
                <button className="heart">Copy link</button>
                <button className="heart">Report</button>
              </div>

              {/* Pulse breakdown */}
              <div style={{ marginTop: 56, padding: '32px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 32, alignItems: 'baseline' }}>
                  <div>
                    <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>Pulse</div>
                    <div style={{ fontSize: 48, fontWeight: 500, fontFamily: 'var(--mono)', letterSpacing: '-.02em', lineHeight: 1 }}>{photo.pulse.toFixed(0)}</div>
                  </div>
                  <BreakdownStat label="Likes" val={photo.likes} mult="×1" />
                  <BreakdownStat label="24h likes" val={photo.likes24h} mult="×3" />
                  <BreakdownStat label="Curation" val={
                    photo.picks.length === 2 ? '+100' : (photo.picks.length === 1 ? '+50' : '+0')
                  } />
                  <BreakdownStat label="Hours since" val={photo.hours} mult="÷" />
                </div>
              </div>

              {/* Comments */}
              <div style={{ marginTop: 56 }}>
                <SectionHeader title="Comments" eyebrow={`${comments.length} comments`} />
                <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                  <input type="text" className="input" placeholder="พิมพ์Commentsของคุณ — ใช้ @ เพื่อ mention" style={{ flex: 1 }} />
                  <button className="btn">Post</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {comments.map((c, i) => {
                    const cuser = PHOTOGRAPHERS.find(p => p.username === c.user);
                    return (
                      <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden', flexShrink: 0 }}>
                          {cuser && <img src={cuser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <Link href={`/photographer/${c.user}`} style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-.005em' }}>{cuser?.name || c.user}</Link>
                            <span className="mono" style={{ fontSize: 11, opacity: .5 }}>{c.at}</span>
                          </div>
                          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6 }} className="th">{c.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside style={{ position: 'sticky', top: 100 }}>
              {/* Photographer card */}
              <div style={{ padding: '28px 0', borderTop: '1px solid var(--fg)', borderBottom: '1px solid var(--rule)' }}>
                <Link href={`/photographer/${photographer.username}`} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-.005em' }}>{photographer.name}</div>
                    <div className="caps" style={{ opacity: .55, marginTop: 4 }}>{photographer.loc}</div>
                  </div>
                </Link>
                <p style={{ marginTop: 18, fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.65 }} className="th">{photographer.bio}</p>
                <div style={{ display: 'flex', gap: 24, marginTop: 20 }} className="mono">
                  <div><div style={{ fontSize: 18, fontWeight: 500 }}>{photographer.photos}</div><div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginTop: 2 }}>Photos</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 500 }}>{photographer.followers.toLocaleString()}</div><div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginTop: 2 }}>Followers</div></div>
                </div>
                <button className="btn btn-sm" style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}>Follow</button>
              </div>

              {/* EXIF */}
              <div style={{ padding: '28px 0', borderBottom: '1px solid var(--rule)' }}>
                <div className="caps" style={{ opacity: .55, marginBottom: 16 }}>Capture</div>
                <table style={{ width: '100%', fontSize: 12, fontFamily: 'var(--mono)', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Camera', photo.exif.camera],
                      ['Lens', photo.exif.lens],
                      ['ISO', photo.exif.iso],
                      ['Aperture', photo.exif.aperture],
                      ['Shutter', photo.exif.shutter],
                      ['Focal', photo.exif.focal],
                    ].map(([k,v]) => (
                      <tr key={k}>
                        <td style={{ padding: '6px 0', opacity: .55, width: '40%' }}>{k.toUpperCase()}</td>
                        <td style={{ padding: '6px 0' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* More from this photographer */}
              {more.length > 0 && (
                <div style={{ padding: '28px 0' }}>
                  <div className="caps" style={{ opacity: .55, marginBottom: 16 }}>More from {photographer.name.split(' ')[0]}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {more.map(p => (
                      <div key={p.id} onClick={() => router.push(`/photo/${p.id}`)} style={{ cursor: 'pointer' }}>
                        <div style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                          <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* Similar */}
      <section style={{ padding: '40px 0 80px' }} className="rule-top">
        <div className="wrap">
          <SectionHeader title="In the same vein" eyebrow={`More ${photo.cat}`} link={`/explore/${photo.cat.toLowerCase()}`} linkLabel="See category" />
          <PhotoGrid photos={similar} cols={3} />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function BreakdownStat({ label, val, mult }) {
  return (
    <div>
      <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 24, fontFamily: 'var(--mono)', fontWeight: 500 }}>{typeof val === 'number' ? val.toLocaleString() : val}</span>
        {mult && <span className="mono" style={{ fontSize: 11, opacity: .55 }}>{mult}</span>}
      </div>
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page({ params }) { return <PagePhoto id={params.id} />; }
