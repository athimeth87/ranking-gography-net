'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSeasons, getPhotos, getPhotographers } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { MobileHallOfFame } from '@/components/mobile/MobileHallOfFame';
import { DesktopHallOfFame } from './DesktopHallOfFame';

// ===== Season definitions — no DB table needed =====
// Each season is a date range. Winners are computed from actual photo likes within that range.
const SEASON_DEFS: { id: string; name: string; startDate: string; endDate: string; status: 'live' | 'closed' }[] = [
  { id: 'season-1', name: 'Season 1', startDate: '2026-06-01', endDate: '2026-09-30', status: 'live' },
];

const CAT_MAP: Record<string, Category> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  bw: 'BW',
};

// Pick the top photo (by likes) per category from photos uploaded within the season window.
function computeWinners(
  photos: any[],
  startDate: string,
  endDate: string,
): Record<Category, SeasonWinner> | null {
  const start = new Date(startDate);
  const end = new Date(endDate + 'T23:59:59Z');

  const inWindow = photos.filter(p => {
    const d = new Date(p.uploaded_at);
    return d >= start && d <= end;
  });

  const result: Partial<Record<Category, SeasonWinner>> = {};
  for (const [rawCat, mappedCat] of Object.entries(CAT_MAP)) {
    const pool = inWindow.filter(p => p.category === rawCat);
    if (pool.length === 0) continue;
    const top = pool.reduce((best, p) =>
      (p.pulse || 0) > (best.pulse || 0) ? p : best,
    );
    result[mappedCat] = { photoId: top.id, voucher: '50,000 THB' };
  }
  return Object.keys(result).length > 0 ? (result as Record<Category, SeasonWinner>) : null;
}

function formatThaiRange(startDateStr: string, endDateStr: string): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const start = new Date(startDateStr);
  const end   = new Date(endDateStr);
  return `${months[start.getMonth()] ?? ''} — ${months[end.getMonth()] ?? ''} ${end.getFullYear() + 543}`;
}

export function HallOfFameClient() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();

      // No supabase → fall back to full mock
      if (!supabase) {
        setSeasons(getSeasons());
        setAllPhotos(getPhotos());
        setPhotographers(getPhotographers());
        setLoading(false);
        return;
      }

      try {
        const [{ data: dbPhotos }, { data: dbUsers }] = await Promise.all([
          supabase.from('photos').select('*'),
          supabase.from('users').select('*'),
        ]);

        const photos  = dbPhotos  || [];
        const users   = dbUsers   || [];

        // No real photos yet → fall back to full mock so the page looks right
        if (photos.length === 0) {
          setSeasons(getSeasons());
          setAllPhotos(getPhotos());
          setPhotographers(getPhotographers());
          setLoading(false);
          return;
        }

        // Map users → Photographer
        const mappedPhotographers: Photographer[] = users.map(u => ({
          id: u.id,
          username: u.username || u.display_name || u.id,
          name: u.display_name || u.username || 'User',
          loc: u.location || '',
          bio: u.bio || '',
          avatar: u.avatar_url || '',
          cover: u.cover_url || '',
          followers: 0,
          photos: photos.filter(p => p.photographer_id === u.id).length,
          isAmbassador: u.is_ambassador || false,
          isCustomer: u.is_customer || false,
          joined: u.created_at || '',
          cameras: [],
        }));

        // Map photos → Photo
        const mappedPhotos: Photo[] = photos.map(p => {
          const owner     = users.find(u => u.id === p.photographer_id);
          const ownerName = owner?.username || owner?.display_name || 'unknown';
          const rawCat    = (p.category as string) || 'landscape';
          const mappedCat = (CAT_MAP[rawCat] ?? 'Landscape') as Category;
          return {
            id: p.id, slug: p.slug || p.id,
            title: p.title, by: ownerName, avatarUrl: owner?.avatar_url,
            cat: mappedCat,
            w: p.width || 4, h: p.height || 3,
            src: p.storage_url,
            caption: p.description || '',
            exif: { camera: p.camera || 'Unknown', lens: p.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
            likes: p.likes_count || 0, likes24h: 0,
            comments: p.comments_count || 0, favorites: p.favorites_count || 0,
            hours: 24, picks: [], date: p.uploaded_at,
            voyageurOnly: p.voyageur_only,
            pulse: p.pulse != null ? Number(p.pulse) : 0, 
            peakPulse: p.peak_pulse != null ? Number(p.peak_pulse) : null,
            pickType: p.pick_type || 'none',
            percentile: p.percentile != null ? Number(p.percentile) : null,
            badge: p.badge || null,
            rank: 0,
          };
        });

        // Build seasons from static config + computed winners
        const computedSeasons: Season[] = SEASON_DEFS.map(def => ({
          id: def.id,
          name: def.name,
          range: formatThaiRange(def.startDate, def.endDate),
          status: def.status,
          endDate: def.endDate,
          winners: def.status === 'closed'
            ? computeWinners(photos, def.startDate, def.endDate)
            : null,
        }));

        setAllPhotos(mappedPhotos);
        setPhotographers(mappedPhotographers);
        setSeasons(computedSeasons);
      } catch (err) {
        console.error('Hall of Fame fetch error:', err);
        setSeasons(getSeasons());
        setAllPhotos(getPhotos());
        setPhotographers(getPhotographers());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="md:hidden">
        <MobileHallOfFame
          realSeasons={seasons}
          realAllPhotos={allPhotos}
          realPhotographers={photographers}
        />
      </div>

      <div className="hidden md:block">
        <DesktopHallOfFame
          seasons={seasons}
          allPhotos={allPhotos}
          photographers={photographers}
          loading={loading}
        />
      </div>
    </>
  );
}
