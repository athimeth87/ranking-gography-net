'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useVoteAspect } from '@/hooks/useVoteAspect';
import { PULSE_V5 } from '@/lib/pulse-engine-v4';
import type { AspectKey, AspectTally } from '@/lib/data/likes';
import { cn } from '@/lib/utils';

// Vote Aspect — replaces the plain Like. A vote endorses color / composition /
// light (≥1 required). The power bar (split of the three) stays hidden until the
// viewer has voted; the owner always sees it. Monochrome: three tone weights
// (fg / fg-soft / fg-faint), never hue — and text labels always, for legibility.

const ColorIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.5s6.5 6.8 6.5 11A6.5 6.5 0 0 1 5.5 13.5C5.5 9.3 12 2.5 12 2.5z" />
  </svg>
);
const CompositionIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="3" y="3" width="18" height="18" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
);
const LightIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const ASPECTS: { key: AspectKey; label: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { key: 'color', label: 'สี', Icon: ColorIcon },
  { key: 'composition', label: 'องค์ประกอบ', Icon: CompositionIcon },
  { key: 'light', label: 'แสง', Icon: LightIcon },
];

function PowerBar({ tally, over = false, labels = true, className = '' }: {
  tally: AspectTally; over?: boolean; labels?: boolean; className?: string;
}) {
  const parts = [tally.color, tally.composition, tally.light];
  const sum = parts.reduce((a, b) => a + b, 0);
  const shades = over
    ? ['bg-white', 'bg-white/70', 'bg-white/40']
    : ['bg-fg', 'bg-fg-soft', 'bg-fg-faint'];
  const showPct = tally.total >= PULSE_V5.MIN_VOTES_FOR_PERCENT && sum > 0;
  const valueOf = (n: number) => (showPct ? `${Math.round((n / sum) * 100)}%` : `(${n})`);
  return (
    <div className={className}>
      <div className={cn('flex h-1.5 w-full overflow-hidden', over ? 'bg-black/40' : 'bg-tile')}>
        {parts.map((n, i) => (
          <div key={i} className={shades[i]} style={{ width: sum > 0 ? `${(n / sum) * 100}%` : '33.33%' }} />
        ))}
      </div>
      {labels && (
        <div className="mt-1.5 flex justify-between mono text-[10px] tracking-[.08em] uppercase text-fg-soft">
          {ASPECTS.map((a, i) => <span key={a.key}>{a.label} {valueOf(parts[i]!)}</span>)}
        </div>
      )}
    </div>
  );
}

export interface VoteAspectProps {
  photoId: string;
  ownerId?: string | null;
  variant?: 'card' | 'full' | 'ranking' | 'owner';
  className?: string;
}

export function VoteAspect({ photoId, ownerId, variant = 'full', className = '' }: VoteAspectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const v = useVoteAspect(photoId, { ownerId });

  const onToggle = async (key: AspectKey) => {
    const r = await v.toggleAspect(key);
    if (r.kind === 'unauth') router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
  };

  const emptyTally: AspectTally = { color: 0, composition: 0, light: 0, total: 0 };
  const tally = v.tally ?? emptyTally;

  // Owner (or the dedicated owner variant): bar-only analytics, can't vote.
  if (v.isOwner || variant === 'owner') {
    if (variant === 'card') {
      return <div className={cn('absolute bottom-3 left-3 right-3 z-20', className)}><PowerBar tally={tally} over labels={false} /></div>;
    }
    return <PowerBar tally={tally} className={cn('w-full', className)} />;
  }

  // ── card: tiny icon toggles over the image; after voting → tiny bar ──────────
  if (variant === 'card') {
    if (v.revealBar) {
      return <div className={cn('absolute bottom-3 left-3 right-3 z-20', className)}><PowerBar tally={tally} over labels={false} /></div>;
    }
    const btn = (active: boolean) => cn(
      'w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-colors',
      active ? 'bg-white text-black' : 'bg-black/40 hover:bg-black/60 text-white',
    );
    return (
      <div className={cn('absolute bottom-3 right-3 z-20 flex gap-1.5', className)}>
        {ASPECTS.map((a) => (
          <button key={a.key} type="button" aria-label={`โหวต${a.label}`} aria-pressed={v.selection[a.key]}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(a.key); }}
            onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
            className={btn(v.selection[a.key])}><a.Icon /></button>
        ))}
      </div>
    );
  }

  // ── ranking: locked until voted, then a tiny bar ────────────────────────────
  if (variant === 'ranking') {
    if (v.revealBar) {
      return <div className={cn('w-28', className)}><PowerBar tally={tally} labels={false} /></div>;
    }
    const chip = (active: boolean) => cn(
      'w-6 h-6 flex items-center justify-center border transition-colors',
      active ? 'bg-fg text-bg border-fg' : 'border-rule text-fg-soft hover:text-fg',
    );
    return (
      <div className={cn('flex items-center gap-1.5', className)} title="โหวตเพื่อเปิดดูค่าพลัง">
        {ASPECTS.map((a) => (
          <button key={a.key} type="button" aria-label={`โหวต${a.label}`} aria-pressed={v.selection[a.key]} onClick={() => onToggle(a.key)} className={chip(v.selection[a.key])}>
            <a.Icon size={12} />
          </button>
        ))}
        <span className="mono text-[9px] tracking-[.12em] uppercase text-fg-faint">🔒 โหวตเพื่อดู</span>
      </div>
    );
  }

  // ── full: labeled toggles in a sidebar; after voting → bar + counts ─────────
  const fullBtn = (active: boolean) => cn(
    'flex-1 flex items-center justify-center gap-1.5 h-10 border mono text-[10px] tracking-[.08em] uppercase transition-colors',
    active ? 'bg-fg text-bg border-fg' : 'border-rule text-fg-soft hover:text-fg hover:border-rule-strong',
  );
  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-2">
        {ASPECTS.map((a) => (
          <button key={a.key} type="button" aria-pressed={v.selection[a.key]} onClick={() => onToggle(a.key)} className={fullBtn(v.selection[a.key])}>
            <a.Icon /> {a.label}
          </button>
        ))}
      </div>
      {v.revealBar && <PowerBar tally={tally} className="mt-3" />}
    </div>
  );
}
