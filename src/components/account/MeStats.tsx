'use client';
import { DashStat } from './primitives';
import type { Photographer, Photo } from '@/lib/types';
import { ActivityHeatmap } from './ActivityHeatmap';
import { formatScore } from '@/lib/pulse';

interface MeStatsProps {
  persona: Photographer;
  myPhotos: Photo[];
  favDates?: string[];
}

export function MeStats({ myPhotos, favDates = [] }: MeStatsProps) {
  const totalLikes = myPhotos.reduce((s, p) => s + p.likes, 0);
  const totalFav = myPhotos.reduce((s, p) => s + p.favorites, 0);
  const totalViews = myPhotos.reduce((s, p) => s + (p.impressions ?? 0), 0);
  const avgPulse = myPhotos.length
    ? formatScore(myPhotos.reduce((s, p) => s + p.pulse, 0) / myPhotos.length)
    : '0.0';
  const topPhotos = [...myPhotos].sort((a, b) => b.pulse - a.pulse).slice(0, 6);

  return (
    <div>
      <div className="caps opacity-55 mb-[14px]">Analytics</div>
      <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">Stats</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 mt-10 border border-rule">
        <DashStat n={myPhotos.length} l="Photos" />
        <DashStat n={totalViews.toLocaleString()} l="Total Views" border />
        <DashStat n={totalLikes.toLocaleString()} l="Likes (90d)" border />
        <DashStat n={totalFav.toLocaleString()} l="Favorites" border />
        <DashStat n={avgPulse} l="Avg Pulse" border />
      </div>

      {/* Voting activity heatmap */}
      <div className="mt-14">
        <div className="flex justify-between items-baseline mb-5">
          <div className="caps opacity-55">Voting activity</div>
          <div className="mono text-[11px] opacity-55">{favDates.length} votes · 12 mo</div>
        </div>
        <div className="border border-rule p-5">
          <ActivityHeatmap dates={favDates} />
        </div>
      </div>

      {/* Top performing photos — ranked list */}
      <div className="mt-14">
        <div className="caps opacity-55 mb-5">Top performing this season</div>
        <div className="border-t border-rule">
          {topPhotos.map((p, i) => (
            <div key={p.id} className="flex items-center gap-5 py-4 border-b border-rule">
              <span className="mono text-[14px] opacity-40 w-5 text-right shrink-0">{i + 1}</span>
              <div className="w-12 h-12 bg-tile overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="th text-[15px] truncate">{p.title}</div>
                <div className="mt-2 h-[3px] bg-tile overflow-hidden">
                  <div className="h-full bg-fg" style={{ width: `${Math.min(100, p.pulse)}%` }} />
                </div>
                <div className="mono text-[10px] opacity-45 mt-2 flex gap-4">
                  <span>{p.likes.toLocaleString()} likes</span>
                  <span>{p.favorites.toLocaleString()} fav</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="mono text-[24px] font-medium leading-none">{formatScore(p.pulse)}</div>
                <div className="caps text-[9px] opacity-45 mt-1.5">Pulse</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
