'use client';
import { useRouter } from 'next/navigation';
import { PHOTOS, PHOTOGRAPHERS } from '@/lib/data';
import { VoyageurMark, CrownIcon } from './Icons';

// Compute "rating" = sum of pulse scores of a photographer's photos.
// This rewards both quantity and quality — a single viral shot is great,
// but consistent output across the whole catalogue scores higher.
function buildTrending(limit = 8) {
  const scores = new Map();
  PHOTOS.forEach((p) => {
    scores.set(p.by, (scores.get(p.by) || 0) + (p.pulse || 0));
  });
  return PHOTOGRAPHERS
    .map((p) => ({
      ...p,
      rating: scores.get(p.username) || 0,
      topPhoto: PHOTOS.find((ph) => ph.by === p.username),
    }))
    .filter((p) => p.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function TrendingPhotographers({ limit = 8, title = 'Trending' }) {
  const router = useRouter();
  const list = buildTrending(limit);

  return (
    <aside className="trending">
      <div className="trending-head">
        <div className="trending-title">{title}</div>
        <div className="trending-sub mono">Most rated this season</div>
      </div>
      <div className="trending-list">
        {list.map((p, i) => (
          <button
            key={p.username}
            className="trending-row"
            onClick={() => router.push(`/photographer/${p.username}`)}
          >
            <div className="trending-rank mono">{String(i + 1).padStart(2, '0')}</div>
            <div className="trending-thumb">
              <img src={p.topPhoto?.src || p.avatar} alt="" loading="lazy" />
            </div>
            <div className="trending-meta">
              <div className="trending-name">
                {p.isAmbassador && <CrownIcon size={9} />}
                {p.isCustomer && <VoyageurMark size={7} />}
                <span>{p.name}</span>
              </div>
              <div className="trending-stats mono">
                <span>★ {Math.round(p.rating).toLocaleString()}</span>
                <span className="dot">·</span>
                <span>{p.photos} photos</span>
              </div>
              <div className="trending-loc caps">{p.loc}</div>
            </div>
          </button>
        ))}
      </div>
      <button
        className="trending-cta"
        onClick={() => router.push('/photographers')}
      >
        <span>View all photographers</span>
        <span className="arr">→</span>
      </button>
    </aside>
  );
}
