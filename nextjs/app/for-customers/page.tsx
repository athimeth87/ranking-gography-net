'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { SectionHeader } from '@/components/Shared';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/for-customers.jsx =====
// For Customers — dedicated onboarding & program detail page
// Reachable from: Landing Customer Section, Hall of Fame, Nav banner, Profile "claim status" CTA

function PageForCustomers() {
  const router = useRouter();
  const customerPhoto = PHOTOS.find(p => p.id === 'p015');
  return (
    <div className="page-fade">
      <PageCover
        photoId="p015"
        eyebrow="For Voyageurs"
        title={<>Your trip photos<br />are worth more</>}
        subtitle="ลูกค้า GOGRAPHY ทุกคนได้สถานะ Voyageur — Submit ภาพในหมวดพิเศษ Voyageurs Awards — แข่งกันเฉพาะลูกค้าด้วยกัน รางวัลสูงสุด 50,000 บาท ต่อฤดูกาล"
      />

      {/* Reward summary */}
      <section className="py-8 md:py-10 lg:py-14">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: '1px solid var(--rule)' }}>
            <RewardCell tag="Rank 01 · Best Photo of Season" big="50,000" sub="THB Voucher" detail="ภาพคะแนนสูงสุดรวมทุกหมวด · ใช้แลกทริป GOGRAPHY ใดก็ได้ ภายใน 24 เดือน" />
            <RewardCell tag="Rank 02–03" big="15%" sub="Cashback" detail="ส่วนลดทริปครั้งถัดไป สะสมได้ทุกฤดูกาล" />
            <RewardCell tag="Rank 04–10" big="3–10%" sub="Cashback" detail="ส่วนลดตามลำดับ ระบบคำนวณอัตโนมัติ" />
          </div>
        </div>
      </section>

      {/* Rules at a glance */}
      <section className="py-6 md:py-8 lg:py-20 pb-12 md:pb-16 lg:pb-20">
        <div className="wrap">
          <div className="caps mb-5 md:mb-6" style={{ opacity: .55 }}>Rules at a glance</div>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ border: '1px solid var(--rule)' }}>
            <RuleCell num="1/day" lab="Upload" sub="วันละ 1 ภาพต่อบัญชี รวมทุกหมวด" />
            <RuleCell num="∞" lab="Vote" sub="โหวตภาพอื่นได้ไม่จำกัด ภาพละ 1 ครั้ง (toggle ได้)" />
            <RuleCell num="≤25 MB" lab="File size" sub="JPEG · PNG · WebP" />
            <RuleCell num="4 mo" lab="Season" sub="ภาพอยู่ในประกวดตลอดฤดูกาล" />
          </div>
        </div>
      </section>

      {/* The path — 4 step journey */}
      <section className="py-10 md:py-16 lg:py-20 rule-top rule-bot" style={{ background: 'var(--cream)' }}>
        <div className="wrap">
          <SectionHeader eyebrow="The path" title="The full path" />
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] lg:grid-cols-[180px_1fr] gap-x-8 md:gap-x-12 lg:gap-x-14 gap-y-4 md:gap-y-8 mt-6 md:mt-8">
            {[
              { n: '01', t: 'จบทริปกับ GOGRAPHY', b: 'ทริปไหนก็ได้ที่จัดโดย GOGRAPHY — ตั้งแต่ครึ่งวันถึง 14 วัน นับตั้งแต่ปี 2020 เป็นต้นมา', extra: 'ระบบดึงข้อมูลจาก booking records โดยอัตโนมัติ' },
              { n: '02', t: 'สร้างบัญชีด้วย Gmail', b: 'ใช้ Gmail เดียวกับที่จองทริป — Editorial teamจะเช็คและ mark สถานะ "Voyageur" ภายใน 7 วัน', cta: { label: 'Login with Gmail', to: '/login' } },
              { n: '03', t: 'อัพโหลดภาพ — วันละ 1 ภาพ', b: 'เลือกภาพที่ดีที่สุดจากทริป — อัพได้วันละ 1 ภาพต่อบัญชี (รวมทุกหมวด) เพื่อรักษาคุณภาพและลด spam ส่งสะสมได้ตลอดฤดูกาล (4 เดือน)', extra: 'JPEG/PNG/WebP · ขนาดสูงสุด 25MB · reset ทุก 00:00 น. ตามเวลาประเทศไทย' },
              { n: '04', t: 'ปลายฤดูกาล: ประกาศผล', b: 'ทีม Editorial คัดเลือกภาพยอดเยี่ยมในแต่ละหมวด — ผู้ชนะได้รับ voucher และ cashback ผ่านระบบโดยอัตโนมัติ', extra: 'ประกาศผลทุกวันที่ 1 ของเดือนถัดไป' },
            ].map(s => (
              <React.Fragment key={s.n}>
                <div className="mono text-[40px] md:text-[56px] lg:text-[64px] font-light leading-none pt-1" style={{ letterSpacing: '-.04em' }}>{s.n}</div>
                <div className="pb-8 md:pb-12" style={{ borderBottom: '1px solid var(--rule)' }}>
                  <h3 className="th text-[20px] md:text-[24px] lg:text-[28px] font-normal m-0" style={{ letterSpacing: '-.015em' }}>{s.t}</h3>
                  <p className="th text-[14px] md:text-[16px] mt-3 md:mt-4" style={{ lineHeight: 1.7, color: 'var(--fg-soft)', maxWidth: 560 }}>{s.b}</p>
                  {s.extra && <div className="mono mt-3 md:mt-4 text-[11px]" style={{ opacity: .55 }}>{s.extra}</div>}
                  {s.cta && <button onClick={() => router.push(s.cta.to)} className="btn btn-sm mt-5">{s.cta.label}</button>}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Verification — claim status */}
      <section id="verify" className="py-12 md:py-16 lg:py-24">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 lg:gap-20">
            <div>
              <SectionHeader eyebrow="Already a customer?" title="Verify your status" />
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--fg-soft)' }} className="th">
                ถ้าคุณเคยร่วมทริปกับเราแล้ว แต่ยังไม่เห็น Voyageur badge บนโปรไฟล์ — ใช้แบบฟอร์มนี้เพื่อให้Editorial teamตรวจสอบ
              </p>
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Gmail ที่ใช้จองทริป">
                  <input className="input" placeholder="your.name@gmail.com" defaultValue="pim.asanachinda@gmail.com" />
                </Field>
                <Field label="ทริปที่เคยร่วม">
                  <select className="input">
                    <option>GOGRAPHY Patagonia · January 2025</option>
                    <option>GOGRAPHY Iceland · November 2024</option>
                    <option>GOGRAPHY Atacama · September 2024</option>
                    <option>อื่นๆ — โปรดระบุในช่องด้านล่าง</option>
                  </select>
                </Field>
                <Field label="หมายเลขการจอง (ถ้าทราบ)">
                  <input className="input" placeholder="GG-2025-01-1043" />
                </Field>
                <Field label="ข้อความเพิ่มเติม (ไม่บังคับ)">
                  <textarea className="input" rows="3" placeholder="เช่น ชื่อหัวหน้าทริป หรือรายละเอียดเฉพาะของทริป"></textarea>
                </Field>
                <button className="btn btn-solid" style={{ marginTop: 12, justifyContent: 'center' }}>ส่งคำขอVerify your status</button>
                <p className="mono" style={{ fontSize: 11, opacity: .55, lineHeight: 1.7, textAlign: 'center', marginTop: 8 }}>
                  Editorial teamจะตอบกลับภายใน 7 วันทำการ
                </p>
              </div>
            </div>

            <div>
              <SectionHeader eyebrow="What you get" title="เมื่อได้รับการยืนยัน" />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  ['Voyageur badge', 'แสดงบนโปรไฟล์ — เป็น public proof ว่าคุณเคยร่วมทริป GOGRAPHY'],
                  ['สิทธิ์ส่งภาพในหมวด Voyageurs Awards', 'แข่งเฉพาะกับ Voyageur ด้วยกัน ไม่ต้องแข่งกับช่างภาพอาชีพ'],
                  ['Access to Voyageurs section', 'My photosจะปรากฏใน Voyageurs section บนหน้า Landing — เพิ่มโอกาสได้รับ exposure'],
                  ['Cashback tracking', 'ระบบนับคะแนนสะสมและคำนวณส่วนลดให้อัตโนมัติ'],
                  ['Early access ทริปใหม่', 'ลูกค้าเก่าได้รับสิทธิ์จองทริปใหม่ก่อนเปิดให้บุคคลทั่วไป 7 วัน'],
                ].map(([title, body], i) => (
                  <li key={i} style={{ display: 'flex', gap: 24, padding: '20px 0', borderBottom: '1px solid var(--rule)' }}>
                    <div className="mono" style={{ fontSize: 11, opacity: .55, paddingTop: 4, minWidth: 24 }}>{String(i+1).padStart(2,'0')}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--fg-soft)', margin: '8px 0 0' }} className="th">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 0', background: 'var(--cream)' }} className="rule-top rule-bot">
        <div className="wrap">
          <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
          <div style={{ maxWidth: 800 }}>
            {[
              ['ฉันต้องเป็นช่างภาพอาชีพไหม?', 'ไม่ต้องเลย — โครงการนี้สำหรับลูกค้าทุกคน ไม่ว่ามือใหม่หรือมือสมัครเล่น เกณฑ์การคัดเลือกเน้นที่ "เรื่องราว" และ "ความเป็นตัวเอง" ของภาพ ไม่ใช่ technical perfection'],
              ['ภาพต้องถ่ายจากทริป GOGRAPHY เท่านั้น?', 'แนะนำให้ส่งภาพจากทริป GOGRAPHY — แต่หากต้องการส่งภาพอื่นด้วย คุณยังคงเข้าร่วมหมวดทั่วไป (Landscape/Portrait/BW) ได้ เพียงไม่นับเข้า Voyageurs Awards'],
              ['อัพโหลดได้กี่ภาพต่อวัน?', 'วันละ 1 ภาพต่อบัญชี — เกณฑ์เดียวกับทุกคน (รวมหมวด Voyageurs Awards และหมวดทั่วไป) ระบบ reset เวลา 00:00 น. ทุกวัน'],
              ['โหวต (like) ภาพอื่นได้ไม่จำกัดใช่ไหม?', 'ใช่ — โหวตภาพได้ไม่จำกัดจำนวน เพียงภาพละ 1 ครั้ง (toggle ได้ตลอดเวลา) คะแนนของคุณช่วยภาพอื่นไต่อันดับใน Pulse Score'],
              ['Cashback ใช้ได้กับทริปไหนบ้าง?', 'ทริปใดก็ได้ที่จัดโดย GOGRAPHY — ระบุก่อนชำระเงิน Editorial teamจะหักส่วนลดให้อัตโนมัติ'],
              ['ถ้าฉันไม่เคยใช้ cashback จะหมดอายุไหม?', 'อายุ cashback คือ 24 เดือนนับจากวันประกาศผล — สะสมข้ามฤดูกาลได้สูงสุด 30% ต่อทริป'],
              ['ใครเป็นคนตัดสินว่าฉันชนะ?', 'ทีม Editorial ของ GOGRAPHY Photo Awards — เกณฑ์เปิดเผยที่หน้า Pulse Score (แต่ Voyageurs Awards เน้นเรื่องราวมากกว่าตัวเลข)'],
            ].map(([q, a], i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--rule)' }} open={i === 0}>
                <summary style={{ padding: '20px 0', fontSize: 17, fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} className="th">
                  <span>{q}</span>
                  <span className="mono" style={{ fontSize: 12, opacity: .55 }}>+</span>
                </summary>
                <p style={{ margin: 0, padding: '0 0 20px 0', fontSize: 15, color: 'var(--fg-soft)', lineHeight: 1.7, maxWidth: 720 }} className="th">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '96px 0' }}>
        <div className="wrap-narrow" style={{ textAlign: 'center' }}>
          <h2 className="th" style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1.15 }}>
            Ready to send your first photo?
          </h2>
          <p className="th" style={{ marginTop: 20, fontSize: 16, color: 'var(--fg-soft)', lineHeight: 1.7 }}>
            ฤดูกาลปัจจุบัน <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Spring 2026</strong> เปิดรับภาพถึง 30 เมษายน 2569
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32 }}>
            <button className="btn btn-solid" onClick={() => router.push('/login')}>เริ่มต้น — Login with Gmail</button>
            <Link href="/explore" className="btn">ดูภาพในประกวดก่อน</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function RewardCell({ tag, big, sub, detail }) {
  return (
    <div style={{ padding: '40px 32px', borderRight: '1px solid var(--rule)' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginBottom: 32 }}>{tag}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-.03em', lineHeight: 1 }}>{big}</span>
        <span className="caps" style={{ opacity: .65 }}>{sub}</span>
      </div>
      <p className="th" style={{ marginTop: 20, fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.7 }}>{detail}</p>
    </div>
  );
}

function RuleCell({ num, lab, sub }) {
  return (
    <div style={{ padding: '28px 24px', borderRight: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-.025em', lineHeight: 1, fontFamily: 'var(--mono)' }}>{num}</span>
        <span className="caps" style={{ opacity: .55 }}>{lab}</span>
      </div>
      <p className="th" style={{ marginTop: 14, fontSize: 12, color: 'var(--fg-soft)', lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>{label}</div>
      {children}
    </label>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageForCustomers />; }
