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
  const wrapJustify = align === 'center' ? 'center' : 'flex-start';

  return (
    <section style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          height,
          minHeight,
          maxHeight,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <img
          src={imgSrc}
          alt={photo?.title || title || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* gradient overlay top→bottom for legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.2) 60%, rgba(0,0,0,.7) 100%)',
          }}
        />

        {/* top strip — eyebrow + spring marker */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 40,
            right: 40,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            color: '#fff',
          }}
        >
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', opacity: 0.85 }}>
            GOGRAPHY Photo Awards
          </div>
          {eyebrow && (
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', opacity: 0.85 }}>
              {eyebrow}
            </div>
          )}
        </div>

        {/* main text block */}
        <div
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            bottom: 56,
            color: '#fff',
            textAlign,
            display: 'flex',
            flexDirection: 'column',
            alignItems: align === 'center' ? 'center' : 'flex-start',
            gap: 20,
          }}
        >
          <div className="wrap" style={{ padding: 0, maxWidth: 'none', display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign }}>
            {title && (
              <h1
                className="th"
                style={{
                  fontSize: 'clamp(48px, 6.5vw, 96px)',
                  fontWeight: 300,
                  letterSpacing: '-.03em',
                  margin: 0,
                  lineHeight: 0.95,
                  color: '#fff',
                  maxWidth: align === 'center' ? '20ch' : '16ch',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className="th"
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,.85)',
                  margin: '20px 0 0',
                  maxWidth: 540,
                }}
              >
                {subtitle}
              </p>
            )}
            {children && (
              <div
                style={{
                  marginTop: 28,
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  justifyContent: wrapJustify,
                }}
              >
                {children}
              </div>
            )}
          </div>
        </div>

        {/* credit line — bottom right, small mono */}
        {creditLine && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 40,
              color: 'rgba(255,255,255,.55)',
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
              }}
            >
              {creditLine}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
