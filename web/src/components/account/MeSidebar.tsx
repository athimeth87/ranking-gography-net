'use client';
import { useRouter } from 'next/navigation';
import { VoyageurMark } from '@/components/icons';
import type { Photographer } from '@/lib/types';

interface SectionItem {
  id: string;
  label: string;
  path: string;
  count?: number;
}

interface MeSidebarProps {
  persona: Photographer;
  isVoyageur: boolean;
  isPhotographer: boolean;
  sections: SectionItem[];
  activeSection: string;
}

export function MeSidebar({
  persona,
  isVoyageur,
  isPhotographer,
  sections,
  activeSection,
}: MeSidebarProps) {
  const router = useRouter();

  return (
    <aside className="sticky top-[96px] self-start">
      {/* Identity card */}
      <div className="pb-6 border-b border-rule mb-6">
        <div className="w-16 h-16 rounded-full bg-tile overflow-hidden mb-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={persona.avatar}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col gap-[6px] mb-3">
          {isVoyageur && (
            <span className="inline-flex items-center gap-[5px] px-[7px] py-[3px] bg-[#b08e54] text-white text-[9.5px] tracking-[.14em] uppercase font-medium self-start">
              <VoyageurMark size={7} /> Voyageur
            </span>
          )}
          {isPhotographer && (
            <span className="inline-flex items-center gap-[5px] px-[7px] py-[3px] bg-fg text-bg text-[9.5px] tracking-[.14em] uppercase font-medium self-start">
              ★ Photographer
            </span>
          )}
        </div>
        <div className="text-[15px] font-medium tracking-[-0.005em]">{persona.name}</div>
        <div className="caps opacity-55 mt-1">@{persona.username}</div>
        <button
          onClick={() => router.push(`/photographer/${persona.username}`)}
          className="caps mt-[14px] cursor-pointer border-b border-rule pb-[3px] opacity-65"
        >
          View public profile →
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col">
        {sections.map((s) => {
          const active = s.id === activeSection;
          return (
            <button
              key={s.id}
              onClick={() => router.push(s.path)}
              className="flex justify-between items-center py-3 px-4 -mx-4 cursor-pointer transition-colors duration-150"
              style={{
                background: active ? 'var(--cream)' : 'transparent', // runtime: active state
                borderLeft: `2px solid ${active ? 'var(--fg)' : 'transparent'}`, // runtime: active state
                fontSize: 13,
                fontWeight: active ? 500 : 400, // runtime: active state
                letterSpacing: active ? '-.005em' : '0', // runtime: active state
                color: active ? 'var(--fg)' : 'var(--fg-soft)', // runtime: active state
              }}
            >
              <span>{s.label}</span>
              {s.count != null && (
                <span className="mono text-[11px] opacity-55">{s.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Upload CTA for photographers + voyageurs */}
      {(isPhotographer || isVoyageur) && (
        <div className="mt-6 pt-6 border-t border-rule">
          <button
            className="btn btn-solid btn-sm w-full justify-center"
            onClick={() => router.push('/upload')}
          >
            Upload photo
          </button>
          <div className="mono text-[10px] opacity-55 mt-3 text-center leading-[1.6]">
            TODAY 0/1 · RESETS 00:00 ICT
          </div>
        </div>
      )}

      {/* Apply CTA for plain users */}
      {!isPhotographer && !isVoyageur && (
        <div className="mt-6 pt-6 border-t border-rule">
          <button
            className="btn btn-sm btn-ghost w-full justify-center"
            onClick={() => router.push('/apply-photographer')}
          >
            Apply as photographer
          </button>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={() => router.push('/')}
        className="caps mt-8 opacity-45 cursor-pointer"
      >
        Sign out
      </button>
    </aside>
  );
}
