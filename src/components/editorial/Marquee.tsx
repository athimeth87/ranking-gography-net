'use client';

export interface MarqueeItem {
  num?: string;
  title: string;
  by?: string;
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
        {doubled.map((it, i) => (
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
        ))}
      </div>
    </div>
  );
}
