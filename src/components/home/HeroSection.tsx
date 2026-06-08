'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Photo, Photographer } from '@/lib/types';
import { ViewfinderFrame } from '@/components/photo/ViewfinderFrame';
import { PulseCountUp } from '@/components/editorial/PulseCountUp';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRealtimePulse } from '@/hooks/useRealtimePulse';

import { useTranslations } from 'next-intl';

interface HeroSectionProps {
  banner: Photo;
  top: Photo;
  bannerPhotographer: Photographer | undefined;
  topPhotographer: Photographer | undefined;
}

export function HeroSection({ banner, top, bannerPhotographer, topPhotographer }: HeroSectionProps) {
  const router = useRouter();
  const t = useTranslations('HeroSection');
  const live = useRealtimePulse([top?.id, banner?.id].filter(Boolean) as string[]);
  const topLikes = (top && live[top.id]?.likes) ?? top?.likes;
  const [content, setContent] = useState({
    headline: t('headline'),
    description: t('description')
  });

  useEffect(() => {
    const fetchContent = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'hero_section').single();
      if (data?.value) {
        setContent(prev => ({ ...prev, ...data.value }));
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="relative">
      {/* Full-bleed banner */}
      <div
        className="relative overflow-hidden bg-black h-[68vh] min-h-[460px] md:min-h-[520px] max-h-[760px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={(content as any).image_url || banner.src} alt={banner.title} className="w-full h-full object-cover" />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.45)_0%,rgba(0,0,0,.08)_35%,rgba(0,0,0,.1)_65%,rgba(0,0,0,.65)_100%)]"
        />
        {/* Top bar */}
        <div className="absolute top-6 md:top-8 left-4 right-4 md:left-10 md:right-10 flex justify-between items-baseline text-white">
          <div className="mono text-[11px] tracking-[.22em] uppercase opacity-85">
            GOGRAPHY Ranking
          </div>
          <div className="mono text-[11px] tracking-[.22em] uppercase opacity-85">
            {t('season_live', { season: 'Season 01' })}
          </div>
        </div>
        {/* Bottom copy */}
        <div className="absolute left-4 right-4 md:left-10 md:right-10 bottom-6 md:bottom-12 text-white">
          <div className="wrap !p-0 !max-w-none">
            <h1
              className="th font-light leading-[.92] text-white m-0 max-w-[14ch] text-[clamp(44px,11vw,128px)] md:text-[clamp(64px,8vw,128px)] tracking-[-.035em]"
              dangerouslySetInnerHTML={{ __html: content.headline }}
            >
            </h1>
            <div className="mt-6 md:mt-7 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-10">
              <p className="th text-[14px] md:text-[16px] leading-[1.55] max-w-[460px] text-white/85 m-0" dangerouslySetInnerHTML={{ __html: content.description }}>
              </p>
              <div className="flex flex-col sm:flex-row gap-[10px] w-full md:w-auto shrink-0">
                <button
                  onClick={() => router.push('/explore')}
                  className="px-[22px] py-3 bg-white text-black text-[11px] tracking-[.14em] uppercase font-medium cursor-pointer border-0"
                >
                  {t('explore')}
                </button>
                <button
                  onClick={() => router.push('/faq')}
                  className="px-[22px] py-3 text-[11px] tracking-[.14em] uppercase font-medium cursor-pointer bg-[rgba(255,255,255,.08)] text-white border border-[rgba(255,255,255,.45)] w-full sm:w-auto"
                >
                  {t('how_ranking_works')}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Banner credit */}
        <div className="absolute bottom-3 right-4 md:right-10 text-white/55 hidden sm:block">
          <div className="mono text-[10px] tracking-[.18em] uppercase">
            {t('banner_credit', { title: banner.title, name: bannerPhotographer?.name || '' })}
          </div>
        </div>
      </div>

      {/* Cover of the week — viewfinder treatment on black */}
      <div className="bg-black text-white py-20">
        {/* Viewfinder top strip — frame/aperture/shutter metadata */}
        <div className="wrap flex justify-between items-baseline pb-6 text-white/65">
          <div className="caps opacity-85">{t('cover_of_week')}</div>
          <div className="mono text-[11px] tracking-[.18em] uppercase">
            ★ #1 · <PulseCountUp value={topLikes} decimals={0} suffix=" LIKES" />
          </div>
        </div>

        {/* Viewfinder frame — corner brackets only, no grid / crosshair / HUD text */}
        <div className="wrap pb-7">
          <ViewfinderFrame
            showGrid={false}
            showCrosshair={false}
            showAF={false}
            onClick={() => router.push(`/photo/${top.id}`)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={top.src}
              alt={top.title}
              loading="lazy"
              className="w-full max-h-[80vh] object-cover"
            />
          </ViewfinderFrame>
        </div>

        <div className="wrap">
          <h2 className="th text-[clamp(36px,4.4vw,64px)] font-normal tracking-[-.02em] m-0 leading-[1.05] text-white">
            &quot;{top.title}&quot;
          </h2>
          <div className="mono text-[12px] tracking-[.12em] uppercase mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="opacity-80">{t('by', { name: topPhotographer?.name || '' })}</span>
            <span className="opacity-40">·</span>
            <span className="opacity-60">{top.exif.camera} · {top.exif.focal}</span>
            <button
              onClick={() => router.push(`/photo/${top.id}`)}
              className="caps cursor-pointer border-b border-white/85 pb-1 ml-auto text-white"
            >
              {t('view_photo')} →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
