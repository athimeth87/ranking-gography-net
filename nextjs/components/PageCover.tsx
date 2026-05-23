'use client';
import React from 'react';
import { findPhoto, findPhotographer, PHOTOS } from '@/lib/data';

/**
 * Full-width cinematic page hero. White text over darkened image.
 * Pass `photoId` to pull from mock data, or `src`/`credit` directly.
 *
 * Slots:
 *   eyebrow   — small uppercase line above title (e.g. "About")
 *   title     — main display heading
 *   subtitle  — secondary line under title (Thai-friendly)
 *   children  — optional CTAs / extra content rendered under subtitle
 */
export function PageCover({
  photoId,
  src,
  credit,
  eyebrow,
  title,
  subtitle,
  children,
  height = '56vh',
  minHeight = 420,
  maxHeight = 640,
  align = 'left',
}) {
  const photo = photoId ? findPhoto(photoId) : null;
  const photographer = photo ? findPhotographer(photo.by) : null;
  const imgSrc = src || photo?.src || PHOTOS[0].src;
  const creditLine = credit
    || (photo && photographer ? `"${photo.title}" by ${photographer.name}` : null);

  const textAlign = align === 'center' ? 'center' : 'left';
  const alignItems = align === 'center' ? 'items-center' : 'items-start';

  return (
    <section className="relative">
      <div
        className="relative overflow-hidden bg-black"
        style={{ height, minHeight, maxHeight }}
      >
        <img
          src={imgSrc}
          alt={photo?.title || title || ''}
          className="w-full h-full object-cover"
        />
        {/* gradient overlay top→bottom for legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.2) 60%, rgba(0,0,0,.7) 100%)',
          }}
        />

        {/* top strip — eyebrow + spring marker */}
        <div className="absolute top-4 sm:top-7 left-4 right-4 sm:left-10 sm:right-10 flex justify-between items-baseline text-white">
          <div className="mono uppercase opacity-85 text-[10px] sm:text-[11px] tracking-[.18em] sm:tracking-[.22em]">
            GOGRAPHY Photo Awards
          </div>
          {eyebrow && (
            <div className="mono uppercase opacity-85 text-[10px] sm:text-[11px] tracking-[.18em] sm:tracking-[.22em]">
              {eyebrow}
            </div>
          )}
        </div>

        {/* main text block */}
        <div
          className={`absolute bottom-6 sm:bottom-14 left-4 right-4 sm:left-10 sm:right-10 text-white flex flex-col gap-5 ${alignItems}`}
          style={{ textAlign }}
        >
          <div className={`wrap flex flex-col ${alignItems}`} style={{ padding: 0, maxWidth: 'none', textAlign }}>
            {title && (
              <h1
                className="th text-white m-0"
                style={{
                  fontSize: 'clamp(34px, 9vw, 96px)',
                  fontWeight: 300,
                  letterSpacing: '-.03em',
                  lineHeight: 1.02,
                  maxWidth: align === 'center' ? '20ch' : '16ch',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className="th text-[14px] sm:text-[16px] leading-[1.55] mt-4 sm:mt-5"
                style={{
                  color: 'rgba(255,255,255,.85)',
                  margin: 0,
                  marginTop: 16,
                  maxWidth: 540,
                }}
              >
                {subtitle}
              </p>
            )}
            {children && (
              <div
                className={`mt-6 sm:mt-7 flex flex-wrap gap-2.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}
              >
                {children}
              </div>
            )}
          </div>
        </div>

        {/* credit line — bottom right, small mono */}
        {creditLine && (
          <div className="absolute bottom-2 right-4 sm:right-10 text-white/55">
            <div className="mono uppercase text-[9px] sm:text-[10px] tracking-[.16em] sm:tracking-[.18em]">
              {creditLine}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
