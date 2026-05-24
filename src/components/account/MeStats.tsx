'use client';
import { DashStat } from './primitives';
import type { Photographer, Photo } from '@/lib/types';

interface MeStatsProps {
  persona: Photographer;
  myPhotos: Photo[];
}

export function MeStats({ myPhotos }: MeStatsProps) {
  const totalLikes = myPhotos.reduce((s, p) => s + p.likes, 0);
  const totalFav = myPhotos.reduce((s, p) => s + p.favorites, 0);
  const avgPulse = myPhotos.length
    ? (myPhotos.reduce((s, p) => s + p.pulse, 0) / myPhotos.length).toFixed(0)
    : 0;

  // Synthesize 14-day pulse trend (deterministic from avgPulse)
  const trend = Array.from({ length: 14 }, (_, i) => {
    const base = Number(avgPulse);
    const noise = Math.sin(i * 0.8) * 8 + Math.cos(i * 0.4) * 4;
    return Math.max(5, base * (0.6 + i / 30) + noise);
  });
  const max = Math.max(...trend);

  // SVG chart dimensions
  const W = trend.length * 40; // runtime: computed from trend length
  const H = 200;

  return (
    <div>
      <div className="caps opacity-55 mb-[14px]">Analytics</div>
      <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">Stats</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mt-10 border border-rule">
        <DashStat n={myPhotos.length} l="Photos" />
        <DashStat n={totalLikes.toLocaleString()} l="Likes (90d)" border />
        <DashStat n={totalFav.toLocaleString()} l="Favorites" border />
        <DashStat n={avgPulse} l="Avg Pulse" border />
      </div>

      {/* Pulse trend chart */}
      <div className="mt-14">
        <div className="flex justify-between items-baseline mb-5">
          <div className="caps opacity-55">Pulse trend · 14 days</div>
          <div className="mono text-[11px] opacity-55">
            {/* runtime: peak value from trend data */}
            Peak {max.toFixed(0)}
          </div>
        </div>
        <div className="relative h-[240px] border border-rule px-4 pt-6 pb-8">
          {/* SVG path, coords, and viewBox are runtime-computed from trend array */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line
                key={t}
                x1="0"
                y1={H * t}
                x2={W}
                y2={H * t}
                stroke="currentColor"
                strokeOpacity={t === 1 || t === 0 ? 0.15 : 0.08}
                strokeWidth="1"
              />
            ))}
            {/* Line path — d attribute is runtime-computed from trend data */}
            <path
              d={trend
                .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * 40 + 20} ${H - (v / max) * 180}`)
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Dots — cx/cy are runtime-computed from trend data */}
            {trend.map((v, i) => (
              <circle
                key={i}
                cx={i * 40 + 20}
                cy={H - (v / max) * 180}
                r="3"
                fill="currentColor"
              />
            ))}
          </svg>
          {/* X-axis labels */}
          <div className="absolute bottom-2 left-6 right-6 flex justify-between mono text-[9px] opacity-45 tracking-[.1em]">
            <span>14D AGO</span>
            <span>7D AGO</span>
            <span>TODAY</span>
          </div>
        </div>
      </div>

      {/* Top performing photos table */}
      <div className="mt-14">
        <div className="caps opacity-55 mb-5">Top performing this season</div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-fg">
              <th className="caps text-left py-3 opacity-55">Photo</th>
              <th className="caps text-right py-3 opacity-55">Pulse</th>
              <th className="caps text-right py-3 opacity-55">Likes</th>
              <th className="caps text-right py-3 opacity-55">Fav</th>
              <th className="caps text-right py-3 opacity-55">Rank</th>
            </tr>
          </thead>
          <tbody className="mono text-[13px]">
            {myPhotos.slice(0, 6).map((p) => (
              <tr key={p.id} className="border-b border-rule">
                <td className="py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-tile overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <span className="font-[var(--sans)] text-[14px] th">{p.title}</span>
                </td>
                <td className="text-right font-medium py-3">{p.pulse.toFixed(0)}</td>
                <td className="text-right py-3">{p.likes}</td>
                <td className="text-right py-3">{p.favorites}</td>
                <td className="text-right py-3">#{p.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
