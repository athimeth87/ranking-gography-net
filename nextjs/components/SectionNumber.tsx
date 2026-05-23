'use client';
import React from 'react';

/**
 * Editorial section eyebrow:
 *   [01] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FEATURED
 *
 * Use above a section header to anchor the eye and give the layout
 * a magazine / chapter feel.
 */
export function SectionNumber({ n, label }) {
  return (
    <div className="snum">
      <span className="snum-num">{String(n).padStart(2, '0')}</span>
      <span className="snum-rule" />
      <span className="snum-label">{label}</span>
    </div>
  );
}
