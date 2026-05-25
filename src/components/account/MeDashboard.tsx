'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { VoyageurMark } from '@/components/icons';
import { DashStat, ActionCard } from './primitives';
import { useNotifications } from '@/hooks/useNotifications';
import { formatNotificationBody } from '@/lib/data/notifications';
import type { Photographer, Photo } from '@/lib/types';

const ACTIVITY_PAGE = 5;

function timeAgoThai(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'เมื่อวาน';
  if (d < 7) return `${d} วันก่อน`;
  return new Date(iso).toLocaleDateString();
}

interface MeDashboardProps {
  persona: Photographer;
  isVoyageur: boolean;
  isPhotographer: boolean;
  myPhotos: Photo[];
  followers: number;
  following: number;
}

export function MeDashboard({ persona, isVoyageur, isPhotographer, myPhotos, followers, following }: MeDashboardProps) {
  const router = useRouter();
  const { notifications } = useNotifications();

  const totalLikes = myPhotos.reduce((s, p) => s + p.likes, 0);
  const totalFav = myPhotos.reduce((s, p) => s + p.favorites, 0);
  const totalComments = myPhotos.reduce((s, p) => s + p.comments, 0);
  const totalPulse = myPhotos.reduce((s, p) => s + p.pulse, 0);
  const editorPicks = myPhotos.filter((p) => p.picks.includes('editor')).length;

  const [activityVisible, setActivityVisible] = useState(ACTIVITY_PAGE);
  const visibleActivity = notifications.slice(0, activityVisible);
  const hiddenActivity = Math.max(0, notifications.length - visibleActivity.length);

  return (
    <div>
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-rule">
        <DashStat n={myPhotos.length} l="Photos" />
        <DashStat n={followers.toLocaleString()} l="Followers" border />
        <DashStat n={totalLikes.toLocaleString()} l="Likes received" border />
        <DashStat n={totalPulse.toFixed(0)} l="Pulse" border />
      </div>
      <div className="mt-3 mono text-[11px] opacity-55 tracking-[.08em]">
        FOLLOWING {following.toLocaleString()} · FAVORITES {totalFav.toLocaleString()}
      </div>

      {/* Voyageur eligibility card */}
      {isVoyageur && (
        <div className="mt-8 p-6 md:py-7 md:px-8 bg-cream border border-rule">
          <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b border-rule">
            <div className="caps opacity-55 flex items-center gap-2 min-w-0">
              <VoyageurMark size={9} />
              <span className="truncate">Voyageurs Awards · Spring 2026</span>
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="text-[28px] md:text-[32px] font-medium tracking-[-0.025em] text-gold leading-none">
                5%
              </span>
              <span className="mono text-[10px] opacity-55 tracking-[.12em]">CASHBACK</span>
            </div>
          </div>
          <h3 className="th text-[20px] md:text-[22px] font-normal tracking-[-0.01em] m-0 leading-[1.35]">
            คุณอยู่อันดับ <strong className="font-semibold">#7</strong> ในหมวด Landscape
          </h3>
          <p className="th mt-3 text-[13px] text-fg-soft leading-[1.7] max-w-[480px]">
            เหลือเวลา 42 วัน ก่อนปิดประกวด
          </p>
          <button
            onClick={() => router.push('/for-customers')}
            className="caps mt-5 opacity-65 border-b border-rule pb-[3px] cursor-pointer"
          >
            How to reach 10% →
          </button>
        </div>
      )}

      {/* Photographer pick alert */}
      {isPhotographer && editorPicks > 0 && (
        <div className="mt-8 px-7 py-6 bg-cream border border-rule flex justify-between items-center">
          <div>
            <div className="caps opacity-55 mb-2">★ Rank Master recognition</div>
            <div className="th text-[17px] font-medium">
              คุณได้รับ Rank Master {editorPicks} ครั้งในฤดูกาลนี้ — ติดอันดับ Top 10 ของ Leaderboard
            </div>
          </div>
          <button onClick={() => router.push('/me/stats')} className="btn btn-sm">
            View stats
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-14">
        <div className="caps opacity-55 mb-5">Quick actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ActionCard title="Submit new photo" sub="1 upload per day" onClick={() => router.push('/upload')} />
          <ActionCard
            title="Reply to comments"
            sub={`${totalComments.toLocaleString()} total comments`}
            onClick={() => router.push('/me/photos')}
          />
          <ActionCard title="Vote & Favorite" sub="Discover new photos" onClick={() => router.push('/explore')} />
        </div>
      </div>

      {/* Recent photos */}
      {myPhotos.length > 0 && (
        <div className="mt-14">
          <div className="flex justify-between items-baseline mb-5">
            <div className="caps opacity-55">Your photos this season</div>
            <button
              onClick={() => router.push('/me/photos')}
              className="caps cursor-pointer border-b border-rule pb-[3px] opacity-65"
            >
              See all →
            </button>
          </div>
          <PhotoGrid photos={myPhotos.slice(0, 4)} cols={4} uniform />
        </div>
      )}

      {/* Activity feed */}
      <div className="mt-14">
        <div className="caps opacity-55 mb-5">Recent activity</div>
        {notifications.length === 0 ? (
          <div className="opacity-50 text-[13px] py-4">No recent activity yet.</div>
        ) : (
          <>
            <ul className="list-none p-0 m-0 text-[14px] leading-[1.7]">
              {visibleActivity.map((n) => (
                <li
                  key={n.id}
                  className="th grid gap-6 py-[14px] border-b border-rule grid-cols-[120px_1fr] cursor-pointer hover:opacity-80"
                  onClick={() => { if (n.related_url) router.push(n.related_url); }}
                >
                  <span className="mono text-[11px] opacity-55 tracking-[.08em] pt-[2px]">
                    {timeAgoThai(n.created_at).toUpperCase()}
                  </span>
                  <span>{formatNotificationBody(n)}</span>
                </li>
              ))}
            </ul>
            {hiddenActivity > 0 && (
              <button
                type="button"
                className="mt-6 mx-auto block caps text-[11px] tracking-[0.12em] opacity-65 hover:opacity-100 border-b border-rule pb-[2px]"
                onClick={() => setActivityVisible((c) => c + ACTIVITY_PAGE)}
              >
                Read more ({hiddenActivity})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
