'use client';
import { useEffect, useRef, useState } from 'react';

interface PulseCountUpProps {
  value: number;
  decimals?: number;
  durationMs?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function PulseCountUp({
  value,
  decimals = 0,
  durationMs = 900,
  className = '',
  prefix = '',
  suffix = '',
}: PulseCountUpProps) {
  const elRef = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = elRef.current;
    if (!el) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const elapsed = t - t0;
        const p = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setDisplay(value * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            start();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, durationMs]);

  return (
    <span
      ref={elRef}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }} /* semantic, not layout */
    >
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
