'use client';
import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Stable per-browser key so anonymous viewers still dedupe. The real guard is
// server-side (one impression per viewer per photo per day); this is best-effort.
function getViewerKey(): string {
  try {
    let k = localStorage.getItem('gpa-viewer-key');
    if (!k) {
      k = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `v-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      localStorage.setItem('gpa-viewer-key', k);
    }
    return k;
  } catch {
    return '';
  }
}

// Counts one impression for a photo after the viewer has dwelled ~1.2s.
export function usePhotoImpression(photoId: string | null | undefined, enabled = true) {
  useEffect(() => {
    if (!enabled || !photoId) return;

    const sessionKey = `gpa-imp-${photoId}`;
    try { if (sessionStorage.getItem(sessionKey)) return; } catch { /* ignore */ }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const viewerKey = getViewerKey();
    if (!viewerKey) return;

    const timer = setTimeout(() => {
      supabase
        .rpc('increment_photo_impression', { p_photo_id: photoId, p_viewer_key: viewerKey })
        .then(() => { try { sessionStorage.setItem(sessionKey, '1'); } catch { /* ignore */ } });
    }, 1200);

    return () => clearTimeout(timer);
  }, [photoId, enabled]);
}
