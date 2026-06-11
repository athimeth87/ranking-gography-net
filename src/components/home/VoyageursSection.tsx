'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Photo } from '@/lib/types';
import { VoyageurMark, RewardIcon } from '@/components/icons';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface RewardBadgeProps {
  icon: 'cashback' | 'star';
  label: string;
  sub: string;
}

function RewardBadge({ icon, label, sub }: RewardBadgeProps) {
  return (
    <div className="flex gap-[10px] items-start px-[14px] py-[10px] border border-[var(--rule)] min-w-[180px]">
      <div className="pt-[2px]">
        <RewardIcon kind={icon} size={20} />
      </div>
      <div className="text-left">
        <div className="mono text-[14px] font-medium leading-[1.1] tracking-[-.01em]">
          {label}
        </div>
        <div className="caps opacity-55 text-[9.5px] mt-1">{sub}</div>
      </div>
    </div>
  );
}

interface StepProps {
  n: string;
  t: string;
  b: string;
}

function Step({ n, t, b }: StepProps) {
  return (
    <div>
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55">{n}</div>
      <h3
        className="th font-medium mt-3 mb-0 leading-[1.25] text-[22px] tracking-[-.01em]"
      >
        {t}
      </h3>
      <p className="th text-[14px] leading-[1.7] text-[var(--fg-soft)] mt-[14px]">{b}</p>
    </div>
  );
}

interface VoyageursSectionProps {
  featuredPhoto: Photo | undefined;
}

export function VoyageursSection({ featuredPhoto }: VoyageursSectionProps) {
  const router = useRouter();
  const t = useTranslations('VoyageursSection');
  const [content, setContent] = useState({
    title: t.raw('title'),
    description: t.raw('description'),
    reward1_amount: '50,000 THB',
    reward1_label: 'CASHBACK',
    reward1_sub: 'RANK 1',
    reward2_amount: '3–15%',
    reward2_label: 'CASHBACK',
    reward2_sub: 'TOP 10',
    image_url: '/traveller-pick.jpg'
  });

  useEffect(() => {
    const fetchContent = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'voyageurs_section').single();
      if (data?.value?.image_url) {
        // copy + reward figures stay in code; DB only supplies the featured image
        setContent((c) => ({ ...c, image_url: data.value.image_url }));
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="py-24 bg-[var(--cream)] rule-top rule-bot">
      <div className="wrap">
        <div className="flex justify-between items-baseline pb-8 border-b border-[var(--rule)] mb-14">
          <div className="caps opacity-55 flex items-center gap-2">
            <VoyageurMark size={9} /> {t('program_name')}
          </div>
          <div className="mono text-[11px] opacity-55">{t('exclusive')}</div>
        </div>

        <div
          className="grid items-center grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-20"
        >
          {/* Left: copy */}
          <div>
            <h2
              className="font-normal m-0 leading-[1.05] text-[clamp(40px,4.6vw,64px)] tracking-[-.025em] mb-7"
              dangerouslySetInnerHTML={{ __html: content.title.replace(/\\n|\n/g, '<br />') }}
            ></h2>
          
            <p className="th text-[17px] leading-[1.65] text-[var(--fg-soft)] max-w-[520px] mb-8" dangerouslySetInnerHTML={{ __html: content.description }}></p>
          
            <div className="flex gap-4 mb-12">
              <RewardBadge icon="cashback" label={content.reward1_amount} sub={`${content.reward1_label} · ${content.reward1_sub}`} />
              <RewardBadge icon="cashback" label={content.reward2_amount} sub={`${content.reward2_label} · ${content.reward2_sub}`} />
              <RewardBadge icon="star" label="Traveller" sub={t('badge_sub')} />
            </div>
            <div className="flex gap-3 mt-10 flex-wrap">
              <button className="btn btn-solid" onClick={() => router.push('/for-customers')}>
                {t('how_to_join')}
              </button>
              <Link href="/hall-of-fame" className="btn">
                {t('past_winners')}
              </Link>
            </div>
          </div>

          {/* Right: featured photo */}
          <div>
            <div className="relative">
              <div
                className="pimg overflow-hidden cursor-pointer aspect-[4/5]"
                onClick={() => router.push('/photographers/travellers')}
              >
                {(content.image_url || featuredPhoto) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content.image_url || featuredPhoto?.src}
                    alt="Traveller Featured"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute top-4 left-4 bg-[var(--bg)] px-[10px] py-[6px] flex items-center gap-[6px]">
                <VoyageurMark size={8} />
                <div className="caps text-[9px]">{t('voyageur_pick')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-20 pt-14 border-t border-[var(--rule)]">
          <div className="caps opacity-55 mb-8">{t('how_it_works')}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-14">
            <Step
              n="01"
              t={t('step1_title')}
              b={t('step1_desc')}
            />
            <Step
              n="02"
              t={t('step2_title')}
              b={t('step2_desc')}
            />
            <Step
              n="03"
              t={t('step3_title')}
              b={t('step3_desc')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
