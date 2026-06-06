'use client';
import { useState, useEffect, useRef } from 'react';

const COLORS = [
  'var(--heatmap-0)',
  'var(--heatmap-1)',
  'var(--heatmap-2)',
  'var(--heatmap-3)',
  'var(--heatmap-4)',
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CELL = 10;
const GAP = 2;
const STRIDE = CELL + GAP;

function bucketOf(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function keyOf(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function ActivityHeatmap({ dates = [] }: { dates?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(26);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.offsetWidth;
      setWeeks(Math.min(53, Math.max(8, Math.floor(w / STRIDE))));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const counts: Record<string, number> = {};
  for (const d of dates) {
    if (!d) continue;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) continue;
    counts[keyOf(dt)] = (counts[keyOf(dt)] || 0) + 1;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const columns: { key: string; count: number; date: Date }[][] = [];
  const cursor = new Date(start);
  let col: { key: string; count: number; date: Date }[] = [];
  while (cursor <= today) {
    const key = keyOf(cursor);
    col.push({ key, count: counts[key] || 0, date: new Date(cursor) });
    if (col.length === 7) { columns.push(col); col = []; }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (col.length) columns.push(col);

  let lastMonth = -1;

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: GAP, marginBottom: 5 }}>
        {columns.map((c, ci) => {
          const m = c[0]?.date.getMonth() ?? 0;
          const show = m !== lastMonth;
          lastMonth = m;
          return (
            <div key={ci} style={{ width: CELL, flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.04em', color: 'var(--fg-faint)', whiteSpace: 'nowrap', overflow: 'visible' }}>
              {show ? MONTHS[m] : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: GAP }}>
        {columns.map((c, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {c.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.date.toLocaleDateString()} · ${cell.count}`}
                style={{ width: CELL, height: CELL, borderRadius: 2, background: COLORS[bucketOf(cell.count)] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-faint)' }}>
        <span>Less</span>
        {COLORS.map((color, i) => (
          <span key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
