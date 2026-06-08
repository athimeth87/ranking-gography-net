'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Gography Photo Ranking คืออะไร?',
    answer: (
      <div className="space-y-[20px]">
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          GOGRAPHY เริ่มต้นจากบริษัททัวร์ กว่า 10 ปีที่เราพานักเดินทางนับพันไปเก็บภาพในสถานที่สวยงามทั่วโลก
          ในที่ที่คนไม่กี่คนได้ไป จนวันหนึ่งเราเริ่มถามตัวเองว่า — ภาพเหล่านั้นควรไปอยู่ที่ไหน
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          Gography Photo Ranking คือพื้นที่สำหรับนักเดินทางและช่างภาพที่อยากแบ่งปันภาพถ่ายจากการเดินทาง
          พร้อมเข้าร่วมการจัดอันดับภาพถ่ายประจำสัปดาห์ เพื่อค้นหาภาพที่โดดเด่นที่สุดจากชุมชน Gography
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          ระบบนี้ถูกออกแบบให้ทุกภาพมีโอกาสถูกมองเห็น ไม่ว่าจะเป็นช่างภาพมืออาชีพหรือลูกค้าที่ร่วมเดินทาง
          ทุกคนสามารถส่งภาพ แบ่งปันแรงบันดาลใจ และเป็นส่วนหนึ่งของชุมชน Gography ได้
        </p>
      </div>
    ),
  },
  {
    question: 'มีหมวดการแข่งขันอะไรบ้าง?',
    answer: (
      <div className="space-y-[24px]">
        <div className="pb-[24px] border-b border-[var(--rule)]">
          <h4 className="text-[18px] font-normal tracking-[-0.015em] m-0 mb-[10px]">Classic</h4>
          <p className="th text-[15px] leading-[1.85] text-fg-soft m-0">
            หมวดเปิดสำหรับทุกคน ส่งภาพได้ทุกแนว ทั้ง Landscape, Portrait หรือ Black & White
            มาประชันกันบนการจัดอันดับประจำซีซั่น
          </p>
        </div>
        <div>
          <h4 className="text-[18px] font-normal tracking-[-0.015em] m-0 mb-[10px]">Traveller</h4>
          <p className="th text-[15px] leading-[1.85] text-fg-soft m-0">
            หมวดพิเศษเฉพาะลูกค้าที่เคยร่วมเดินทางกับ Gography ได้แข่งขันกันเองในกลุ่ม
            พร้อมลุ้นรางวัลพิเศษที่เราจัดเตรียมไว้ให้
          </p>
        </div>
        <p className="th text-[14px] leading-[1.85] text-fg-soft opacity-70 m-0">
          ผู้ใช้ทั่วไปเข้าร่วมได้เฉพาะหมวด Classic ส่วนลูกค้าของ Gography เข้าถึงได้ทั้งสองหมวด
        </p>
      </div>
    ),
  },
  {
    question: 'สมาชิกมีกี่ประเภท?',
    answer: (
      <div className="space-y-[24px]">
        {(
          [
            { name: 'User', desc: 'นักเดินทางและช่างภาพทั่วไป ส่งภาพแข่งในหมวด Classic ได้' },
            { name: 'Traveller', desc: 'ลูกค้าที่เคยร่วมทริปกับ Gography เข้าถึงได้ทั้งหมวด Classic และ Traveller พร้อมสิทธิ์ลุ้นรางวัลพิเศษ' },
            { name: 'Rank Master', desc: 'ช่างภาพที่รักษาอันดับ 1 ถึง 3 ได้ต่อเนื่อง 4 สัปดาห์ จะได้รับตรา Rank Master พร้อมสิทธิ์เข้าร่วม Tournament ประจำเดือน Season และประจำปี โดยสถานะนี้อยู่กับคุณตลอดทั้ง Season' },
            { name: 'Ambassador', desc: 'ช่างภาพที่ทีมงาน Gography คัดเลือกด้วยตัวเองจากฝีมือที่เป็นที่ประจักษ์ โดยไม่ต้องผ่านการจัดอันดับ สถานะนี้อยู่ตลอดทั้ง Season เช่นกัน' },
          ] as { name: string; desc: string }[]
        ).map((m, i, arr) => (
          <div key={m.name} className={i < arr.length - 1 ? 'pb-[24px] border-b border-[var(--rule)]' : ''}>
            <h4 className="text-[18px] font-normal tracking-[-0.015em] m-0 mb-[10px]">{m.name}</h4>
            <p className="th text-[15px] leading-[1.85] text-fg-soft m-0">{m.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    question: 'Ambassador คืออะไร?',
    answer: (
      <div className="space-y-[20px]">
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          Ambassador คือสถานะพิเศษสำหรับช่างภาพที่ได้รับการคัดเลือกโดยทีมงาน Gography
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          สถานะนี้มอบให้กับช่างภาพที่มีผลงานโดดเด่น มีมุมมองการถ่ายภาพที่ชัดเจน
          และมีคุณภาพเหมาะสมกับภาพลักษณ์ของเว็บไซต์ โดยไม่จำเป็นต้องติดอันดับในระบบ Ranking
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          Ambassador จึงเป็นเหมือนตัวแทนของช่างภาพคุณภาพที่ Gography ให้การยอมรับและคัดเลือกเป็นพิเศษ
        </p>
      </div>
    ),
  },
  {
    question: 'Ranked Master Badge คืออะไร?',
    answer: (
      <div className="space-y-[20px]">
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          Badge พิเศษสำหรับช่างภาพที่สามารถติดอันดับ Top 1–3 ติดต่อกันเป็นเวลา 4 สัปดาห์
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          Badge นี้สะท้อนถึงความสามารถ ความสม่ำเสมอ และคุณภาพของผลงานที่ได้รับการยอมรับจากระบบ Ranking อย่างต่อเนื่อง
          ช่างภาพที่ได้รับ Ranked Master ไม่ได้โดดเด่นเพียงแค่ครั้งเดียว
          แต่สามารถรักษามาตรฐานของผลงานไว้ได้ในระดับสูงติดต่อกันหลายสัปดาห์
        </p>
      </div>
    ),
  },
  {
    question: 'Travellers ได้สิทธิ์อะไรบ้าง?',
    answer: (
      <div className="space-y-[20px]">
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          Travellers คือกลุ่มลูกค้าที่เคยร่วมเดินทางกับ Gography สมาชิกกลุ่มนี้จะได้รับสิทธิ์พิเศษ
          ในการอัปโหลดภาพถ่ายเข้าสู่เว็บไซต์ได้ ทั้งในหมวดภาพถ่ายทั่วไปและหมวดพิเศษสำหรับลูกค้า Gography โดยเฉพาะ
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          ใน Travellers Ranking ลูกค้าจะได้ร่วมสนุกกับการส่งภาพเข้าประกวด
          และแข่งขันกับลูกค้าที่เคยเดินทางกับ Gography ด้วยกันเอง
          โดยเว็บไซต์จะเป็นผู้กำหนดรางวัลพิเศษให้กับภาพที่ได้รับการคัดเลือกหรือได้รับคะแนนสูงสุด
        </p>
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          หมวดนี้ถูกสร้างขึ้นเพื่อให้ภาพถ่ายจากทุกการเดินทางไม่ได้เป็นเพียงความทรงจำส่วนตัว
          แต่ยังสามารถถูกแบ่งปัน สร้างแรงบันดาลใจ และกลายเป็นส่วนหนึ่งของชุมชน Gography ได้
        </p>
      </div>
    ),
  },
  {
    question: 'รางวัล Season มีอะไรบ้าง?',
    answer: (
      <div className="space-y-[20px]">
        <p className="th text-[16px] leading-[1.85] text-fg-soft m-0">
          สำหรับ Traveller ทุก 4 เดือนเราคัดเลือกภาพที่ดีที่สุดแห่งฤดูกาล
          มอบ Voucher มูลค่า 50,000 บาท และจารึกไว้ใน Hall of Fame ตลอดไป
        </p>
        <div className="mt-[8px]">
          <Link href="/upload" className="btn btn-solid">เริ่มส่งภาพ</Link>
        </div>
      </div>
    ),
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="page-fade">
      <PageCover
        photoId="p013"
        eyebrow="FAQ"
        title={<>Frequently<br />Asked Questions</>}
        subtitle="ทุกอย่างที่คุณอยากรู้เกี่ยวกับ Gography Photo Ranking"
      />

      <section className="pt-[80px] pb-[120px]">
        <div className="wrap-narrow">
          <div className="divide-y divide-[var(--rule)]">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between py-[28px] text-left gap-[24px]"
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                >
                  <span className="th text-[18px] font-normal tracking-[-0.01em] leading-[1.4]">
                    {item.question}
                  </span>
                  <span
                    className="shrink-0 text-[18px] opacity-55 transition-transform duration-200"
                    style={{ display: 'inline-block', transform: openIndex === i ? 'rotate(90deg)' : 'none' }}
                  >
                    →
                  </span>
                </button>
                {openIndex === i && (
                  <div className="pb-[36px]">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
