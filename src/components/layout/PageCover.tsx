import React from 'react';
import { getPhoto, getPhotographer } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { Photo, Photographer } from '@/lib/types';

const DEFAULT_COVER_SRC =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=85&auto=format&fit=crop';

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
interface PageCoverProps {
  photoId?: string;
  src?: string;
  credit?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
  height?: string;
  minHeight?: number;
  maxHeight?: number;
  align?: 'left' | 'center';
}

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
}: PageCoverProps) {
  const photo: Photo | undefined = photoId ? getPhoto(photoId) : undefined;
  const photographer: Photographer | undefined = photo ? getPhotographer(photo.by) : undefined;
  // Uniform cover image across the site unless caller passes an explicit src.
  const imgSrc = src ?? DEFAULT_COVER_SRC;
  const creditLine =
    credit ?? (photo && photographer ? `"${photo.title}" by ${photographer.name}` : null);

  return (
    <section className="relative">
      {/* runtime: from props */}
      <div
        className="relative overflow-hidden bg-black"
        style={{ height, minHeight, maxHeight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={photo?.title ?? (typeof title === 'string' ? title : '') ?? ''}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* gradient overlay top→bottom for legibility */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.5)_0%,rgba(0,0,0,.15)_40%,rgba(0,0,0,.2)_60%,rgba(0,0,0,.7)_100%)]" />

        {/* top strip — eyebrow + spring marker */}
        <div className="absolute top-7 left-4 right-4 md:left-10 md:right-10 flex justify-between items-baseline text-white">
          <div className="mono text-[11px] tracking-[.22em] uppercase opacity-85">
            GOGRAPHY Ranking
          </div>
          {eyebrow && (
            <div className="mono text-[11px] tracking-[.22em] uppercase opacity-85">
              {eyebrow}
            </div>
          )}
        </div>

        {/* main text block */}
        <div
          className={cn(
            'absolute left-4 right-4 md:left-10 md:right-10 bottom-6 md:bottom-14 text-white flex flex-col gap-5',
            align === 'center' ? 'items-center text-center' : 'items-start text-left',
          )}
        >
          <div
            className={cn(
              'flex flex-col',
              align === 'center' ? 'items-center text-center' : 'items-start text-left',
            )}
          >
            {title && (
              <h1
                className={cn(
                  'text-[clamp(20px,4.5vw,54px)] md:text-[clamp(28px,3.6vw,54px)] font-normal tracking-[-.015em] leading-[1.05] text-white m-0',
                  align === 'center' ? 'max-w-[20ch]' : 'max-w-[16ch]',
                )}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="th text-[16px] leading-[1.55] text-white/85 mt-5 mb-0 max-w-[540px]">
                {subtitle}
              </p>
            )}
            {children && (
              <div
                className={cn(
                  'mt-7 flex gap-2.5 flex-wrap',
                  align === 'center' ? 'justify-center' : 'justify-start',
                )}
              >
                {children}
              </div>
            )}
          </div>
        </div>

        {/* credit line — bottom right, small mono */}
        {creditLine && (
          <div className="absolute bottom-3 right-4 md:right-10 text-white/55">
            <div className="mono text-[10px] tracking-[.18em] uppercase">{creditLine}</div>
          </div>
        )}
      </div>
    </section>
  );
}
