'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { SectionHeader } from '@/components/Shared';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/about.jsx =====
// About — manifesto-style page

function PageAbout() {
  return (
    <div className="page-fade">
      <PageCover
        photoId="p013"
        eyebrow="About"
        title={<>A platform for photographers<br />who never stop travelling</>}
        subtitle="GOGRAPHY Photo Awards — เวทีสำหรับช่างภาพและนักเดินทาง ภาพต้องหายใจได้ ไม่ใช่ภาพที่ algorithm จัดการ"
      />

      <section className="pb-12 md:pb-16 lg:pb-24">
        <div className="wrap-narrow">
          <p className="th text-[18px] md:text-[20px] lg:text-[22px]" style={{ lineHeight: 1.6, letterSpacing: '-.005em', color: 'var(--fg)' }}>
            GOGRAPHY เริ่มต้นจากบริษัททัวร์ — เราออกแบบทริปถ่ายภาพในที่ที่นักเดินทางไม่กี่คนได้ไป Patagonia, Iceland, Atacama, Mongolia เราอยากเห็นภาพเหล่านั้นมารวมตัวอยู่ในที่เดียว
          </p>
          <div className="magrule my-8 md:my-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <p className="th text-[14px] md:text-[15px]" style={{ lineHeight: 1.8, color: 'var(--fg-soft)' }}>
              500px ถูกขายไปนานแล้ว Instagram กลายเป็นที่ของ reel ที่เร่งจังหวะให้เร็วเกินกว่าภาพจะหายใจ เราเห็นช่องว่าง — ที่สำหรับภาพถ่ายที่ทำด้วยใจ ไม่ใช่ algorithm
            </p>
            <p className="th text-[14px] md:text-[15px]" style={{ lineHeight: 1.8, color: 'var(--fg-soft)' }}>
              GOGRAPHY Photo Awards คือเวทีที่นั่น คะแนนจัดอันดับเปิดเผยทั้งหมด ทุก 4 เดือนเราเลือกภาพที่ดีที่สุดของฤดูกาล มอบ Voucher 50,000 บาท และเก็บไว้ใน Hall of Fame ตลอดไป
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24 rule-top rule-bot" style={{ background: 'var(--cream)' }}>
        <div className="wrap">
          <div className="mono grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <BigStat n="2026" l="Launched" />
            <BigStat n="3" l="Categories at launch" />
            <BigStat n="50K" l="THB voucher per season" />
            <BigStat n="∞" l="Hall of Fame slots" />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24">
        <div className="wrap-narrow">
          <SectionHeader title="Editorial team" eyebrow="Editorial team" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
            {[
              { name: 'Anan Khamthuan', role: 'Editor in Chief', loc: 'Bangkok' },
              { name: 'Sasin Phongphan', role: 'Curation Director', loc: 'Chiang Mai' },
              { name: 'Vichai Sasiprapha', role: 'Travel Lead, GOGRAPHY', loc: 'Bangkok' },
              { name: 'Naree Suwannapong', role: 'Community', loc: 'Bangkok' },
            ].map(p => (
              <div key={p.name} className="pb-6 md:pb-8" style={{ borderBottom: '1px solid var(--rule)' }}>
                <h4 className="text-[18px] md:text-[22px] font-normal m-0" style={{ letterSpacing: '-.015em' }}>{p.name}</h4>
                <div className="caps mt-2" style={{ opacity: .55 }}>{p.role} · {p.loc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-24 pb-16 md:pb-20 lg:pb-32 rule-top">
        <div className="wrap-narrow text-center">
          <h2 className="th text-[clamp(28px,6vw,44px)] font-normal m-0" style={{ letterSpacing: '-.02em', lineHeight: 1.15 }}>
            Want to join us?
          </h2>
          <div className="flex justify-center gap-3 md:gap-4 mt-6 md:mt-8 flex-wrap">
            <button className="btn btn-solid">Apply as photographer</button>
            <button className="btn">Travel with GOGRAPHY</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function BigStat({ n, l }) {
  return (
    <div>
      <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginTop: 16 }}>{l}</div>
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageAbout />; }
