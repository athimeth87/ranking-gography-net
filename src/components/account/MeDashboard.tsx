'use client';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { VoyageurMark } from '@/components/icons';
import { DashStat, ActionCard } from './primitives';
import type { Photographer, Photo } from '@/lib/types';

interface MeDashboardProps {
  persona: Photographer;
  isVoyageur: boolean;
  isPhotographer: boolean;
  myPhotos: Photo[];
}

export function MeDashboard({ persona, isVoyageur, isPhotographer, myPhotos }: MeDashboardProps) {
  const router = useRouter();

  const totalLikes = myPhotos.reduce((s, p) => s + p.likes, 0);
  const totalFav = myPhotos.reduce((s, p) => s + p.favorites, 0);
  const totalPulse = myPhotos.reduce((s, p) => s + p.pulse, 0);
  const editorPicks = myPhotos.filter((p) => p.picks.includes('editor')).length;

  return (
    <div>
      <div className="caps opacity-55 mb-4">Welcome back</div>
      <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">
        {persona.name.split(' ')[0]}
      </h1>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-0 mt-12 border border-rule">
        <DashStat n={myPhotos.length} l="Photos" />
        <DashStat n={totalLikes.toLocaleString()} l="Likes received" border />
        <DashStat n={totalFav.toLocaleString()} l="Favorites" border />
        <DashStat n={totalPulse.toFixed(0)} l="Total Pulse" border />
      </div>

      {/* Voyageur eligibility card */}
      {isVoyageur && (
        <div className="mt-8 py-7 px-8 bg-cream border border-rule">
          <div className="flex justify-between items-start gap-6">
            <div>
              <div className="caps opacity-55 mb-[10px] flex items-center gap-2">
                <VoyageurMark size={9} /> Voyageurs Awards · Spring 2026
              </div>
              <h3 className="th text-[22px] font-normal tracking-[-0.01em] m-0">
                คุณอยู่อันดับ <strong className="font-semibold">#7</strong> ในหมวด Landscape
              </h3>
              <p className="th mt-3 text-[13px] text-fg-soft leading-[1.7] max-w-[480px]">
                ส่งภาพอีก 5 ภาพในฤดูกาลนี้เพื่อขึ้น Top 5 · เหลือเวลา 42 วัน ก่อนปิดประกวด
              </p>
            </div>
            <div className="text-right min-w-[140px]">
              <div className="mono text-[11px] opacity-55">CASHBACK TIER</div>
              <div
                className="text-[36px] font-medium tracking-[-0.025em] mt-[6px] text-gold"
              >
                5%
              </div>
              <button
                onClick={() => router.push('/for-customers')}
                className="caps mt-[14px] opacity-60 border-b border-rule pb-[3px] cursor-pointer"
              >
                How to reach 10% →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photographer pick alert */}
      {isPhotographer && editorPicks > 0 && (
        <div className="mt-8 px-7 py-6 bg-cream border border-rule flex justify-between items-center">
          <div>
            <div className="caps opacity-55 mb-2">★ Editorial recognition</div>
            <div className="th text-[17px] font-medium">
              คุณได้รับ Editor&apos;s Pick {editorPicks} ครั้งในฤดูกาลนี้ — ติดอันดับ Top 10 ของ Pulse Leaderboard
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
        <div className="grid grid-cols-3 gap-4">
          <ActionCard title="ส่งภาพใหม่" sub="อัพได้วันละ 1 ภาพ" onClick={() => router.push('/upload')} />
          <ActionCard title="ตอบความเห็น" sub="3 ความเห็นรอตอบ" onClick={() => router.push('/me/photos')} />
          <ActionCard title="โหวต & favorite" sub="ค้นพบภาพใหม่" onClick={() => router.push('/explore')} />
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
        <ul className="list-none p-0 m-0 text-[14px] leading-[1.7]">
          {(
            [
              [
                '12 นาทีที่แล้ว',
                <>ภาพ <strong className="font-medium">&quot;Morning fog, Doi Inthanon&quot;</strong> ได้รับ 24 likes ใหม่</>,
              ],
              ['3 ชม.ที่แล้ว', <>Phimlapas Suwanlapa บันทึก My photos เป็น favorite</>],
              [
                'เมื่อวาน',
                <>Editor&apos;s Pick: ภาพ <strong className="font-medium">&quot;His hands&quot;</strong> ติด Pulse #2</>,
              ],
              ['2 วันก่อน', <>Ambassador Kanthorn Aroonrat follow คุณ</>],
            ] as [string, React.ReactNode][]
          ).map(([time, body], i) => (
            <li
              key={i}
              className="th grid gap-6 py-[14px] border-b border-rule grid-cols-[120px_1fr]"
            >
              <span className="mono text-[11px] opacity-55 tracking-[.08em] pt-[2px]">
                {time.toUpperCase()}
              </span>
              <span>{body}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
