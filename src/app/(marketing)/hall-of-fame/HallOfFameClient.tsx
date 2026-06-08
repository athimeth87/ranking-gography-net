'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRealtimePulse } from '@/hooks/useRealtimePulse';
import { mergeLivePulse } from '@/lib/realtime-pulse';
import { getSeasons, getPhotos, getPhotographers } from '@/lib/data';
import type { Category, Photo, Photographer, Season, SeasonWinner } from '@/lib/types';
import { MobileHallOfFame } from '@/components/mobile/MobileHallOfFame';
import { DesktopHallOfFame } from './DesktopHallOfFame';

const CAT_MAP: Record<string, Category> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  bw: 'BW',
};

// A season is "closed" (winners shown) once awarded/archived; otherwise it's live.
const CLOSED_DB_STATUSES = new Set(['awarded', 'archived']);

// Pick the top photo (by pulse) per category among photos linked to this season.
function computeWinners(
  photos: any[],
  seasonId: string,
): Record<Category, SeasonWinner> | null {
  const inSeason = photos.filter(p => p.season_id === seasonId);

  const result: Partial<Record<Category, SeasonWinner>> = {};
  for (const [rawCat, mappedCat] of Object.entries(CAT_MAP)) {
    const pool = inSeason.filter(p => p.category === rawCat);
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
  const [photographersRanking, setPhotographersRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const liveIds = useMemo(() => allPhotos.map((p) => p.id), [allPhotos]);
  const live = useRealtimePulse(liveIds);
  const livePhotos = useMemo(() => mergeLivePulse(allPhotos, live), [allPhotos, live]);

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
        // Fetch seasons and users first
        const [{ data: dbUsers }, { data: dbSeasons }] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('seasons').select('*').order('start_date', { ascending: true })
        ]);

        const users   = dbUsers   || [];
        const seasonRows = dbSeasons || [];
        
        // Find the active season
        const liveSeason = seasonRows.find(s => s.status === 'active' || s.status === 'live');
        const liveSeasonId = liveSeason?.id || null;

        // Fetch Top Photographers specifically for this season!
        const { data: dbPhotographersRanking } = await supabase.rpc('get_v5_hall_of_fame', { p_season_id: liveSeasonId }).limit(15);
        const rankData = dbPhotographersRanking || [];

        // Fetch Top 50 Photos from the live season only (fallback: global if no active season)
        const basePhotoQuery = supabase
          .from('photos')
          .select('*')
          .eq('is_hidden', false)
          .eq('status', 'published')
          .order('pulse', { ascending: false })
          .limit(50);
        const { data: dbPhotos } = await (liveSeasonId
          ? basePhotoQuery.eq('season_id', liveSeasonId)
          : basePhotoQuery);
        
        const photos = dbPhotos || [];

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

        // Build seasons from the DB; fall back to mock config if the table is empty
        const computedSeasons: Season[] = seasonRows.length > 0
          ? seasonRows.map(s => {
              const closed = CLOSED_DB_STATUSES.has(s.status);
              return {
                id: s.id,
                name: s.name,
                range: formatThaiRange(s.start_date, s.end_date),
                status: closed ? 'closed' : 'live',
                endDate: s.end_date,
                winners: closed ? computeWinners(photos, s.id) : null,
              };
            })
          : getSeasons();

        setAllPhotos(mappedPhotos);
        setPhotographers(mappedPhotographers);
        setPhotographersRanking(rankData);
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
          realAllPhotos={livePhotos}
          realPhotographers={photographers}
          photographersRanking={photographersRanking}
        />
      </div>

      <div className="hidden md:block">
        <DesktopHallOfFame
          seasons={seasons}
          allPhotos={livePhotos}
          photographers={photographers}
          photographersRanking={photographersRanking}
          loading={loading}
        />
      </div>
    </>
  );
}
