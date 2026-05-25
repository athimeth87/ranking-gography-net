'use client';

import Link from 'next/link';

export interface MarqueeItem {
  num?: string;
  title: string;
  by?: string;
  avatar?: string;
  href?: string;
  isAmbassador?: boolean;
  isCustomer?: boolean;
}

interface MarqueeProps {
  items: MarqueeItem[];
  speedSec?: number;
}

function MarqueeCrown({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill={color}
      aria-hidden="true"
      style={{ flexShrink: 0, marginRight: 4 }}
    >
      <path d="M2 5 L4 9 L6 4 L8 9 L10 4 L12 9 L14 5 L13 12 L3 12 Z" />
    </svg>
  );
}

export function Marquee({ items, speedSec = 60 }: MarqueeProps) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div
        className="marquee-track"
        style={{ animationDuration: `${speedSec}s` }} /* runtime: speed prop */
      >
        {doubled.map((it, i) => {
          const crownColor = it.isAmbassador ? '#b08e54' : it.isCustomer ? '#c0c0c0' : null;
          const content = (
            <>
              {it.num && <span className="num">{it.num}</span>}
              {it.by && (
                <>
                  {it.avatar && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={it.avatar} alt={it.by} className="w-6 h-6 rounded-full object-cover inline-block" />
                  )}
                  {crownColor && <MarqueeCrown color={crownColor} />}
                  <span className="by">{it.by}</span>
                </>
              )}
            </>
          );

          return it.href ? (
            <Link href={it.href} className="marquee-item hover:opacity-70 transition-opacity" key={`${it.by ?? it.title}-${i}`}>
              {content}
            </Link>
          ) : (
            <span className="marquee-item" key={`${it.by ?? it.title}-${i}`}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
