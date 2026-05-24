'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Photo, Photographer, Category } from '@/lib/types';
import { getPhotos, getPhoto, getPhotographer, getPhotographers, getVoyageurUsernames } from '@/lib/data';
import { HeroSection } from '@/components/home/HeroSection';
import { TrendsNowSection } from '@/components/home/TrendsNowSection';
import { LeaderboardSection } from '@/components/home/LeaderboardSection';
import { AlltimeSection } from '@/components/home/AlltimeSection';
import { FeaturedPhotographersSection } from '@/components/home/FeaturedPhotographersSection';
import { VoyageursSection } from '@/components/home/VoyageursSection';
import { Footer } from '@/components/layout/Footer';
import { Marquee } from '@/components/editorial/Marquee';
import { MobileHome } from '@/components/mobile/MobileHome';

export default function LandingPage() {
  const { bannerPhotoId, heroPhotoId } = useApp();
  
  const mockAllPhotos = getPhotos();
  const mockPhotographers = getPhotographers();
  const mockVoyageurUsernames = getVoyageurUsernames();

  const [realAllPhotos, setRealAllPhotos] = useState<Photo[]>([]);
  const [realVoyageurUsernames, setRealVoyageurUsernames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: usersData } = await supabase.from('users').select('*');
      const users = usersData || [];

      const voyUsernames = new Set(
        users.filter(u => u.is_customer).map(u => u.username || u.display_name || 'unknown')
      );
      setRealVoyageurUsernames(voyUsernames);

      const { data: photosData, error } = await supabase.from('photos').select('*').order('uploaded_at', { ascending: false });
      
      if (error) {
        setDbErrorMsg(error.message);
      }
      
      const mappedPhotos: Photo[] = (photosData || []).map(p => {
        const owner = users.find(u => u.id === p.photographer_id);
        const ownerName = owner?.username || owner?.display_name || 'unknown';
        const rawCat = p.category as string;
        const mappedCat = (rawCat === 'bw' ? 'BW' : rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category;

        return {
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          by: ownerName,
          cat: mappedCat,
          w: p.width || 4,
          h: p.height || 3,
          src: p.storage_url,
          caption: p.description || '',
          exif: { camera: p.camera || 'Unknown', lens: p.lens || 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
          likes: p.likes_count || 0,
          likes24h: 0,
          comments: p.comments_count || 0,
          favorites: p.favorites_count || 0,
          hours: 24,
          picks: [],
          date: p.uploaded_at,
          voyageurOnly: p.voyageur_only,
          pulse: (p.likes_count || 0) + (p.favorites_count || 0) * 2,
          rank: 0
        };
      });

      // Sort by pulse for ranking
      mappedPhotos.sort((a, b) => b.pulse - a.pulse);
      mappedPhotos.forEach((p, i) => p.rank = i + 1);

      setRealAllPhotos(mappedPhotos);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getMockPhoto = (id: string) => mockAllPhotos.find(p => p.id === id);
  const getMockPhotographer = (by: string) => mockPhotographers.find(p => p.username === by);

  // Hero photo: explicit pick or fallback to rank #1 (index 0, already sorted by pulse)
  const top = ((heroPhotoId !== 'auto' ? getMockPhoto(heroPhotoId) : undefined) ?? mockAllPhotos[0])!;
  // Banner photo: explicit pick or fallback to rank #1
  const banner = (getMockPhoto(bannerPhotoId) ?? getMockPhoto('p010') ?? mockAllPhotos[0])!;

  const bannerPhotographer = getMockPhotographer(banner.by);
  const topPhotographer = getMockPhotographer(top.by);
  const featuredVoyageurPhoto = getMockPhoto('p015');

  return (
    <>
      <div className="md:hidden">
        <MobileHome />
      </div>
      <div className="page-fade hidden md:block">
        <HeroSection
          banner={banner}
          top={top}
          bannerPhotographer={bannerPhotographer}
          topPhotographer={topPhotographer}
        />
        {/* Marquee — top-12 photos ticker */}
        <Marquee
          speedSec={70}
          items={mockAllPhotos.slice(0, 12).map((p, i) => ({
            num: String(i + 1).padStart(2, '0'),
            title: p.title,
            by: (getMockPhotographer(p.by)?.name ?? p.by).toUpperCase(),
          }))}
        />
        <TrendsNowSection photos={mockAllPhotos} />
        <LeaderboardSection allPhotos={mockAllPhotos} voyageurUsernames={mockVoyageurUsernames} />
        
        {dbErrorMsg && (
          <div className="bg-red-500 text-white p-4 text-center">
            Database Error fetching All-time photos: {dbErrorMsg}
          </div>
        )}

        <AlltimeSection allPhotos={realAllPhotos} voyageurUsernames={realVoyageurUsernames} />
        <FeaturedPhotographersSection photographers={mockPhotographers} allPhotos={mockAllPhotos} />
        <VoyageursSection featuredPhoto={featuredVoyageurPhoto} />
        <Footer />
      </div>
    </>
  );
}
