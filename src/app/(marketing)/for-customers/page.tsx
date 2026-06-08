// For Customers — dedicated onboarding & program detail page

import { Fragment } from 'react';
import Link from 'next/link';
import { getPhoto } from '@/lib/data';
import { Footer } from '@/components/layout/Footer';
import { VoyageurMark, RewardIcon } from '@/components/icons';
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

function RewardBadge({
  icon,
  label,
  sub,
}: {
  icon: 'voucher' | 'cashback' | 'star';
  label: string;
  sub: string;
}) {
  return (
    <div className="flex gap-[10px] items-start px-[14px] py-[10px] border border-[var(--rule)] min-w-[170px]">
      <div className="pt-[2px]">
        <RewardIcon kind={icon} size={20} />
      </div>
      <div className="text-left">
        <div className="mono text-[14px] font-medium leading-[1.1] tracking-[-.01em]">{label}</div>
        <div className="caps opacity-55 text-[9.5px] mt-1">{sub}</div>
      </div>
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
      <p className="th mt-[20px] text-[14px] text-[var(--fg-soft)] leading-[1.7]">{detail}</p>
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
      <p className="th mt-[14px] text-[14px] text-[var(--fg-soft)] leading-[1.6]">{sub}</p>
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
    b: 'ลูกค้าที่เดินทางกับ GOGRAPHY ตั้งแต่ปี 2024 เป็นต้นมา ได้สิทธิ์เข้าหมวด Traveller โดยอัตโนมัติ',
    extra: 'ระบบดึงข้อมูลจาก booking records โดยอัตโนมัติ',
    cta: null as null | { label: string; to: string },
    prizes: null as null | { rank: string; reward: string }[],
  },
  {
    n: '02',
    t: 'Login with Gmail',
    b: 'ล็อกอินด้วย Gmail เดียวกับที่กรอกในแบบฟอร์มตอนซื้อทริป — ระบบจะ mark สถานะ "Traveller" ให้อัตโนมัติ',
    extra: null as null | string,
    cta: { label: 'Login with Gmail', to: '/login' },
    prizes: null as null | { rank: string; reward: string }[],
  },
  {
    n: '03',
    t: 'อัพโหลดภาพ — วันละ 1 ภาพ',
    b: 'อัพได้ 1 ภาพต่อบัญชีต่อวัน ลงได้ทั้งหมวด Classic (เปิดให้ทุกคน) และหมวด Traveller (เฉพาะลูกค้า Gography)',
    extra: 'JPEG/PNG/WebP · ขนาดสูงสุด 5MB · ทุกภาพเปิดรับโหวต 24 ชั่วโมงเท่ากัน',
    cta: null as null | { label: string; to: string },
    prizes: null as null | { rank: string; reward: string }[],
  },
  {
    n: '04',
    t: 'ปลายฤดูกาล: ประกาศผล',
    b: '1 season = 4 เดือน · ประกาศผลในวันเริ่มต้นฤดูกาลใหม่ — นับคะแนนรวมจากภาพทั้ง season ผู้ได้คะแนนสูงสุดอันดับ 1–3 รับรางวัล Cashback',
    extra: 'ใช้ได้กับทริปใดก็ได้ · เงื่อนไขเป็นไปตามที่บริษัทกำหนด',
    cta: null as null | { label: string; to: string },
    prizes: [
      { rank: 'รางวัลที่ 1', reward: 'Cashback 50,000 บาท' },
      { rank: 'รางวัลที่ 2', reward: 'ส่วนลด 20% ของราคาทริป' },
      { rank: 'รางวัลที่ 3', reward: 'ส่วนลด 10% ของราคาทริป' },
    ] as { rank: string; reward: string }[],
  },
] as const;

// ─── page ────────────────────────────────────────────────────────────────────

export default function Page() {
  const coverSrc = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2621&auto=format&fit=crop";

  return (
    <div className="page-fade">
      {/* ── Cinematic Hero Header ── */}
      <section className="relative overflow-hidden bg-black h-[42vh] min-h-[340px] max-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt="For Travellers"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.32)_0%,rgba(0,0,0,.06)_38%,rgba(0,0,0,.74)_100%)]" />

        {/* content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="wrap pb-10 md:pb-16">
            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/75">For Travellers</span>
              <span className="h-px w-10 bg-white/30" />
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/55 tabular-nums">The Programme</span>
            </div>
            {/* title */}
            <h1 className="text-white font-light text-[clamp(48px,9vw,104px)] leading-[.9] tracking-[-.04em] m-0">
              Your trip photos<br />are worth more
            </h1>
            <p className="th text-white/75 text-[15px] leading-[1.6] mt-5 mb-0 max-w-[560px]">
              ลูกค้า GOGRAPHY ทุกคนได้สถานะ Traveller — Submit ภาพในหมวดพิเศษ Travellers Awards — แข่งกันเฉพาะลูกค้าด้วยกัน รางวัลสูงสุด 50,000 บาท ต่อฤดูกาล
            </p>
          </div>
        </div>
      </section>

      {/* Programme hero — Become a Traveller */}
      <section className="pt-[64px] pb-[72px] bg-[var(--cream)] rule-bot">
        <div className="wrap">
          <div className="flex justify-between items-baseline pb-8 border-b border-[var(--rule)] mb-12 md:mb-14">
            <div className="caps opacity-55 flex items-center gap-2">
              <VoyageurMark size={9} /> The Travellers Programme
            </div>
            <div className="mono text-[11px] opacity-55">EXCLUSIVE · TRAVELLERS ONLY</div>
          </div>

          <div className="grid items-center grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-20">
            {/* Left: copy */}
            <div>
              <h2 className="font-normal m-0 leading-[1.05] text-[clamp(36px,4.6vw,64px)] tracking-[-.025em] mb-7">
                Travelled with us?<br />Become a Traveller
              </h2>
              <p className="th text-[17px] leading-[1.65] text-[var(--fg-soft)] max-w-[520px] mb-8">
                ลูกค้า GOGRAPHY ทุกคนได้สถานะ Traveller — มีหมวดประกวดเฉพาะกลุ่ม แข่งกันเองเฉพาะคนที่เคยร่วมเดินทางกับเรา
                ปลายฤดูกาลภาพอันดับ 1–3 รับรางวัล — อันดับ 1 Cashback 50,000 บาท, อันดับ 2–3 รับส่วนลดทริปถัดไป
              </p>

              <div className="flex gap-4 mb-12 flex-wrap">
                <RewardBadge icon="voucher" label="50,000 THB" sub="CASHBACK · RANK 1" />
                <RewardBadge icon="cashback" label="10–20%" sub="ส่วนลดทริป · RANK 2–3" />
                <RewardBadge icon="star" label="Traveller" sub="PUBLIC BADGE · LIFETIME" />
              </div>

              <div className="flex gap-3 flex-wrap">
                <LoginButton label="เริ่มต้น — Login with Gmail" to="/login" className="btn btn-solid" />
                <Link href="/hall-of-fame" className="btn">Past winners</Link>
              </div>
            </div>

            {/* Right: featured photo */}
            <div className="relative">
              <div className="pimg overflow-hidden aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPhoto('p015')?.src ?? ''}
                  alt="Traveller featured"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-4 left-4 bg-[var(--bg)] px-[10px] py-[6px] flex items-center gap-[6px]">
                <VoyageurMark size={8} />
                <div className="caps text-[9px]">Traveller Pick</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reward summary */}
      <section className="pt-[40px] pb-[56px]">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--rule)]">
            <RewardCell
              tag="Rank 01"
              big="50,000"
              sub="THB Cashback"
              detail="ใช้ได้กับทริป GOGRAPHY ใดก็ได้ · เงื่อนไขเป็นไปตามที่บริษัทกำหนด"
            />
            <RewardCell
              tag="Rank 02"
              big="20%"
              sub="ส่วนลด"
              detail="ส่วนลดราคาทริปครั้งถัดไป"
            />
            <RewardCell
              tag="Rank 03"
              big="10%"
              sub="ส่วนลด"
              detail="ส่วนลดราคาทริปครั้งถัดไป"
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
              sub="โหวตให้ภาพอื่นได้ไม่จำกัด · 1 ภาพโหวตได้ครั้งเดียว กดถอนโหวตได้ตลอด"
            />
            <RuleCell num="≤5 MB" lab="File size" sub="JPEG · PNG · WebP" />
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
                  {s.prizes && (
                    <div className="mt-[24px] border border-[var(--rule)] divide-y divide-[var(--rule)] max-w-[440px]">
                      {s.prizes.map((p) => (
                        <div key={p.rank} className="flex justify-between items-baseline px-[18px] py-[14px]">
                          <span className="caps opacity-55">{p.rank}</span>
                          <span className="th text-[15px] font-medium">{p.reward}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
            <strong className="text-[var(--fg)] font-medium">Season 01</strong>{' '}
            เปิดรับภาพถึง 8 ตุลาคม 2569
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
