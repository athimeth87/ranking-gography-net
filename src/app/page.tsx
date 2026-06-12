'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Photo, Photographer } from '@/lib/types';
import { fetchLivePhotoData } from '@/lib/data';
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

  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [voyageurUsernames, setVoyageurUsernames] = useState<Set<string>>(new Set());
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const live = await fetchLivePhotoData(supabase);
      if (live.error) setDbErrorMsg(live.error);
      setAllPhotos(live.photos);
      setPhotographers(live.photographers);
      setVoyageurUsernames(live.voyageurUsernames);
    };
    fetchData();
  }, []);

  // Realtime: any photo row UPDATE (likes/comments/favorites counter)
  // patches allPhotos so the All-time grid re-ranks live.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel('photos-home-listing')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos' },
        (payload) => {
          const next = payload.new as { id: string; likes_count?: number; comments_count?: number; favorites_count?: number };
          setAllPhotos((curr) =>
            curr.map((p) => {
              if (p.id !== next.id) return p;
              const likes = typeof next.likes_count === 'number' ? next.likes_count : p.likes;
              const favorites = typeof next.favorites_count === 'number' ? next.favorites_count : p.favorites;
              const comments = typeof next.comments_count === 'number' ? next.comments_count : p.comments;
              return { ...p, likes, favorites, comments };
            }),
          );
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getActivePhoto = (id: string) => allPhotos.find(p => p.id === id);
  const getActivePhotographer = (by: string) => photographers.find(p => p.username === by);

  // Hero photo: explicit pick or fallback to rank #1 (already pulse-sorted)
  const top = (heroPhotoId !== 'auto' ? getActivePhoto(heroPhotoId) : undefined) ?? allPhotos[0];
  // Banner photo: explicit pick or fallback to rank #1
  const banner = getActivePhoto(bannerPhotoId) ?? allPhotos[0];

  const bannerPhotographer = banner ? getActivePhotographer(banner.by) : undefined;
  const topPhotographer = top ? getActivePhotographer(top.by) : undefined;
  // Featured Traveller photo: highest-ranked photo by a Traveller (customer)
  const featuredVoyageurPhoto = allPhotos.find(p => voyageurUsernames.has(p.by));

  return (
    <>
      <div className="md:hidden">
        <MobileHome realPhotos={allPhotos} realPhotographers={photographers} />
      </div>
      <div className="page-fade hidden md:block">
        <HeroSection
          banner={banner}
          top={top}
          bannerPhotographer={bannerPhotographer}
          topPhotographer={topPhotographer}
        />
        {/* Marquee — top-12 photos ticker with real user profiles */}
        <Marquee
          speedSec={70}
          items={allPhotos.slice(0, 12).map((p, i) => {
            const photographer = photographers.find(rp => rp.username === p.by);
            return {
              num: String(i + 1).padStart(2, '0'),
              title: p.title,
              by: (photographer?.name ?? p.by).toUpperCase(),
              avatar: p.avatarUrl ?? photographer?.avatar,
              href: photographer ? `/photographer/${photographer.username}` : `/photo/${p.slug}`,
              isAmbassador: photographer?.isAmbassador ?? false,
              isCustomer: photographer?.isCustomer ?? false,
            };
          })}
        />
        <TrendsNowSection photos={allPhotos} />
        <LeaderboardSection allPhotos={allPhotos} voyageurUsernames={voyageurUsernames} />

        {dbErrorMsg && (
          <div className="th border border-rule p-4 text-center">
            Database Error fetching All-time photos: {dbErrorMsg}
          </div>
        )}

        <AlltimeSection allPhotos={allPhotos} voyageurUsernames={voyageurUsernames} />
        <FeaturedPhotographersSection
          photographers={photographers}
          allPhotos={allPhotos}
        />
        <VoyageursSection featuredPhoto={featuredVoyageurPhoto} />
        <Footer />
      </div>
    </>
  );
}
