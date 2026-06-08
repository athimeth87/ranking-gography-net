'use client';
import { useTranslations } from 'next-intl';
import { pulseStatus, type PickType } from '@/lib/pulse-engine';
import { statusFromBadge, type Badge } from '@/lib/pulse-engine-v4';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
}

const STATUS_LABEL: Record<string, string> = {
  undiscovered: 'Undiscovered',
  rising: 'Rising',
  trending: 'Trending',
  hidden_gem: 'Hidden Gem',
  popular: 'Popular',
  top_field: 'Top of the Field',
  editors_choice: "Editors' Choice",
};

const ICON = 'w-[18px] h-[18px] shrink-0 opacity-70';

function HeartIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8 2.6C20 14.8 12 20 12 20z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PulseIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}
function FlameIcon() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3-1.5 4.5-1.5 7A2.5 2.5 0 0 0 12 12.5 2.5 2.5 0 0 0 14 8c2 1.5 3 3.7 3 6a5 5 0 1 1-10 0c0-3.5 3-5.5 5-11z" />
    </svg>
  );
}

interface PhotoStatsPanelProps {
  likes: number;
  impressions: number;
  pulse: number;
  pickType?: PickType;
  badge?: string | null;
}

export function PhotoStatsPanel({ likes, impressions, pulse, pickType = 'none', badge }: PhotoStatsPanelProps) {
  const t = useTranslations('PhotoStats');
  const v4PickType = (pickType === 'both' ? 'editor' : pickType) as 'none' | 'editor' | 'ambassador';
  const status = badge !== undefined
    ? statusFromBadge((badge ?? null) as Badge, v4PickType)
    : pulseStatus(pulse, pickType);

  return (
    <div className="py-7 border-b border-rule">
      <div className="caps opacity-55 mb-4">{t('title')}</div>
      <ul className="flex flex-col gap-[14px]">
        <li className="flex items-center gap-3">
          <HeartIcon />
          <span className="mono text-[15px] font-medium tracking-[-.01em]">{formatCompact(likes)}</span>
          <span className="caps opacity-55 text-[10px]">{t('likes')}</span>
        </li>
        <li className="flex items-center gap-3">
          <EyeIcon />
          <span className="mono text-[15px] font-medium tracking-[-.01em]">{formatCompact(impressions)}</span>
          <span className="caps opacity-55 text-[10px]">{t('impressions')}</span>
        </li>
        <li className="flex items-center gap-3">
          <PulseIcon />
          <span className="mono text-[15px] font-medium tracking-[-.01em]">{pulse.toFixed(1)}</span>
          <span className="caps opacity-55 text-[10px]">{t('pulse')}</span>
        </li>
        <li className="flex items-center gap-3">
          <FlameIcon />
          <span className="mono text-[12px] font-medium uppercase tracking-[.12em]">{status ? STATUS_LABEL[status] : undefined}</span>
        </li>
      </ul>
    </div>
  );
}
