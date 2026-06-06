import { pulseStatus, type PickType, type PulseStatus } from '@/lib/pulse-engine';

const LABEL: Record<Exclude<PulseStatus, 'undiscovered'>, string> = {
  rising: 'Rising',
  popular: 'Popular',
  editors_choice: "Editors' Choice",
};

// Monochrome status pill. Renders nothing for "undiscovered" so cards stay clean.
// Distinction is by weight/fill, not colour (brand rule).
export function PulseStatusBadge({
  pulse,
  pickType = 'none',
  className = '',
}: {
  pulse: number | null | undefined;
  pickType?: PickType;
  className?: string;
}) {
  const status = pulseStatus(pulse, pickType);
  if (status === 'undiscovered') return null;

  const solid = status === 'popular' || status === 'editors_choice';
  return (
    <span
      className={`inline-flex items-center mono uppercase text-[9px] tracking-[.14em] leading-none px-2 py-[3px] ${
        solid ? 'bg-fg text-bg' : 'border border-rule text-fg-soft'
      } ${className}`}
    >
      {LABEL[status]}
    </span>
  );
}
