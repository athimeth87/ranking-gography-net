'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PHOTOGRAPHERS } from '@/lib/data';
import { PickBadge } from './Icons';
import { useApp } from './AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function PhotoCard({ photo, showRank = false, showRankDelta = false, leaderTopScore = null, uniform = false, pulseLabel = 'Pulse' }) {
  const router = useRouter();
  const { authUser } = useApp();
  const photographer = PHOTOGRAPHERS.find(p => p.username === photo.by);
  const delta = (showRankDelta && leaderTopScore != null && photo.rank > 1) ? (photo.pulse - leaderTopScore) : null;

  // Like state: when Supabase is wired AND user is signed in we read from
  // prototype_likes; otherwise we fall back to localStorage so the UX still
  // works for guests / unconfigured local dev.
  const [liked, setLiked] = useState(false);
  const [extraLikes, setExtraLikes] = useState(0); // count of *other* DB likes for this photo

  // Initial hydration — localStorage first (always), then DB if available.
  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      setLiked(Boolean(map[photo.id]));
    } catch {}
  }, [photo.id]);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function loadFromDB() {
      // Total likes for this photo (excludes the current user — added on top)
      const { count } = await supabase
        .from('prototype_likes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', photo.id);
      if (cancelled) return;
      setExtraLikes(count ?? 0);

      // Whether the current user has liked it
      if (authUser?.id) {
        const { data } = await supabase
          .from('prototype_likes')
          .select('photo_id')
          .eq('user_id', authUser.id)
          .eq('photo_id', photo.id)
          .maybeSingle();
        if (cancelled) return;
        const isLiked = Boolean(data);
        setLiked(isLiked);
        // Subtract self from extraLikes so display shows base + self correctly
        if (isLiked) setExtraLikes((c) => Math.max(0, c - 1));
      }
    }
    loadFromDB();
    return () => { cancelled = true; };
  }, [photo.id, authUser?.id]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    const next = !liked;

    // Optimistic UI
    setLiked(next);

    // Always mirror to localStorage so the heart stays after refresh even
    // before sign-in.
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      map[photo.id] = next;
      localStorage.setItem('gpa-liked', JSON.stringify(map));
    } catch {}

    // Persist to DB when signed in.
    if (SUPABASE_CONFIGURED && authUser?.id) {
      const supabase = getSupabaseBrowserClient();
      if (next) {
        await supabase
          .from('prototype_likes')
          .upsert({ user_id: authUser.id, photo_id: photo.id })
          .select()
          .single();
      } else {
        await supabase
          .from('prototype_likes')
          .delete()
          .eq('user_id', authUser.id)
          .eq('photo_id', photo.id);
      }
    }
    // Guest path: localStorage only — encourage sign-in via the route /login.
  };

  // Mock baseline + DB extras + self
  const displayLikes = photo.likes + extraLikes + (liked ? 1 : 0);

  return (
    <div className="pcard" onClick={() => router.push(`/photo/${photo.id}`)}>
      <div className="pimg" style={{ aspectRatio: uniform ? '4/5' : `${photo.w}/${photo.h}` }}>
        <img src={photo.src} alt={photo.title} loading="lazy" />

        {/* Floating like button — top-left, visible on every card */}
        <button
          className={'pcard-heart ' + (liked ? 'is-liked' : '')}
          onClick={toggleLike}
          aria-label={liked ? 'Unlike photo' : 'Like photo'}
          title="โหวตภาพนี้ — 1 ภาพต่อ 1 ครั้ง"
        >
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 21s-7-4.5-9.5-9.5C0 6 4 2 7.5 2c2 0 3.5 1 4.5 2.5C13 3 14.5 2 16.5 2 20 2 24 6 21.5 11.5 19 16.5 12 21 12 21z" />
          </svg>
          <span>{displayLikes.toLocaleString()}</span>
        </button>

        {/* Hover overlay: photo metadata fades in from bottom */}
        <div className="pimg-overlay">
          <div className="pimg-overlay-grad" />
          <div className="pimg-overlay-content">
            <div className="pimg-overlay-cat">{photo.cat}</div>
            <div className="pimg-overlay-title">{photo.title}</div>
            <div className="pimg-overlay-meta">
              <span>{photographer ? photographer.name : photo.by}</span>
              <span className="pimg-overlay-sep">·</span>
              <span>{photo.exif.camera}</span>
            </div>
            <div className="pimg-overlay-pulse">
              <span className="pimg-overlay-pulse-num">{photo.pulse.toFixed(0)}</span>
              <span className="pimg-overlay-pulse-lab">PULSE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pmeta">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1, minWidth: 0 }}>
          {showRank && <span className="rank" style={{ flexShrink: 0 }}>{String(photo.rank).padStart(2,'0')}</span>}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ptitle" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.title}</div>
            <div className="pby">{photographer ? photographer.name : photo.by}</div>
          </div>
        </div>
        <div style={{ flexShrink: 0, marginLeft: 16, textAlign: 'right' }}>
          <div className="pulse">
            <span className="big">{photo.pulse.toFixed(0)}</span>
            <span className="lab">{pulseLabel}</span>
          </div>
          {delta !== null && (
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-soft)', marginTop: 4, letterSpacing: '.04em' }}>
              {delta.toFixed(1)} from #1
            </div>
          )}
        </div>
      </div>
      {photo.picks.length > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          {photo.picks.includes('editor') && photo.picks.includes('ambassador') ? (
            <PickBadge kind="both" />
          ) : (
            <>
              {photo.picks.includes('editor') && <PickBadge kind="editor" />}
              {photo.picks.includes('ambassador') && <PickBadge kind="ambassador" />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Responsive column logic — phone 1, tablet 2, desktop = `cols` prop.
// Tailwind JIT requires literal class strings (no template-string interpolation),
// hence the explicit lookup per `cols` value.
function gridClassFor(cols) {
  switch (Math.min(Math.max(cols, 1), 4)) {
    case 4: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6';
    case 3: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6';
    case 2: return 'grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6';
    default: return 'grid grid-cols-1 gap-4 lg:gap-6';
  }
}

function columnsClassFor(cols) {
  switch (Math.min(Math.max(cols, 1), 4)) {
    case 4: return 'columns-1 sm:columns-2 lg:columns-4 gap-x-4 lg:gap-x-6';
    case 3: return 'columns-1 sm:columns-2 lg:columns-3 gap-x-4 lg:gap-x-6';
    case 2: return 'columns-1 sm:columns-2 gap-x-4 lg:gap-x-6';
    default: return 'columns-1 gap-x-4 lg:gap-x-6';
  }
}

export function PhotoGrid({ photos, cols = 3, showRank = false, showRankDelta = false, uniform = false, pulseLabel = 'Pulse' }) {
  const leaderTopScore = (showRankDelta && photos.length > 0) ? Math.max(...photos.map(p => p.pulse)) : null;
  if (uniform) {
    return (
      <div className={`pgrid pgrid-stagger ${gridClassFor(cols)}`}>
        {photos.map((p, i) => (
          <div key={p.id} style={{ '--i': i }}>
            <PhotoCard photo={p} showRank={showRank} showRankDelta={showRankDelta} leaderTopScore={leaderTopScore} uniform pulseLabel={pulseLabel} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`pgrid pgrid-stagger ${columnsClassFor(cols)}`}>
      {photos.map((p, i) => (
        <div key={p.id} className="break-inside-avoid mb-6 lg:mb-8" style={{ '--i': i }}>
          <PhotoCard photo={p} showRank={showRank} showRankDelta={showRankDelta} leaderTopScore={leaderTopScore} pulseLabel={pulseLabel} />
        </div>
      ))}
    </div>
  );
}
