'use client';
import { useRouter } from 'next/navigation';
import { CrownIcon } from '@/components/icons';

interface ChipDef {
  v: string;
  l: string;
  luxury?: boolean;
}

interface CategoryChipsProps {
  value: string;
  onChange: (v: string) => void;
  showVoyageurs?: boolean;
}

const GOLD = '#b08e54';

export function CategoryChips({ value, onChange, showVoyageurs = false }: CategoryChipsProps) {
  const router = useRouter();
  const cats: ChipDef[] = [
    { v: 'All', l: 'All' },
    { v: 'Landscape', l: 'Landscape' },
    { v: 'Portrait', l: 'Portrait' },
    { v: 'BW', l: 'Black & White' },
  ];
  if (showVoyageurs) cats.push({ v: 'Voyageurs', l: 'Voyageurs', luxury: true });

  return (
    <div className="flex justify-between items-center gap-3 flex-wrap">
      <div className="flex gap-2 flex-wrap">
        {cats.map((c) => {
          const active = value === c.v;
          const lux = !!c.luxury;
          // dynamic: colors from runtime active/luxury state
          const bg = active ? (lux ? GOLD : 'var(--fg)') : 'transparent';
          const border = lux ? GOLD : active ? 'var(--fg)' : 'var(--rule)';
          const fg = active ? (lux ? '#fff' : 'var(--bg)') : lux ? GOLD : 'var(--fg)';
          return (
            <div key={c.v} className="flex">
              <button
                onClick={() => onChange(c.v)}
                style={{ background: bg, borderColor: border, color: fg }} // dynamic: colors from runtime active/luxury state
                className="px-[14px] py-[9px] border text-[11px] tracking-[.14em] uppercase font-medium cursor-pointer inline-flex items-center gap-2"
              >
                {lux && <CrownIcon />}
                <span>{c.l}</span>
              </button>
              {active && c.v !== 'All' && (
                <button
                  onClick={() =>
                    router.push(
                      c.v === 'Voyageurs'
                        ? '/photographers/voyageurs'
                        : `/explore/${c.v.toLowerCase()}`,
                    )
                  }
                  style={{ background: lux ? GOLD : 'var(--fg)', borderColor: lux ? GOLD : 'var(--fg)', color: lux ? '#fff' : 'var(--bg)' }} // dynamic: colors from runtime active/luxury state
                  className="px-[10px] py-[9px] border border-l-0 text-[11px] tracking-[.1em] uppercase font-medium cursor-pointer"
                >
                  ↗
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mono text-[10.5px] opacity-55 tracking-[.1em]">↗ OPENS FULL CATEGORY PAGE</div>
    </div>
  );
}
