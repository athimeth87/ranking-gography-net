'use client';
import React, { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 -> target over `durationMs` once the element
 * scrolls into view. Uses IntersectionObserver — runs once.
 *
 * <PulseCountUp value={87.5} decimals={1} />
 */
export function PulseCountUp({
  value,
  decimals = 0,
  durationMs = 900,
  className = '',
  prefix = '',
  suffix = '',
}) {
  const elRef = useRef(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!elRef.current) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const t0 = performance.now();
      const tick = (t) => {
        const elapsed = t - t0;
        const p = Math.min(elapsed / durationMs, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(value * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          start();
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });

    io.observe(elRef.current);
    return () => io.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={elRef} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
