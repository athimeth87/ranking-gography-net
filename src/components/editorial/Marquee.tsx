'use client';

import Link from 'next/link';

export interface MarqueeItem {
  num?: string;
  title: string;
  by?: string;
  avatar?: string;
  href?: string;
}

interface MarqueeProps {
  items: MarqueeItem[];
  speedSec?: number;
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
          const content = (
            <>
              {it.num && <span className="num">{it.num}</span>}
              <span className="ttl">{it.title}</span>
              {it.by && (
                <>
                  <span className="dot" />
                  {it.avatar && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={it.avatar} alt={it.by} className="w-5 h-5 rounded-full object-cover inline-block mx-1.5" />
                  )}
                  <span className="by">{it.by}</span>
                </>
              )}
            </>
          );

          return it.href ? (
            <Link href={it.href} className="marquee-item hover:opacity-70 transition-opacity" key={`${it.title}-${i}`}>
              {content}
            </Link>
          ) : (
            <span className="marquee-item" key={`${it.title}-${i}`}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
