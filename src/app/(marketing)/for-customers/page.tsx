// For Customers — dedicated onboarding & program detail page

import { Fragment } from 'react';
import Link from 'next/link';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import { LoginButton } from './_components';

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-[48px]">
      {eyebrow && <div className="caps mb-[16px] opacity-55">{eyebrow}</div>}
      <h2 className="th text-[36px] font-normal tracking-[-0.02em] m-0 leading-[1.15]">{title}</h2>
    </div>
  );
}

function RewardCell({
  tag,
  big,
  sub,
  detail,
}: {
  tag: string;
  big: string;
  sub: string;
  detail: string;
}) {
  return (
    <div className="p-[40px_32px] border-r border-[var(--rule)]">
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55 mb-[32px]">{tag}</div>
      <div className="flex items-baseline gap-[12px]">
        <span className="text-[56px] font-medium tracking-[-0.03em] leading-[1]">{big}</span>
        <span className="caps opacity-65">{sub}</span>
      </div>
      <p className="th mt-[20px] text-[13px] text-[var(--fg-soft)] leading-[1.7]">{detail}</p>
    </div>
  );
}

function RuleCell({ num, lab, sub }: { num: string; lab: string; sub: string }) {
  return (
    <div className="p-[28px_24px] border-r border-[var(--rule)]">
      <div className="flex items-baseline gap-[10px]">
        <span className="text-[36px] font-medium tracking-[-0.025em] leading-[1] font-[var(--mono)]">
          {num}
        </span>
        <span className="caps opacity-55">{lab}</span>
      </div>
      <p className="th mt-[14px] text-[12px] text-[var(--fg-soft)] leading-[1.6]">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="caps opacity-55 mb-[8px]">{label}</div>
      {children}
    </label>
  );
}

// ─── path steps ──────────────────────────────────────────────────────────────

const PATH_STEPS = [
  {
    n: '01',
    t: 'จบทริปกับ GOGRAPHY',
    b: 'ทริปไหนก็ได้ที่จัดโดย GOGRAPHY — ตั้งแต่ครึ่งวันถึง 14 วัน นับตั้งแต่ปี 2020 เป็นต้นมา',
    extra: 'ระบบดึงข้อมูลจาก booking records โดยอัตโนมัติ',
    cta: null as null | { label: string; to: string },
  },
  {
    n: '02',
    t: 'สร้างบัญชีด้วย Gmail',
    b: 'ใช้ Gmail เดียวกับที่จองทริป — Editorial teamจะเช็คและ mark สถานะ "Traveller" ภายใน 7 วัน',
    extra: null as null | string,
    cta: { label: 'Login with Gmail', to: '/login' },
  },
  {
    n: '03',
    t: 'อัพโหลดภาพ — วันละ 1 ภาพ',
    b: 'เลือกภาพที่ดีที่สุดจากทริป — อัพได้วันละ 1 ภาพต่อบัญชี (รวมทุกหมวด) เพื่อรักษาคุณภาพและลด spam ส่งสะสมได้ตลอดฤดูกาล (4 เดือน)',
    extra: 'JPEG/PNG/WebP · ขนาดสูงสุด 25MB · reset ทุก 00:00 น. ตามเวลาประเทศไทย',
    cta: null as null | { label: string; to: string },
  },
  {
    n: '04',
    t: 'ปลายฤดูกาล: ประกาศผล',
    b: 'ทีม Editorial คัดเลือกภาพยอดเยี่ยมในแต่ละหมวด — ผู้ชนะได้รับ voucher และ cashback ผ่านระบบโดยอัตโนมัติ',
    extra: 'ประกาศผลทุกวันที่ 1 ของเดือนถัดไป',
    cta: null as null | { label: string; to: string },
  },
] as const;

// ─── page ────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className="page-fade">
      <PageCover
        photoId="p015"
        eyebrow="For Travellers"
        title={<>Your trip photos<br />are worth more</>}
        subtitle="ลูกค้า GOGRAPHY ทุกคนได้สถานะ Traveller — Submit ภาพในหมวดพิเศษ Travellers Awards — แข่งกันเฉพาะลูกค้าด้วยกัน รางวัลสูงสุด 50,000 บาท ต่อฤดูกาล"
      />

      {/* Reward summary */}
      <section className="pt-[40px] pb-[56px]">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--rule)]">
            <RewardCell
              tag="Rank 01 · ต่อหมวด"
              big="50,000"
              sub="THB Voucher"
              detail="ใช้แลกทริป GOGRAPHY ใดก็ได้ ภายใน 24 เดือน"
            />
            <RewardCell
              tag="Rank 02–03"
              big="15%"
              sub="Cashback"
              detail="ส่วนลดทริปครั้งถัดไป สะสมได้ทุกฤดูกาล"
            />
            <RewardCell
              tag="Rank 04–10"
              big="3–10%"
              sub="Cashback"
              detail="ส่วนลดตามลำดับ ระบบคำนวณอัตโนมัติ"
            />
          </div>
        </div>
      </section>

      {/* Rules at a glance */}
      <section className="pt-[24px] pb-[80px]">
        <div className="wrap">
          <div className="caps opacity-55 mb-[24px]">Rules at a glance</div>
          <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--rule)]">
            <RuleCell num="1/day" lab="Upload" sub="วันละ 1 ภาพต่อบัญชี รวมทุกหมวด" />
            <RuleCell
              num="∞"
              lab="Vote"
              sub="โหวตภาพอื่นได้ไม่จำกัด ภาพละ 1 ครั้ง (toggle ได้)"
            />
            <RuleCell num="≤25 MB" lab="File size" sub="JPEG · PNG · WebP" />
            <RuleCell num="4 mo" lab="Season" sub="ภาพอยู่ในประกวดตลอดฤดูกาล" />
          </div>
        </div>
      </section>

      {/* The path — 4 step journey */}
      <section className="py-[80px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap">
          <SectionHeader eyebrow="The path" title="The full path" />
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] lg:grid-cols-[180px_1fr] gap-8 md:gap-10 lg:gap-[56px] mt-6 md:mt-[32px]">
            {PATH_STEPS.map((s) => (
              <Fragment key={s.n}>
                <div
                  className="mono text-[64px] font-light tracking-[-0.04em] leading-[1] pt-[4px]"
                >
                  {s.n}
                </div>
                <div
                  className="pb-[48px] border-b border-[var(--rule)]"
                >
                  <h3 className="th text-[28px] font-normal tracking-[-0.015em] m-0">{s.t}</h3>
                  <p className="th text-[16px] leading-[1.7] text-[var(--fg-soft)] mt-[16px] max-w-[560px]">
                    {s.b}
                  </p>
                  {s.extra && (
                    <div className="mono mt-[16px] text-[11px] opacity-55">{s.extra}</div>
                  )}
                  {s.cta && (
                    <LoginButton
                      label={s.cta.label}
                      to={s.cta.to}
                      className="btn btn-sm mt-[20px]"
                    />
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-[80px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap">
          <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
          <div className="max-w-[800px]">
            {(
              [
                [
                  'ฉันต้องเป็นช่างภาพอาชีพไหม?',
                  'ไม่ต้องเลย — โครงการนี้สำหรับลูกค้าทุกคน ไม่ว่ามือใหม่หรือมือสมัครเล่น เกณฑ์การคัดเลือกเน้นที่ "เรื่องราว" และ "ความเป็นตัวเอง" ของภาพ ไม่ใช่ technical perfection',
                ],
                [
                  'ภาพต้องถ่ายจากทริป GOGRAPHY เท่านั้น?',
                  'แนะนำให้ส่งภาพจากทริป GOGRAPHY — แต่หากต้องการส่งภาพอื่นด้วย คุณยังคงเข้าร่วมหมวดทั่วไป (Landscape/Portrait/BW) ได้ เพียงไม่นับเข้า Travellers Awards',
                ],
                [
                  'อัพโหลดได้กี่ภาพต่อวัน?',
                  'วันละ 1 ภาพต่อบัญชี — เกณฑ์เดียวกับทุกคน (รวมหมวด Travellers Awards และหมวดทั่วไป) ระบบ reset เวลา 00:00 น. ทุกวัน',
                ],
                [
                  'โหวต (like) ภาพอื่นได้ไม่จำกัดใช่ไหม?',
                  'ใช่ — โหวตภาพได้ไม่จำกัดจำนวน เพียงภาพละ 1 ครั้ง (toggle ได้ตลอดเวลา) คะแนนของคุณช่วยภาพอื่นไต่อันดับใน Pulse Score',
                ],
                [
                  'Cashback ใช้ได้กับทริปไหนบ้าง?',
                  'ทริปใดก็ได้ที่จัดโดย GOGRAPHY — ระบุก่อนชำระเงิน Editorial teamจะหักส่วนลดให้อัตโนมัติ',
                ],
                [
                  'ถ้าฉันไม่เคยใช้ cashback จะหมดอายุไหม?',
                  'อายุ cashback คือ 24 เดือนนับจากวันประกาศผล — สะสมข้ามฤดูกาลได้สูงสุด 30% ต่อทริป',
                ],
                [
                  'ใครเป็นคนตัดสินว่าฉันชนะ?',
                  'ทีม Editorial ของ GOGRAPHY Ranking — เกณฑ์เปิดเผยที่หน้า Pulse Score (แต่ Travellers Awards เน้นเรื่องราวมากกว่าตัวเลข)',
                ],
              ] as [string, string][]
            ).map(([q, a], i) => (
              <details
                key={i}
                className="border-b border-[var(--rule)]"
                open={i === 0}
              >
                <summary
                  className="th py-[20px] text-[17px] font-medium cursor-pointer flex justify-between"
                >
                  <span>{q}</span>
                  <span className="mono text-[12px] opacity-55">+</span>
                </summary>
                <p
                  className="th m-0 pb-[20px] text-[15px] text-[var(--fg-soft)] leading-[1.7] max-w-[720px]"
                >
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-[96px]">
        <div className="wrap-narrow text-center">
          <h2 className="th text-[48px] font-normal tracking-[-0.025em] m-0 leading-[1.15]">
            Ready to send your first photo?
          </h2>
          <p className="th mt-[20px] text-[16px] text-[var(--fg-soft)] leading-[1.7]">
            ฤดูกาลปัจจุบัน{' '}
            <strong className="text-[var(--fg)] font-medium">Spring 2026</strong>{' '}
            เปิดรับภาพถึง 30 เมษายน 2569
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-[16px] mt-[32px]">
            <LoginButton
              label="เริ่มต้น — Login with Gmail"
              to="/login"
              className="btn btn-solid"
            />
            <Link href="/explore" className="btn">
              ดูภาพในประกวดก่อน
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
