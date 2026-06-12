import Link from 'next/link';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import { SCORING_RULES, UPLOAD_RULES, TRAVELLER_RULES, getSeasonInfo } from '@/content/rules';

// Real badge tiers from PulseStatusBadge's LABEL map — keep in sync.
const BADGE_TIERS = [
  { name: 'Rising', desc: 'ภาพที่เริ่มได้รับการตอบรับจากชุมชนอย่างต่อเนื่อง' },
  { name: 'Trending', desc: 'ภาพที่กำลังได้รับโมเมนตัมสูงในช่วงเปิดรับโหวต' },
  { name: 'Hidden Gem', desc: 'ภาพคุณภาพสูงที่ยังมีผู้ชมไม่มาก — ระบบช่วยดันให้ถูกมองเห็น' },
  { name: 'Popular', desc: 'ภาพที่ขึ้นถึงกลุ่มคะแนนสูงสุดของสนาม' },
  { name: 'Top of the Field', desc: 'ภาพระดับแถวหน้าของฤดูกาล' },
  { name: "Editors' Choice", desc: 'ภาพที่ได้รับการคัดเลือกเชิงคุณภาพจากทีมหรือ Ambassador — มีผลต่อ badge และการมองเห็นเท่านั้น ไม่บวกคะแนน' },
] as const;

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-[28px]">
      <span className="mono text-[12px] tracking-[.18em] opacity-45">{num}</span>
      <span className="caps opacity-55">{label}</span>
    </div>
  );
}

export default function HowRankingWorksPage() {
  const season = getSeasonInfo();

  return (
    <div className="page-fade">
      <PageCover
        eyebrow="How Ranking Works"
        title={<>คะแนนมาจากไหน<br />และทำไมถึงแฟร์</>}
        subtitle={`${SCORING_RULES.name} — ${SCORING_RULES.summary}`}
      />

      {/* 01 — what counts */}
      <section className="pt-[80px] pb-[64px]">
        <div className="wrap-narrow">
          <SectionLabel num="01" label="ส่วนที่นับ" />
          <h2 className="th text-[clamp(26px,3.4vw,40px)] font-normal tracking-[-0.02em] leading-[1.2] m-0 mb-[32px]">
            อะไรถูกนับเข้า {SCORING_RULES.name}
          </h2>
          <div className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {SCORING_RULES.inputs.map((input, i) => (
              <div key={input} className="flex gap-6 py-[22px] items-baseline">
                <span className="mono text-[12px] opacity-45 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <p className="th text-[16px] leading-[1.8] text-fg-soft m-0">{input}</p>
              </div>
            ))}
          </div>
          <p className="th text-[15px] leading-[1.85] text-fg-soft opacity-70 mt-[24px] m-0">
            น้ำหนักของแต่ละโหวตถูกบันทึก ณ เวลาที่โหวต — ไม่มีการลดทอนคะแนนย้อนหลังตามเวลา
            และไม่มีโบนัสคะแนนจากทีมงาน
          </p>
        </div>
      </section>

      {/* 02 — why it's fair */}
      <section className="py-[64px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap-narrow">
          <SectionLabel num="02" label="ทำไมถึงแฟร์" />
          <h2 className="th text-[clamp(26px,3.4vw,40px)] font-normal tracking-[-0.02em] leading-[1.2] m-0 mb-[32px]">
            สามชั้นที่ทำให้ปั่นโหวตไม่ได้
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 border border-[var(--rule)] divide-y md:divide-y-0 md:divide-x divide-[var(--rule)]">
            <div className="p-[28px_24px]">
              <div className="caps opacity-55 mb-[14px]">Trust weighting</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">
                โหวตถูกถ่วงน้ำหนักตามความน่าเชื่อถือของผู้โหวต — โหวตจาก Ambassador และ Traveller
                มีน้ำหนักมากกว่าผู้ชมทั่วไป การสร้างบัญชีจำนวนมากจึงแทบไม่มีผลต่อคะแนน
              </p>
            </div>
            <div className="p-[28px_24px]">
              <div className="caps opacity-55 mb-[14px]">Percentile ranking</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">
                คะแนนสุดท้ายเป็นการจัดอันดับแบบ percentile เทียบกับภาพอื่นในสนามเดียวกัน
                — ทุกภาพแข่งบนสเกลเดียวกัน ไม่ใช่ยอดไลก์ดิบ
              </p>
            </div>
            <div className="p-[28px_24px]">
              <div className="caps opacity-55 mb-[14px]">Anti-gaming</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">
                ระบบตรวจจับการปั่นโหวต บอท และพฤติกรรมผิดปกติ — บัญชีที่พบการโกงจะถูกริบรางวัลหรือระงับ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — layered transparency */}
      <section className="py-[64px]">
        <div className="wrap-narrow">
          <SectionLabel num="03" label="ความโปร่งใสแบบมีชั้น" />
          <h2 className="th text-[clamp(26px,3.4vw,40px)] font-normal tracking-[-0.02em] leading-[1.2] m-0 mb-[24px]">
            เปิดเผยว่าอะไรถูกนับ — ไม่เปิดเผยค่าน้ำหนัก
          </h2>
          <p className="th text-[16px] leading-[1.85] text-fg-soft m-0 max-w-[640px]">
            {SCORING_RULES.transparency} แนวทางนี้คือมาตรฐานเดียวกับระบบจัดอันดับที่จริงจังทั่วโลก
            — ถ้าสูตรน้ำหนักถูกเปิดเผยทั้งหมด คนที่ตั้งใจโกงจะออกแบบการปั่นคะแนนได้ทันที
            ความแฟร์ของทุกคนจึงสำคัญกว่าความอยากรู้สูตร
          </p>
        </div>
      </section>

      {/* 04 — Ambassador's Pick */}
      <section className="py-[64px] rule-top">
        <div className="wrap-narrow">
          <SectionLabel num="04" label="Ambassador's Pick" />
          <h2 className="th text-[clamp(26px,3.4vw,40px)] font-normal tracking-[-0.02em] leading-[1.2] m-0 mb-[24px]">
            การคัดเลือกเชิงคุณภาพ — ไม่ใช่คะแนน
          </h2>
          <p className="th text-[16px] leading-[1.85] text-fg-soft m-0 max-w-[640px]">
            Ambassador&apos;s Pick คือการคัดเลือกโดยสายตาของช่างภาพระดับ Ambassador
            ภาพที่ถูกเลือกจะได้ badge และการมองเห็นที่มากขึ้น —
            แต่ไม่มีการบวกคะแนนเข้า {SCORING_RULES.name} แม้แต่แต้มเดียว
            การจัดอันดับยังเป็นของชุมชนเสมอ
          </p>
        </div>
      </section>

      {/* 05 — badge tiers */}
      <section className="py-[64px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap-narrow">
          <SectionLabel num="05" label="Badge tiers" />
          <h2 className="th text-[clamp(26px,3.4vw,40px)] font-normal tracking-[-0.02em] leading-[1.2] m-0 mb-[32px]">
            ระดับ badge ที่มีจริงในระบบ
          </h2>
          <div className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {BADGE_TIERS.map((tier) => (
              <div key={tier.name} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-8 py-[20px]">
                <span className="mono uppercase text-[11px] tracking-[.16em] pt-[4px]">{tier.name}</span>
                <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — the rules */}
      <section className="py-[64px]">
        <div className="wrap-narrow">
          <SectionLabel num="06" label="กติกา" />
          <h2 className="th text-[clamp(26px,3.4vw,40px)] font-normal tracking-[-0.02em] leading-[1.2] m-0 mb-[32px]">
            กติกาที่บังคับใช้จริง
          </h2>
          <div className="border border-[var(--rule)] divide-y divide-[var(--rule)]">
            <div className="p-[24px]">
              <div className="caps opacity-55 mb-[10px]">อัพโหลด</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">
                {UPLOAD_RULES.quotaDetail} · {UPLOAD_RULES.fileTypes} · {UPLOAD_RULES.maxFileSize}
              </p>
            </div>
            <div className="p-[24px]">
              <div className="caps opacity-55 mb-[10px]">การโหวต</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">{UPLOAD_RULES.voteRule}</p>
            </div>
            <div className="p-[24px]">
              <div className="caps opacity-55 mb-[10px]">ผู้ชนะ</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0">
                {SCORING_RULES.winnerRule} — {season.label} เปิดรับภาพ {season.rangeLabel}
              </p>
            </div>
            <div className="p-[24px]">
              <div className="caps opacity-55 mb-[10px]">{TRAVELLER_RULES.label}</div>
              <p className="th text-[15px] leading-[1.75] text-fg-soft m-0 mb-[14px]">
                {TRAVELLER_RULES.eligibility} — รางวัลเป็น{TRAVELLER_RULES.rewardType}เท่านั้น
              </p>
              <div className="border border-[var(--rule)] divide-y divide-[var(--rule)] max-w-[440px]">
                {TRAVELLER_RULES.rewards.map((r) => (
                  <div key={r.rank} className="flex justify-between items-baseline px-[18px] py-[12px]">
                    <span className="caps opacity-55">{r.rank}</span>
                    <span className="th text-[15px] font-medium">{r.reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[96px] rule-top">
        <div className="wrap-narrow text-center">
          <h2 className="th text-[clamp(28px,4vw,48px)] font-normal tracking-[-0.025em] m-0 leading-[1.15]">
            พร้อมส่งภาพแรกของคุณหรือยัง?
          </h2>
          <p className="th mt-[20px] text-[16px] text-fg-soft leading-[1.7] m-0">
            ทุกภาพเริ่มต้นบนสนามเดียวกัน — คะแนนเป็นของชุมชน
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-[16px] mt-[32px]">
            <Link href="/upload" className="btn btn-solid">เริ่มส่งภาพ</Link>
            <Link href="/explore" className="btn">ดูภาพในประกวดก่อน</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
