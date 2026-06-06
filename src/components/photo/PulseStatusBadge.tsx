import { pulseStatus, type PickType } from '@/lib/pulse-engine';
import { statusFromBadge, type Badge } from '@/lib/pulse-engine-v2';

const LABEL: Record<string, string> = {
  rising: 'Rising',
  trending: 'Trending',
  hidden_gem: 'Hidden Gem',
  popular: 'Popular',
  top_field: 'Top of the Field',
  editors_choice: "Editors' Choice",
};
const SOLID = new Set(['popular', 'top_field', 'editors_choice']);

// Monochrome status pill. Renders nothing for "undiscovered" so cards stay clean.
// Distinction is by weight/fill, not colour (brand rule).
// Uses the v2 master badge when present (badge prop is defined); falls back to the
// absolute pulse threshold for mock/legacy photos without a computed badge.
export function PulseStatusBadge({
  pulse,
  pickType = 'none',
  badge,
  className = '',
}: {
  pulse?: number | null;
  pickType?: PickType;
  badge?: string | null;
  className?: string;
}) {
  const status = badge !== undefined
    ? statusFromBadge((badge ?? null) as Badge, pickType)
    : pulseStatus(pulse, pickType);
  if (status === 'undiscovered') return null;

  const solid = SOLID.has(status);
  return (
    <span
      className={`inline-flex items-center mono uppercase text-[9px] tracking-[.14em] leading-none px-2 py-[3px] ${
        solid ? 'bg-fg text-bg' : 'border border-rule text-fg-soft'
      } ${className}`}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
