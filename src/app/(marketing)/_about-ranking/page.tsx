// About Ranking — explains Pulse Score formula. Transparency is the differentiator.

import Link from 'next/link';
import { getPhotos, getPhotographer } from '@/lib/data';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import type { PickKind } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-[48px]">
      {eyebrow && (
        <div className="caps mb-[16px] opacity-55">{eyebrow}</div>
      )}
      <h2 className="th text-[36px] font-normal tracking-[-0.02em] m-0 leading-[1.15]">{title}</h2>
    </div>
  );
}

function ExampleRow({
  label,
  expr,
  val,
  bold,
}: {
  label: string;
  expr: string;
  val: number;
  bold?: boolean;
}) {
  return (
    <tr className="border-b border-[var(--rule)]">
      <td className="py-[14px] text-[12px] opacity-65 w-[40%]">{label}</td>
      <td className="py-[14px] text-[12px] opacity-55 w-[35%]">{expr}</td>
      <td
        className={`py-[14px] text-[16px] text-right${bold ? ' font-semibold' : ' font-normal'}`}
      >
        {typeof val === 'number' ? val.toLocaleString() : val}
      </td>
    </tr>
  );
}

function Principle({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55 mb-[16px]">{n}</div>
      <h3 className="th text-[26px] font-normal tracking-[-0.015em] m-0">{title}</h3>
      <p className="th text-[14px] leading-[1.7] text-[var(--fg-soft)] mt-[16px]">{body}</p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function Page() {
  const allPhotos = getPhotos();
  // allPhotos is always non-empty (seeded data), non-null assertion is safe
  const sample = allPhotos[0]!;
  const photographer = getPhotographer(sample.by);

  const curationBonus = (picks: PickKind[]): number => {
    if (picks.includes('editor') && picks.includes('ambassador')) return 100;
    if (picks.length === 1) return 50;
    return 0;
  };
  const bonus = curationBonus(sample.picks);
  const subtotal = sample.likes + sample.likes24h * 3 + bonus;

  const curationExpr =
    sample.picks.length === 2
      ? 'Both picks · +100'
      : sample.picks.length === 1
        ? `${sample.picks[0]}'s pick · +50`
        : 'No pick · +0';

  return (
    <div className="page-fade">
      <PageCover
        photoId="p001"
        eyebrow="Pulse Score"
        title={<>How the ranking<br />is calculated</>}
        subtitle="ทุก user ควรเข้าใจว่าทำไมภาพหนึ่งจัดอันดับสูงกว่าอีกภาพ — Pulse score คือทั้งหมดที่เราใช้ ไม่มี algorithm ดำมืด"
      />

      {/* The formula */}
      <section className="pt-[40px] pb-[96px]">
        <div className="wrap">
          <div
            className="bg-[var(--cream)] p-6 md:p-10 lg:p-[64px_56px] border border-[var(--rule)] overflow-hidden"
          >
            <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55 mb-[32px]">
              The Pulse Score formula
            </div>
            <div className="overflow-x-auto no-scrollbar pb-4">
              <pre
                className="mono text-[14px] md:text-[clamp(18px,2.2vw,28px)] leading-[1.7] m-0 font-medium tracking-[-0.005em]"
              >
{`pulse  =  (likes × 1  +  likes_24h × 3  +  curation_bonus)
          ─────────────────────────────────────────────────
                       max(hours_since_upload, 1)`}
              </pre>
            </div>
            <div className="mt-8 md:mt-[48px] pt-6 md:pt-[32px] border-t border-[var(--rule)]">
              <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55 mb-[20px]">
                Curation bonus values
              </div>
              <table className="w-full border-collapse font-[var(--mono)] text-[14px]">
                <tbody>
                  <tr className="border-b border-[var(--rule)]">
                    <td className="py-[14px] w-[50%]">No pick</td>
                    <td className="py-[14px] text-right">+0</td>
                  </tr>
                  <tr className="border-b border-[var(--rule)]">
                    <td className="py-[14px]">
                      Editor&apos;s pick <em className="opacity-55 not-italic">OR</em>{' '}
                      Ambassador&apos;s pick
                    </td>
                    <td className="py-[14px] text-right">+50</td>
                  </tr>
                  <tr>
                    <td className="py-[14px] font-semibold">Both Editor &amp; Ambassador picks</td>
                    <td className="py-[14px] text-right font-semibold">+100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Worked example */}
      <section className="pt-[40px] pb-[96px]">
        <div className="wrap">
          <SectionHeader eyebrow="Worked example" title="Worked example from current #1" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-[64px] items-start">
            <div>
              <div className="aspect-[4/5] bg-[var(--tile)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sample.src}
                  alt={sample.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-[20px] flex justify-between items-baseline">
                <div>
                  <div className="text-[18px] font-medium">{sample.title}</div>
                  <div className="pby mt-[4px]">{photographer?.name}</div>
                </div>
                <div className="mono text-[11px] opacity-55">#001</div>
              </div>
            </div>
            <div>
              <table className="w-full border-collapse font-[var(--mono)]">
                <tbody>
                  <ExampleRow
                    label="Total likes"
                    expr={`${sample.likes.toLocaleString()} × 1`}
                    val={sample.likes}
                  />
                  <ExampleRow
                    label="Likes in last 24h"
                    expr={`${sample.likes24h} × 3`}
                    val={sample.likes24h * 3}
                  />
                  <ExampleRow label="Curation bonus" expr={curationExpr} val={bonus} />
                  <ExampleRow label="Subtotal" expr="sum" val={subtotal} bold />
                  <ExampleRow label="Hours since upload" expr="÷" val={sample.hours} />
                  <tr className="border-t-2 border-[var(--fg)]">
                    <td className="py-[20px] text-[14px]">Pulse Score</td>
                    <td className="py-[20px]" />
                    <td className="py-[20px] text-right text-[36px] font-medium tracking-[-0.02em]">
                      {sample.pulse.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="th mt-[32px] text-[14px] text-[var(--fg-soft)] leading-[1.7]">
                คะแนนนี้ refresh ทุก ๆ 15 นาที — และตัวหาร{' '}
                <code className="mono">hours_since_upload</code>{' '}
                ทำให้ภาพใหม่มีโอกาสไต่อันดับเร็ว ขณะเดียวกันภาพคุณภาพที่อยู่นานก็ยังรักษาอันดับได้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-[80px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap">
          <SectionHeader title="Principles" eyebrow="Why we built it this way" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-[56px]">
            <Principle
              n="01"
              title="โปร่งใส"
              body="ทุกตัวเลขใน formula เปิดให้ผู้ใช้ตรวจสอบได้ — ไม่มี black-box ranking"
            />
            <Principle
              n="02"
              title="สดใหม่"
              body="hours_since_upload เป็นตัวหาร ทำให้ภาพใหม่ที่ได้รับความสนใจไต่อันดับได้เร็ว"
            />
            <Principle
              n="03"
              title="ไม่ใช่ popularity contest"
              body="curation bonus จาก editor และ ambassador ทำให้ภาพคุณภาพที่อาจไม่ viral ได้รับการมองเห็น"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-[96px]">
        <div className="wrap">
          <SectionHeader title="Frequently asked questions" eyebrow="FAQ" />
          <div className="max-w-[760px]">
            {(
              [
                [
                  '1 บัญชี Gmail โหวตได้กี่ภาพ?',
                  'ภาพละ 1 ครั้ง — แต่จำนวนภาพที่คุณโหวตได้ "ไม่จำกัด" และ toggle เปิด/ปิดได้ตลอดเวลา ถ้ายกเลิก คะแนนของภาพนั้นจะลดลงทันที',
                ],
                [
                  'อัพโหลดได้กี่ภาพต่อวัน?',
                  'วันละ 1 ภาพต่อบัญชี — ทั้งหมวดทั่วไปและ Voyageurs Awards รวมกัน เพื่อรักษาคุณภาพและลด spam ระบบจะ reset เวลา 00:00 น. ตามเวลาประเทศไทย',
                ],
                [
                  'Pulse score เปลี่ยนแปลงบ่อยแค่ไหน?',
                  'คำนวณใหม่ทุก 15 นาที — ดังนั้นอันดับขยับได้ตลอดเวลา',
                ],
                [
                  "Editor's Pick เลือกอย่างไร?",
                  "Editorial team GOGRAPHY คัดเลือกจากภาพที่มี composition และเล่าเรื่องโดดเด่น — ไม่ขึ้นกับจำนวน like",
                ],
                [
                  'ถ้าภาพถูกซ่อน จะยังนับใน Pulse?',
                  'ไม่ — ภาพที่ถูกซ่อนโดย admin จะไม่ปรากฏใน leaderboard',
                ],
              ] as [string, string][]
            ).map(([q, a], i) => (
              <details
                key={i}
                className="border-b border-[var(--rule)]"
                open={i === 0}
              >
                <summary
                  className="th py-[24px] text-[17px] font-medium cursor-pointer flex justify-between"
                >
                  <span>{q}</span>
                  <span className="mono text-[12px] opacity-55">+</span>
                </summary>
                <p className="th m-0 pb-[24px] text-[15px] text-[var(--fg-soft)] leading-[1.7]">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
