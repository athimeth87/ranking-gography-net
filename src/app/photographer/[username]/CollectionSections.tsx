'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PhotoVisibility } from '@/lib/types';
import { pulseStatus } from '@/lib/pulse-engine';
import { PhotoCardCurateButton, CURATED_MAX } from '@/components/photo/PhotoCardCurateButton';
import { PhotoCardVisibilityButton } from '@/components/photo/PhotoCardVisibilityButton';
import { PhotoCardDeleteButton } from '@/components/photo/PhotoCardDeleteButton';
import { CreateDropDialog } from '@/components/account/CreateDropDialog';

// ===== "The Collection" — curated set, archive drawer, private drawer =====

export { CURATED_MAX };

export interface CollectionPhoto {
  id: string;
  src: string;
  title: string;
  w: number;
  h: number;
  visibility: PhotoVisibility;
  isCurated: boolean;
  camera: string | null;
  lens: string | null;
  place: string | null;
  year: string | null;
  date: string;
}

export interface ProvenanceRow {
  photo_id: string;
  photographer_id: string;
  pick_type: 'none' | 'editor' | 'ambassador' | 'both' | null;
  peak_pulse: number | null;
  badge: string | null;
  season_winner: boolean;
  season_name: string | null;
  winner_category: string | null;
}

export function SectionHead({ num, title, note }: { num: string; title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div className="caps">
        <span className="opacity-35 mr-3">— {num}</span>
        {title}
      </div>
      {note && <div className="th text-[12px] tracking-[.08em] text-fg-soft hidden sm:block">{note}</div>}
    </div>
  );
}

// Permanent provenance labels — only from real data; gold only for Ambassador cues.
function provenanceLabels(prov: ProvenanceRow | undefined): { text: string; gold: boolean }[] {
  if (!prov) return [];
  const labels: { text: string; gold: boolean }[] = [];
  if (prov.season_winner) {
    labels.push({ text: `★ ${prov.season_name ?? 'Season'} — Winner`, gold: false });
  }
  if (prov.pick_type === 'ambassador' || prov.pick_type === 'both') {
    labels.push({ text: "Ambassador's Pick", gold: true });
  }
  if (prov.pick_type === 'editor' || prov.pick_type === 'both') {
    labels.push({ text: "Editor's Pick", gold: false });
  }
  if (prov.badge) {
    labels.push({ text: prov.badge.replace(/_/g, ' '), gold: false });
  } else {
    const peak = prov.peak_pulse != null ? Number(prov.peak_pulse) : null;
    const tier = pulseStatus(peak, 'none');
    if (tier === 'popular' || tier === 'rising') labels.push({ text: `Peak — ${tier}`, gold: false });
  }
  return labels;
}

function specimenMeta(p: CollectionPhoto): string {
  const place = [p.place, p.year].filter(Boolean).join(' · ');
  const gear = [p.camera, p.lens].filter(Boolean).join(' · ');
  return [place, gear].filter(Boolean).join(' — ');
}

interface CuratedSetProps {
  photos: CollectionPhoto[];
  provenance: Map<string, ProvenanceRow>;
  isOwner: boolean;
  onCurateChanged: () => void;
}

export function CuratedSet({ photos, provenance, isOwner, onCurateChanged }: CuratedSetProps) {
  const router = useRouter();
  if (photos.length === 0 && !isOwner) return null;
  return (
    <section className="mb-10 md:mb-[64px]">
      <SectionHead
        num="02"
        title="Curated Set"
        note={`${String(photos.length).padStart(2, '0')} / ${CURATED_MAX} ชิ้น — คัดโดยเจ้าของคอลเลกชัน`}
      />
      {photos.length === 0 ? (
        <div className="th text-[13px] text-fg-soft border border-dashed border-rule py-10 px-6 text-center">
          ยังไม่มีภาพในชุดคัด — กดหมุดบนภาพในพอร์ตหรือภาพประกวด เพื่อปักเข้าชุดคัด (สูงสุด {CURATED_MAX} ชิ้น)
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[34px] gap-y-[46px]">
          {photos.map((p, i) => {
            const land = (p.w || 4) >= (p.h || 3);
            const meta = specimenMeta(p);
            const labels = provenanceLabels(provenance.get(p.id));
            return (
              <article key={p.id} className="group cursor-pointer" onClick={() => router.push(`/photo/${p.id}`)}>
                <div className="relative bg-tile border border-rule p-4 transition-all duration-300 group-hover:border-rule-strong group-hover:-translate-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.title}
                    loading="lazy"
                    className={`w-full block object-cover ${land ? 'aspect-[3/2]' : 'aspect-[4/5]'}`}
                  />
                  {isOwner && (
                    <PhotoCardCurateButton photoId={p.id} isCurated alwaysVisible onChanged={onCurateChanged} />
                  )}
                </div>
                <div className="mt-4 pl-[2px]">
                  <div className="flex justify-between items-baseline gap-3">
                    <h4 className="font-serif italic text-[19px] font-medium m-0 leading-snug min-w-0 truncate">
                      {p.title}
                    </h4>
                    <span className="mono text-[10px] tracking-[.2em] opacity-55 shrink-0">
                      № {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {meta && (
                    <div className="th text-[11px] text-fg-soft tracking-[.04em] mt-[7px] leading-[1.7]">{meta}</div>
                  )}
                  {labels.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-[10px]">
                      {labels.map((l) => (
                        <span
                          key={l.text}
                          className={`caps text-[9px] border border-rule px-[9px] py-1 ${l.gold ? 'text-gold' : 'text-fg-soft'}`}
                        >
                          {l.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface ArchiveDrawerProps {
  photos: CollectionPhoto[];
  isOwner: boolean;
  onCurateChanged: () => void;
}

export function ArchiveDrawer({ photos, isOwner, onCurateChanged }: ArchiveDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (photos.length === 0) return null;
  return (
    <section className="mb-10 md:mb-[64px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="th w-full bg-cream border border-rule text-fg-soft py-[18px] md:py-[22px] text-[12px] tracking-[.2em] uppercase cursor-pointer transition-colors hover:text-fg hover:border-rule-strong"
      >
        {open ? '— ปิดลิ้นชัก —' : `— เปิดลิ้นชักเก็บผลงาน · ${photos.length} ชิ้น —`}
      </button>
      {open && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-[10px] pt-[24px]">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative group aspect-square cursor-pointer"
              onClick={() => router.push(`/photo/${p.id}`)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.title}
                loading="lazy"
                className="w-full h-full object-cover border border-rule grayscale brightness-75 transition-all duration-300 group-hover:grayscale-0 group-hover:brightness-100 group-hover:border-rule-strong"
              />
              {isOwner && (
                <PhotoCardCurateButton photoId={p.id} isCurated={false} alwaysVisible onChanged={onCurateChanged} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface PrivateDrawerProps {
  photos: CollectionPhoto[];
  photographerId: string;
  onChanged: () => void;
}

// Owner-only: private photos with release / submit / drop / delete actions.
export function PrivateDrawer({ photos, photographerId, onChanged }: PrivateDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  return (
    <section className="mb-10 md:mb-[64px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="th w-full bg-cream border border-rule text-fg-soft py-[18px] md:py-[22px] text-[12px] tracking-[.2em] uppercase cursor-pointer transition-colors hover:text-fg hover:border-rule-strong"
      >
        {open ? '— ปิดลิ้นชักส่วนตัว —' : `— ลิ้นชักส่วนตัว · ${photos.length} ชิ้น —`}
      </button>
      {open && (
        <div className="pt-[24px]">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="th text-[12px] text-fg-soft">
              เห็นเฉพาะคุณ — ปล่อยลงพอร์ต ส่งเข้าประกวด หรือลบ ได้จากแต่ละภาพ
            </div>
            <button className="btn btn-sm th" onClick={() => setDropOpen(true)}>
              ตั้งเป็น Drop
            </button>
          </div>
          {photos.length === 0 ? (
            <div className="th text-[13px] text-fg-soft border border-dashed border-rule py-10 px-6 text-center">
              ลิ้นชักว่าง — อัปโหลดภาพแบบ &ldquo;เก็บในลิ้นชัก&rdquo; เพื่อเก็บไว้ปล่อยทีหลัง
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-[10px]">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative group aspect-square cursor-pointer"
                  onClick={() => router.push(`/photo/${p.id}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.title} loading="lazy" className="w-full h-full object-cover border border-rule" />
                  <PhotoCardVisibilityButton
                    photoId={p.id}
                    visibility="private"
                    alwaysVisible
                    onChanged={onChanged}
                  />
                  <PhotoCardDeleteButton photoId={p.id} storageUrl={p.src} alwaysVisible onDeleted={onChanged} />
                </div>
              ))}
            </div>
          )}
          <CreateDropDialog
            open={dropOpen}
            onOpenChange={setDropOpen}
            photographerId={photographerId}
            onCreated={onChanged}
          />
        </div>
      )}
    </section>
  );
}
