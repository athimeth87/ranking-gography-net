'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PageCover } from '@/components/layout/PageCover';
import { MeSidebar } from '@/components/account/MeSidebar';
import { MeSidebarSkeleton, MeContentSkeleton } from '@/components/account/MeSkeleton';
import { MeDashboard } from '@/components/account/MeDashboard';
import { MePhotos } from '@/components/account/MePhotos';
import { MeFavorites } from '@/components/account/MeFavorites';
import { MeStats } from '@/components/account/MeStats';
import { MeSettings } from '@/components/account/MeSettings';
import { MobileMe } from '@/components/mobile/MobileMe';

interface PageProps {
  params: { section?: string[] };
}

function mapPhoto(p: any, username: string, fallbackEmail?: string) {
  const likes = p.likes_count || 0;
  const favorites = p.favorites_count || 0;
  return {
    id: p.id,
    slug: p.id,
    title: p.title,
    by: username || fallbackEmail?.split('@')[0] || 'Unknown',
    cat: p.category,
    w: p.width || 4,
    h: p.height || 3,
    src: p.storage_url,
    caption: p.caption || '',
    exif: { camera: 'Unknown', lens: 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
    likes,
    likes24h: 0,
    comments: p.comments_count || 0,
    favorites,
    hours: 1,
    picks: [],
    date: p.uploaded_at,
    pulse: likes + favorites * 2,
    rank: 0,
  };
}

function mapGalleries(rows: any[]): Gallery[] {
  return rows.map((g: any) => ({
    id: g.id,
    title: g.name,
    isPublic: g.is_public,
    cover: g.photos?.storage_url || '',
    count: g.gallery_photos?.[0]?.count || 0,
  }));
}

export default function Page({ params }: PageProps) {
  const { authUser } = useApp();
  const [section, setSection] = useState<string>(params.section?.[0] ?? 'dashboard');

  const navigateSection = useCallback((id: string, path: string) => {
    setSection(id);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === '/me' || path === '/me/') {
        setSection('dashboard');
        return;
      }
      const seg = path.replace(/^\/me\/?/, '').split('/')[0];
      if (seg) setSection(seg);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [profile, setProfile] = useState<any>(null);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [favs, setFavs] = useState<any[]>([]);
  const [favIsPublic, setFavIsPublic] = useState(false);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async (profileUsername: string) => {
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('photographer_id', authUser.id)
      .order('uploaded_at', { ascending: false });
    setMyPhotos((photos || []).map((p: any) => mapPhoto(p, profileUsername, authUser?.email)));
  };

  const fetchGalleries = async () => {
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from('galleries')
      .select(`
        id,
        name,
        is_public,
        photos ( storage_url ),
        gallery_photos ( count )
      `)
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });
    setGalleries(mapGalleries(data || []));
  };

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();

      const [profRes, photosRes, favsRes, galleriesRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
        supabase.from('photos').select('*').eq('photographer_id', authUser.id).order('uploaded_at', { ascending: false }),
        supabase
          .from('favorites')
          .select(`photo_id, photos (*)`)
          .eq('user_id', authUser.id)
          .order('favorited_at', { ascending: false }),
        supabase
          .from('galleries')
          .select(`
            id,
            name,
            is_public,
            photos ( storage_url ),
            gallery_photos ( count )
          `)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false }),
      ]);

      const prof = profRes.data || {
        username: authUser.email?.split('@')[0],
        display_name: authUser.email?.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || '',
      };
      setProfile(prof);

      const username = prof?.username || '';
      setMyPhotos((photosRes.data || []).map((p: any) => mapPhoto(p, username, authUser?.email)));

      const favPhotos = (favsRes.data || [])
        .map((row: any) => row.photos)
        .filter(Boolean);
      setFavs(favPhotos);
      setFavIsPublic(prof?.favorites_visibility === 'public');

      setGalleries(mapGalleries(galleriesRes.data || []));

      setLoading(false);
    };

    fetchData();
  }, [authUser]);

  // Realtime: patch own profile counts (followers / following) when the
  // users row UPDATEs.
  useEffect(() => {
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`me-user-${authUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${authUser.id}` },
        (payload) => {
          const next = payload.new as { followers_count?: number; following_count?: number };
          setProfile((curr: any) => curr ? {
            ...curr,
            followers_count: typeof next.followers_count === 'number' ? next.followers_count : curr.followers_count,
            following_count: typeof next.following_count === 'number' ? next.following_count : curr.following_count,
          } : curr);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authUser?.id]);

  // Realtime: patch likes / favorites / comments counts on the user's own
  // photos so the Dashboard stats and Pulse recompute as votes come in.
  useEffect(() => {
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`me-photos-${authUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `photographer_id=eq.${authUser.id}` },
        (payload) => {
          const next = payload.new as {
            id: string;
            likes_count?: number;
            favorites_count?: number;
            comments_count?: number;
          };
          setMyPhotos((curr) =>
            curr.map((p) => {
              if (p.id !== next.id) return p;
              const likes = typeof next.likes_count === 'number' ? next.likes_count : p.likes;
              const favorites = typeof next.favorites_count === 'number' ? next.favorites_count : p.favorites;
              const comments = typeof next.comments_count === 'number' ? next.comments_count : p.comments;
              return { ...p, likes, favorites, comments, pulse: likes + favorites * 2 };
            }),
          );
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authUser?.id]);

  const handleToggleFavVisibility = async (next: boolean) => {
    setFavIsPublic(next);
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('users')
      .update({ favorites_visibility: next ? 'public' : 'private' })
      .eq('id', authUser.id);
  };

  if (!loading && !profile) {
    return <div className="page-fade py-24 text-center opacity-50 caps">Please sign in</div>;
  }

  const isVoyageur = profile?.is_customer ?? false;
  const isPhotographer = profile?.photographer_status === 'approved';

  const persona = {
    username: profile?.username || '',
    name: profile?.display_name || '',
    avatar: profile?.avatar_url || '',
    loc: profile?.location || 'Not set',
    bio: profile?.bio || '',
    website: profile?.portfolio_url || '',
    isCustomer: profile?.is_customer,
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', path: '/me' },
    { id: 'photos', label: 'My Photos', path: '/me/photos', count: myPhotos.length },
    { id: 'favorites', label: 'Favorites', path: '/me/favorites', count: favs.length },
    { id: 'stats', label: 'Stats', path: '/me/stats' },
    { id: 'settings', label: 'Settings', path: '/me/settings' },
  ];

  return (
    <div className="page-fade">
      <div className="hidden md:block">
        <PageCover
          photoId="p013"
          eyebrow="Your account"
          title="Your dashboard"
          subtitle="ภาพของคุณ คะแนน favorites ทริปกับ GOGRAPHY — รวมที่เดียว"
          height="38vh"
          minHeight={300}
          maxHeight={420}
        />
      </div>
      <div className="md:hidden">
        {loading ? (
          <div className="px-6 py-10 animate-pulse">
            <div className="h-3 w-24 bg-tile mb-3" />
            <div className="h-10 w-2/3 bg-tile mb-8" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/5] bg-tile" />
              ))}
            </div>
          </div>
        ) : (
          <MobileMe
            section={section}
            profile={profile}
            myPhotos={myPhotos}
            isVoyageur={isVoyageur}
            favoritesCount={favs.length}
            galleriesCount={galleries.length}
          />
        )}
      </div>
      <div
        className="hidden md:grid wrap items-start pt-12 px-10 pb-24 grid-cols-[240px_1fr] gap-14"
      >
        {loading ? (
          <>
            <MeSidebarSkeleton />
            <main>
              <MeContentSkeleton />
            </main>
          </>
        ) : (
          <>
            <MeSidebar
              persona={persona}
              isVoyageur={isVoyageur}
              isPhotographer={isPhotographer}
              sections={sections}
              activeSection={section}
              onNavigate={navigateSection}
              onAvatarUpdated={(url) => setProfile((p: any) => ({ ...p, avatar_url: url }))}
            />

            <main>
              {section === 'dashboard' && (
                <MeDashboard
                  persona={persona}
                  isVoyageur={isVoyageur}
                  isPhotographer={isPhotographer}
                  myPhotos={myPhotos}
                  followers={profile.followers_count ?? 0}
                  following={profile.following_count ?? 0}
                />
              )}
              {section === 'photos' && (
                <MePhotos
                  persona={persona}
                  myPhotos={myPhotos}
                  isPhotographer={isPhotographer || isVoyageur}
                  isVoyageur={isVoyageur}
                  onPhotoUploaded={() => fetchPhotos(profile?.username || '')}
                />
              )}
              {section === 'favorites' && (
                <MeFavorites
                  favs={favs}
                  isPublic={favIsPublic}
                  onToggleVisibility={handleToggleFavVisibility}
                />
              )}
              {section === 'stats' && <MeStats persona={persona} myPhotos={myPhotos} />}
              {section === 'settings' && (
                <MeSettings persona={persona} isVoyageur={isVoyageur} />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
