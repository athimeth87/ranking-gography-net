// About — Gography Photo Ranking brand story

import Link from 'next/link';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-[40px]">
      {eyebrow && <div className="caps mb-[16px] opacity-55">{eyebrow}</div>}
      <h2 className="text-[32px] md:text-[36px] font-normal tracking-[-0.02em] m-0 leading-[1.15]">{title}</h2>
    </div>
  );
}

function DefRow({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="pb-[28px] border-b border-[var(--rule)]">
      <h4 className="text-[22px] font-normal tracking-[-0.015em] m-0">{name}</h4>
      <p className="text-[15px] leading-[1.85] text-fg-soft mt-[12px] m-0">{desc}</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className="page-fade">
      <PageCover
        photoId="p013"
        eyebrow="About"
        title={<>Gography<br />Photo Ranking</>}
        subtitle="โซเชียลมีเดียของคนไทยที่ให้คุณค่ากับศิลปะของภาพถ่าย — ที่ที่ทุกเฟรมได้รับการมองเห็น"
      />

      {/* Brand story */}
      <section className="pt-[96px] pb-[80px]">
        <div className="wrap-narrow">
          <p className="font-serif text-[clamp(22px,2.4vw,30px)] leading-[1.5] tracking-[-0.01em] text-fg max-w-[68ch] m-0">
            GOGRAPHY เริ่มต้นจากบริษัททัวร์ กว่า 10 ปีที่เราพานักเดินทางนับพันไปเก็บภาพในสถานที่สวยงามทั่วโลก
            ในที่ที่คนไม่กี่คนได้ไป จนวันหนึ่งเราเริ่มถามตัวเองว่า — ภาพเหล่านั้นควรไปอยู่ที่ไหน
          </p>
          <div className="magrule my-[64px]" />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-[48px] md:gap-[64px]">
            <p className="font-serif text-[16px] leading-[1.85] text-fg-soft m-0">
              เราอยากสร้างโซเชียลมีเดียของคนไทยที่ให้คุณค่ากับศิลปะของภาพถ่ายอย่างแท้จริง
              ที่ที่ทุกเฟรมได้รับการมองเห็น ไม่ถูกกลบด้วยฟีดที่เร่งรีบ
              และเป็นที่รวมผลงานและเรื่องราวดี ๆ จากชุมชนนักเดินทาง
            </p>
            <p className="font-serif text-[16px] leading-[1.85] text-fg-soft m-0">
              Gography Photo Ranking คือคำตอบของคำถามนั้น ทุกสัปดาห์เราจัดอันดับภาพที่ดีที่สุด
              เพื่อค้นหาผลงานที่โดดเด่นและส่งต่อสู่เวที Tournament ในระดับต่าง ๆ
              ไม่ว่าคุณจะเป็นช่างภาพมืออาชีพ หรือนักเดินทางที่เพิ่งกลับจากทริป ทุกภาพมีโอกาสได้ขึ้นสู่อันดับเสมอ
            </p>
          </div>
        </div>
      </section>

      {/* Two competition categories */}
      <section className="py-[80px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="Categories" title="สองหมวดการแข่งขัน" />
          <div className="grid grid-cols-1 gap-[32px]">
            <DefRow
              name="Classic"
              desc="หมวดเปิดสำหรับทุกคน ส่งภาพได้ทุกแนว ทั้ง Landscape, Portrait หรือ Black & White มาประชันกันบนการจัดอันดับประจำสัปดาห์"
            />
            <DefRow
              name="Voyager"
              desc="หมวดพิเศษเฉพาะลูกค้าที่เคยร่วมเดินทางกับ Gography ได้แข่งขันกันเองในกลุ่ม พร้อมลุ้นรางวัลพิเศษที่เราจัดเตรียมไว้ให้"
            />
          </div>
          <p className="text-[15px] leading-[1.85] text-fg-soft mt-[32px] m-0 max-w-[68ch]">
            ผู้ใช้ทั่วไปเข้าร่วมได้เฉพาะหมวด Classic ส่วนลูกค้าของ Gography เข้าถึงได้ทั้งสองหมวด
            ร่วมสนุกและลุ้นรางวัลได้เต็มที่ทั้ง Classic และ Voyager
          </p>
        </div>
      </section>

      {/* Four member types */}
      <section className="py-[80px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="Members" title="ผู้ใช้ 4 ประเภท" />
          <div className="grid grid-cols-1 gap-[32px]">
            <DefRow
              name="User"
              desc="นักเดินทางและช่างภาพทั่วไป ส่งภาพแข่งในหมวด Classic ได้"
            />
            <DefRow
              name="Voyager"
              desc="ลูกค้าที่เคยร่วมทริปกับ Gography เข้าถึงได้ทั้งหมวด Classic และ Voyager พร้อมสิทธิ์ลุ้นรางวัลพิเศษ"
            />
            <DefRow
              name="Rank Master"
              desc="ช่างภาพที่รักษาอันดับ 1 ถึง 3 ได้ต่อเนื่อง 4 สัปดาห์ จะได้รับตรา Rank Master พร้อมสิทธิ์เข้าร่วม Tournament ประจำเดือน Season และประจำปี โดยสถานะนี้อยู่กับคุณตลอดทั้ง Season เป็นเกียรติยศที่พิชิตมาด้วยผลงานล้วน ๆ"
            />
            <DefRow
              name="Ambassador"
              desc="ช่างภาพที่ทีมงาน Gography คัดเลือกด้วยตัวเองจากฝีมือที่เป็นที่ประจักษ์ โดยไม่ต้องผ่านการจัดอันดับ สถานะนี้อยู่ตลอดทั้ง Season เช่นกัน"
            />
          </div>
        </div>
      </section>

      {/* Seasonal reward + closing CTA */}
      <section className="pt-[80px] pb-[120px] rule-top">
        <div className="wrap-narrow">
          <p className="font-serif text-[16px] leading-[1.85] text-fg-soft m-0 max-w-[68ch]">
            และสำหรับ Voyager ทุก 4 เดือนเราคัดเลือกภาพที่ดีที่สุดแห่งฤดูกาล
            มอบ Voucher มูลค่า 50,000 บาท และจารึกไว้ใน Hall of Fame ตลอดไป
          </p>
          <p className="font-serif text-[clamp(24px,2.6vw,34px)] leading-[1.4] tracking-[-0.01em] text-fg mt-[40px] m-0 max-w-[68ch]">
            เริ่มต้นส่งภาพของคุณวันนี้ แล้วให้ทุกเฟรมได้อยู่ในที่ที่มันควรอยู่
          </p>
          <div className="mt-[36px]">
            <Link href="/upload" className="btn btn-solid">เริ่มส่งภาพ</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
