'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PageCover } from '@/components/layout/PageCover';
import { MeSidebar } from '@/components/account/MeSidebar';
import { MeDashboard } from '@/components/account/MeDashboard';
import { MePhotos } from '@/components/account/MePhotos';
import { MeFavorites } from '@/components/account/MeFavorites';
import { MeGalleries } from '@/components/account/MeGalleries';
import { MeStats } from '@/components/account/MeStats';
import { MeSettings } from '@/components/account/MeSettings';
import { MobileMe } from '@/components/mobile/MobileMe';

interface PageProps {
  params: { section?: string[] };
}

export default function Page({ params }: PageProps) {
  const { authUser } = useApp();
  const section = params.section?.[0] ?? 'dashboard';

  const [profile, setProfile] = useState<any>(null);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [galleriesCount, setGalleriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async (profileUsername: string) => {
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    const { data: photos } = await supabase.from('photos').select('*').eq('photographer_id', authUser.id).order('uploaded_at', { ascending: false });
    
    const mappedPhotos = (photos || []).map((p: any) => ({
      id: p.id,
      slug: p.id,
      title: p.title,
      by: profileUsername || authUser.email?.split('@')[0] || 'Unknown',
      cat: p.category,
      w: p.width || 4,
      h: p.height || 3,
      src: p.storage_url,
      caption: p.caption || '',
      exif: { camera: 'Unknown', lens: 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
      likes: p.likes_count || 0,
      likes24h: 0,
      comments: 0,
      favorites: p.favorites_count || 0,
      hours: 1,
      picks: [],
      date: p.uploaded_at,
      pulse: p.pulse_score || 0,
      rank: 0
    }));

    setMyPhotos(mappedPhotos);
  };

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      
      // 1. Fetch Profile
      const { data: prof } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
      
      // 3. Fetch Favorites Count
      const { count } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id);
      
      // 4. Fetch Galleries Count
      const { count: galCount } = await supabase.from('galleries').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id);
      
      setProfile(prof || {
        username: authUser.email?.split('@')[0],
        display_name: authUser.email?.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || ''
      });

      await fetchPhotos(prof?.username || '');

      setFavoritesCount(count || 0);
      setGalleriesCount(galCount || 0);
      setLoading(false);
    };

    fetchData();
  }, [authUser]);

  if (loading) return <div className="page-fade py-24 text-center opacity-50 caps">Loading dashboard...</div>;
  if (!profile) return <div className="page-fade py-24 text-center opacity-50 caps">Please sign in</div>;

  const isVoyageur = profile.is_customer;
  const isPhotographer = profile.photographer_status === 'approved';

  const persona = {
    username: profile.username || '',
    name: profile.display_name || '',
    avatar: profile.avatar_url || '',
    loc: profile.location || 'Not set',
    bio: profile.bio || '',
    website: profile.portfolio_url || '',
    isCustomer: profile.is_customer
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', path: '/me' },
    {
      id: 'photos',
      label: 'My Photos',
      path: '/me/photos',
      count: myPhotos.length,
    },
    { id: 'favorites', label: 'Favorites', path: '/me/favorites', count: favoritesCount },
    { id: 'galleries', label: 'Galleries', path: '/me/galleries', count: galleriesCount },
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
        <MobileMe 
          section={section}
          profile={profile}
          myPhotos={myPhotos}
          isVoyageur={isVoyageur}
          favoritesCount={favoritesCount}
          galleriesCount={galleriesCount}
        />
      </div>
      <div
        className="hidden md:grid wrap items-start pt-12 px-10 pb-24 grid-cols-[240px_1fr] gap-14"
      >
        <MeSidebar
          persona={persona}
          isVoyageur={isVoyageur}
          isPhotographer={isPhotographer}
          sections={sections}
          activeSection={section}
        />

        <main>
          {section === 'dashboard' && (
            <MeDashboard
              persona={persona}
              isVoyageur={isVoyageur}
              isPhotographer={isPhotographer}
              myPhotos={myPhotos}
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
          {section === 'favorites' && <MeFavorites />}
          {section === 'galleries' && (
            <MeGalleries persona={persona} myPhotos={myPhotos} />
          )}
          {section === 'stats' && <MeStats persona={persona} myPhotos={myPhotos} />}
          {section === 'settings' && (
            <MeSettings persona={persona} isVoyageur={isVoyageur} />
          )}
        </main>
      </div>
    </div>
  );
}
