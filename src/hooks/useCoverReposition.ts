'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_POS = '50% 50%';

function parsePos(s: string | undefined): { x: number; y: number } {
  const parts = (s && s.trim() ? s : DEFAULT_POS).trim().split(/\s+/);
  const x = parseFloat(parts[0] ?? '50');
  const y = parseFloat(parts[1] ?? '50');
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50,
  };
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Facebook-style "drag to reposition cover". Lossless — never re-crops the file,
 * only stores a CSS object-position string. Works with mouse + touch (Pointer Events).
 */
export function useCoverReposition(
  initial: string | undefined,
  onSave: (pos: string) => Promise<void> | void,
) {
  const saved = initial && initial.trim() ? initial : DEFAULT_POS;
  const [editing, setEditing] = useState(false);
  const [position, setPosition] = useState(saved);
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ px: number; py: number; bx: number; by: number; w: number; h: number } | null>(null);

  // Keep the rendered position in sync with the saved value unless mid-edit.
  useEffect(() => {
    if (!editing) setPosition(saved);
  }, [saved, editing]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!editing) return;
      const el = e.currentTarget;
      el.setPointerCapture?.(e.pointerId);
      const rect = el.getBoundingClientRect();
      const { x, y } = parsePos(position);
      drag.current = { px: e.clientX, py: e.clientY, bx: x, by: y, w: rect.width, h: rect.height };
    },
    [editing, position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!editing || !d) return;
      // Drag down → reveal more of the top → decrease the object-position %.
      const ny = clamp(d.by - ((e.clientY - d.py) / d.h) * 100);
      const nx = clamp(d.bx - ((e.clientX - d.px) / d.w) * 100);
      setPosition(`${nx.toFixed(1)}% ${ny.toFixed(1)}%`);
    },
    [editing],
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  const start = useCallback(() => setEditing(true), []);
  const cancel = useCallback(() => {
    drag.current = null;
    setEditing(false);
    setPosition(saved);
  }, [saved]);
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(position);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [onSave, position]);

  return {
    editing,
    saving,
    position,
    start,
    cancel,
    save,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
