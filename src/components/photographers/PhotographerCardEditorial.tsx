'use client';
import Link from 'next/link';
import type { Photographer } from '@/lib/types';
import { CrownIcon, VoyageurMark } from '@/components/icons';
import { formatCount } from '@/lib/utils';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop';

interface PhotographerCardEditorialProps {
  photographer: Photographer;
  previews?: string[];
  following?: number;
  index?: number;
}

type Role = 'ambassador' | 'traveller' | 'rankmaster' | 'general';

function roleOf(p: Photographer): Role {
  if (p.isAmbassador) return 'ambassador';
  if (p.isCustomer) return 'traveller';
  if (p.isRankMaster) return 'rankmaster';
  return 'general';
}

const ROLE_LABEL: Record<Role, string> = {
  ambassador: 'Ambassador',
  traveller: 'Traveller',
  rankmaster: 'Rank Master',
  general: 'Photographer',
};

const ROLE_ACCENT: Record<Role, string> = {
  ambassador: 'border-t-2 border-t-gold',
  traveller: 'border-t-2 border-t-gold',
  rankmaster: 'border-t-2 border-t-rule-strong',
  general: '',
};

export function PhotographerCardEditorial({
  photographer: p,
  previews = [],
  following = 0,
  index = 0,
}: PhotographerCardEditorialProps) {
  const role = roleOf(p);
  const isGold = role === 'ambassador' || role === 'traveller';
  const avatar = p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`;

  const coverImg = p.cover || previews[0] || DEFAULT_COVER;

  return (
    <Link
      href={`/photographer/${p.username}`}
      // runtime: stagger index drives the grid fade-in delay
      style={{ ['--i' as string]: index }}
      className={`group flex h-full flex-col border border-rule bg-bg transition-colors duration-300 hover:border-rule-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${ROLE_ACCENT[role]}`}
    >
      {/* Profile cover */}
      <div className="h-[150px] overflow-hidden bg-tile sm:h-[160px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImg}
          alt={`${p.name} cover`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex w-full flex-1 flex-col items-center px-5 pb-6 text-center">
        {/* Avatar with role badge, overlapping the strip */}
        <div className="relative -mt-[34px] mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt=""
            loading="lazy"
            className="h-[68px] w-[68px] rounded-full border-[3px] border-bg bg-tile object-cover"
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-bg ${
              isGold ? 'bg-gold text-bg' : 'bg-fg text-bg'
            }`}
            title={ROLE_LABEL[role]}
          >
            {role === 'ambassador' && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3 17l4-6 4 4 4-8 6 10H3z" />
              </svg>
            )}
            {role === 'traveller' && <VoyageurMark size={10} />}
            {role === 'rankmaster' && <CrownIcon />}
            {role === 'general' && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </div>

        {/* Name + username */}
        <h3 className="max-w-full truncate text-[16px] font-semibold uppercase leading-tight tracking-tight">
          {p.name}
        </h3>
        <div className="mt-0.5 max-w-full truncate text-[12px] lowercase text-fg-soft">
          @{p.username}
        </div>

        {/* Role + location line */}
        <div className={`caps mt-2 flex items-center gap-1.5 ${isGold ? 'text-gold' : 'text-fg-faint'}`}>
          <span>{ROLE_LABEL[role]}</span>
          {p.loc && (
            <>
              <span className="opacity-40">·</span>
              <span className="max-w-[120px] truncate text-fg-faint">{p.loc}</span>
            </>
          )}
        </div>

        {/* Bio */}
        {p.bio && (
          <p className="th mt-3 line-clamp-1 max-w-full text-[12px] leading-relaxed text-fg-faint">
            {p.bio}
          </p>
        )}

        {/* Flexible spacer keeps a min gap and pins stats to the bottom regardless of bio */}
        <div aria-hidden className="min-h-[20px] w-full flex-1" />

        {/* Three centered stats */}
        <div className="mono grid w-full grid-cols-3 border-t border-rule pt-4">
          <Stat value={p.photos} label="Photos" />
          <Stat value={p.followers} label="Followers" divider />
          <Stat value={following} label="Following" />
        </div>
      </div>
    </Link>
  );
}

function Stat({ value, label, divider }: { value: number; label: string; divider?: boolean }) {
  return (
    <div className={divider ? 'border-x border-rule' : ''}>
      <div className="text-[15px] font-medium leading-none text-fg">{formatCount(value)}</div>
      <div className="caps mt-1.5 text-fg-faint">{label}</div>
    </div>
  );
}
