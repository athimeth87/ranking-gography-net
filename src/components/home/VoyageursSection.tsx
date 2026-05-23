'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Photo } from '@/lib/types';
import { VoyageurMark, RewardIcon } from '@/components/icons';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface RewardBadgeProps {
  icon: 'voucher' | 'cashback' | 'star';
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
  const [content, setContent] = useState({
    title: 'Travelled with us?<br />Become a Voyageur',
    description: 'Customers who have travelled with GOGRAPHY earn <strong>Voyageur</strong> status — eligible to submit photos in a customer-only category. Each season the winner receives a 50,000 THB voucher, and the top 10 receive cashback on their next trip.',
    reward1_amount: '50,000 THB',
    reward1_label: 'VOUCHER',
    reward1_sub: 'ต่อหมวด',
    reward2_amount: '3-15%',
    reward2_label: 'CASHBACK',
    reward2_sub: 'TOP 10'
  });

  useEffect(() => {
    const fetchContent = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.from('site_settings').select('value').eq('id', 'voyageurs_section').single();
      if (data?.value) {
        setContent({ ...content, ...data.value });
      }
    };
    fetchContent();
  }, []);

  return (
    <section className="py-20 border-t border-[var(--rule)]">
      <div className="wrap grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55 mb-6 flex items-center gap-2">
            <VoyageurMark size={9} /> The Voyageurs Programme
          </div>
          <div className="mono text-[11px] opacity-55">EXCLUSIVE · VOYAGEURS ONLY</div>
        </div>

        <div
          className="grid items-center grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 md:gap-14 lg:gap-20"
        >
          {/* Left: copy */}
          <div>
            <h2 className="th text-[56px] leading-[1.05] tracking-tight mb-6" dangerouslySetInnerHTML={{ __html: content.title }}></h2>
          
            <p className="th text-[15px] leading-[1.7] text-[var(--fg-soft)] mb-10 max-w-[460px]" dangerouslySetInnerHTML={{ __html: content.description }}></p>
          
            <div className="flex gap-4 mb-12">
              <RewardBadge icon="voucher" label={content.reward1_amount} sub={`${content.reward1_label} · ${content.reward1_sub}`} />
              <RewardBadge icon="cashback" label={content.reward2_amount} sub={`${content.reward2_label} · ${content.reward2_sub}`} />
              <RewardBadge icon="star" label="Voyageur" sub="PUBLIC BADGE · ตลอดชีพ" />
            </div>
            <div className="flex gap-3 mt-10 flex-wrap">
              <button className="btn btn-solid" onClick={() => router.push('/for-customers')}>
                How to join Voyageurs
              </button>
              <Link href="/hall-of-fame" className="btn">
                Past winners
              </Link>
            </div>
          </div>

          {/* Right: featured photo */}
          <div>
            <div className="relative">
              <div
                className="pimg overflow-hidden cursor-pointer aspect-[4/5]"
                onClick={() => router.push('/photographers/voyageurs')}
              >
                {(content.image_url || featuredPhoto) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={content.image_url || featuredPhoto?.src}
                    alt="Voyageur Featured"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute top-4 left-4 bg-[var(--bg)] px-[10px] py-[6px] flex items-center gap-[6px]">
                <VoyageurMark size={8} />
                <div className="caps text-[9px]">Voyageur Pick</div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-14 md:mt-20 pt-10 md:pt-14 border-t border-[var(--rule)]">
          <div className="caps opacity-55 mb-6 md:mb-8">How it works · 3 steps</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-14">
            <Step
              n="01"
              t="รับการยืนยันสถานะ"
              b="หลังจบทริป ทีม GOGRAPHY จะ mark บัญชีของคุณเป็น Voyageur ภายใน 7 วัน"
            />
            <Step
              n="02"
              t="อัพโหลดภาพจากทริป"
              b="ส่งได้วันละ 1 รูปต่อบัญชี · ส่งสะสมต่อเนื่องตลอดฤดูกาล (4 เดือน)"
            />
            <Step
              n="03"
              t="ลุ้นรางวัล"
              b="ปลายฤดูกาล ทีมงานเลือกภาพดีที่สุดต่อหมวด — ผู้ชนะ 50,000 THB voucher และ Top 10 ได้ cashback 3–15%"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
