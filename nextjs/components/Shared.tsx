'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PHOTOS } from '@/lib/data';
import { VoyageurMark } from '@/components/Icons';

export function SectionHeader({ eyebrow, title, link, linkLabel }) {
  const router = useRouter();
  return (
    <div className="section-h">
      <div>
        {eyebrow && (
          <div className="caps" style={{ marginBottom: 14, opacity: 0.55 }}>{eyebrow}</div>
        )}
        <h2 className="th">{title}</h2>
      </div>
      {link && (
        <button
          className="caps"
          onClick={() => router.push(link)}
          style={{ cursor: 'pointer', borderBottom: '1px solid var(--fg)', paddingBottom: 4 }}
        >
          {linkLabel} →
        </button>
      )}
    </div>
  );
}

export function LikeButton({ photoId, baseLikes }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      setLiked(Boolean(map[photoId]));
    } catch {}
  }, [photoId]);

  const toggle = (e) => {
    e?.stopPropagation();
    const next = !liked;
    setLiked(next);
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      map[photoId] = next;
      localStorage.setItem('gpa-liked', JSON.stringify(map));
    } catch {}
  };

  return (
    <button
      className={'heart ' + (liked ? 'on' : '')}
      onClick={toggle}
      title="โหวตภาพนี้ — 1 ภาพต่อ 1 ครั้ง"
    >
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
        <path d="M12 21s-7-4.5-9.5-9.5C0 6 4 2 7.5 2c2 0 3.5 1 4.5 2.5C13 3 14.5 2 16.5 2 20 2 24 6 21.5 11.5 19 16.5 12 21 12 21z" />
      </svg>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {(baseLikes + (liked ? 1 : 0)).toLocaleString()}
      </span>
    </button>
  );
}

export function PhotographerCard({ photographer, variant = 'general' }) {
  const router = useRouter();
  const theirPhotos = PHOTOS.filter((p) => p.by === photographer.username).slice(0, 4);
  while (theirPhotos.length < 4) theirPhotos.push(PHOTOS[0]);
  const lastTrip = photographer.customerTrips?.[0];

  return (
    <div
      onClick={() => router.push(`/photographer/${photographer.username}`)}
      style={{
        cursor: 'pointer',
        background: variant === 'voyageur' ? 'var(--cream)' : 'transparent',
        border: '1px solid var(--rule)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {theirPhotos.slice(0, 4).map((p, i) => (
          <div key={p.id + i} style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
            <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -28,
            transform: 'translateX(-50%)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid ' + (variant === 'voyageur' ? 'var(--cream)' : 'var(--bg)'),
            background: 'var(--tile)',
          }}
        >
          <img src={photographer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      <div style={{ paddingTop: 40, textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {variant === 'voyageur' && (
          <div
            className="caps"
            style={{
              opacity: 0.7,
              fontSize: 10,
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <VoyageurMark />
            <span>Voyageur</span>
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-.005em', marginBottom: 4 }}>{photographer.name}</div>
        <div className="caps" style={{ opacity: 0.55, fontSize: 10 }}>
          {photographer.loc}
        </div>
        {variant === 'voyageur' && lastTrip && (
          <div className="mono" style={{ marginTop: 14, fontSize: 10, letterSpacing: '.06em', opacity: 0.55, lineHeight: 1.5 }}>
            ◇ {lastTrip}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button
            className="btn btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/photographer/${photographer.username}`);
            }}
          >
            {variant === 'voyageur' ? 'View collection' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  );
}
