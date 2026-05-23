'use client';
import React from 'react';

/**
 * Horizontal scrolling ticker — for photo titles / photographer names.
 * Items duplicate so the loop is seamless. Hover pauses the scroll.
 *
 * Usage:
 *   <Marquee items={[{ num: '01', title: 'Morning fog', by: 'KANTHORN' }, ...]} />
 */
export function Marquee({ items = [], speedSec = 60 }) {
  if (!items.length) return null;
  const renderItem = (it, i) => (
    <span className="marquee-item" key={`${it.title}-${i}`}>
      {it.num && <span className="num">{it.num}</span>}
      <span className="ttl">{it.title}</span>
      {it.by && (
        <>
          <span className="dot" />
          <span className="by">{it.by}</span>
        </>
      )}
    </span>
  );

  // Duplicate items so the seamless loop hits 50% translation == one full pass
  const doubled = [...items, ...items];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" style={{ animationDuration: `${speedSec}s` }}>
        {doubled.map(renderItem)}
      </div>
    </div>
  );
}
