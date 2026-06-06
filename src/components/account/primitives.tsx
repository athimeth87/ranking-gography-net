'use client';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// DashStat — single stat cell used in Dashboard and Stats grid
// ---------------------------------------------------------------------------
interface DashStatProps {
  n: string | number;
  l: string;
  border?: boolean;
  onClick?: () => void;
}

export function DashStat({ n, l, border = false, onClick }: DashStatProps) {
  const cls = `p-6 text-left${border ? ' border-l border-rule' : ''}`;
  const body = (
    <>
      <div className="text-[32px] font-medium tracking-[-0.02em] leading-none mono">{n}</div>
      <div className="caps opacity-55 mt-2">{l}</div>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className={`${cls} block w-full bg-transparent cursor-pointer hover:opacity-65 transition-opacity`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

// ---------------------------------------------------------------------------
// ActionCard — quick-action button tile on Dashboard
// ---------------------------------------------------------------------------
interface ActionCardProps {
  title: string;
  sub: string;
  onClick: () => void;
}

export function ActionCard({ title, sub, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="p-6 border border-rule text-left bg-transparent text-fg cursor-pointer flex justify-between items-center transition-colors duration-150 hover:border-fg"
    >
      <div>
        <div className="text-[16px] font-medium tracking-[-0.005em] th">{title}</div>
        <div className="th text-[12px] text-fg-soft mt-1">{sub}</div>
      </div>
      <span className="text-[18px] opacity-35">→</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SettingsBlock — labelled section wrapper for Settings
// ---------------------------------------------------------------------------
interface SettingsBlockProps {
  title: string;
  children: ReactNode;
  danger?: boolean;
}

export function SettingsBlock({ title, children, danger = false }: SettingsBlockProps) {
  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-6">
        <h3
          className="text-[11px] tracking-[.16em] uppercase font-medium m-0 opacity-55"
          style={{ color: danger ? '#a83232' : 'var(--fg)' }} // runtime flag: danger color
        >
          {title}
        </h3>
        <div className="flex-1 h-px bg-rule" />
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Field3 — labelled form field wrapper used in Settings profile block
// ---------------------------------------------------------------------------
interface Field3Props {
  label: string;
  children: ReactNode;
}

export function Field3({ label, children }: Field3Props) {
  return (
    <label className="block mb-5">
      <div className="caps opacity-55 mb-2">{label}</div>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Row2 — two-column grid for pairing form fields
// ---------------------------------------------------------------------------
export function Row2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

// ---------------------------------------------------------------------------
// EmptyMe — empty-state block for gated sections
// ---------------------------------------------------------------------------
interface EmptyMeProps {
  title: string;
  body: string;
  cta?: string;
  onClick?: () => void;
}

export function EmptyMe({ title, body, cta, onClick }: EmptyMeProps) {
  return (
    <div className="py-[120px] px-10 text-center border border-dashed border-rule">
      <h2 className="th text-[32px] font-normal tracking-[-0.02em] m-0">{title}</h2>
      <p className="th mt-4 text-fg-soft max-w-[440px] mx-auto mb-8 leading-[1.7]">{body}</p>
      {cta && (
        <button className="btn btn-solid" onClick={onClick}>
          {cta}
        </button>
      )}
    </div>
  );
}
