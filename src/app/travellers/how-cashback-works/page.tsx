import Link from 'next/link';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import {
  TRAVELLER_RULES,
  TRAVELLER_CASHBACK_TIERS,
  TRAVELLER_MAX_CASHBACK_PERCENT,
  getSeasonInfo,
} from '@/content/rules';

export const metadata = {
  title: 'How Cashback Works — Travellers Awards',
  description: 'เครดิตเงินคืน (Cashback) สำหรับ Traveller ทำงานอย่างไร — ขั้นบันได 3–15% และรางวัลอันดับ 1',
};

export default function HowCashbackWorksPage() {
  const season = getSeasonInfo();
  const topReward = TRAVELLER_RULES.rewards[0];

  return (
    <>
      <PageCover
        title="How Cashback Works"
        subtitle={`เครดิตเงินคืนสำหรับ Traveller — สูงสุด ${TRAVELLER_MAX_CASHBACK_PERCENT}% ต่อฤดูกาล`}
      />

      {/* Season banner */}
      <div className="bg-cream border-b border-rule">
        <div className="wrap py-6 flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-fg-faint m-0">
            Travellers Awards · {season.label}
          </p>
          <p className="th text-[13px] text-fg-soft m-0">{season.rangeLabel}</p>
        </div>
      </div>

      <div className="wrap py-20 lg:py-28">
        <div className="max-w-[760px]">

          {/* 01 — ใครมีสิทธิ์ */}
          <section className="pb-16 mb-16 border-b border-rule">
            <div className="caps opacity-55 mb-4">01 · ใครมีสิทธิ์</div>
            <h2 className="th text-[24px] sm:text-[30px] font-semibold tracking-tight leading-tight text-fg m-0 mb-6">
              Traveller คือลูกค้าที่ร่วมทริปจริงกับ GOGRAPHY
            </h2>
            <p className="th text-[16px] sm:text-[17px] leading-[1.8] text-fg-soft m-0 mb-4">
              {TRAVELLER_RULES.eligibility} — ล็อกอินด้วยอีเมลเดียวกับที่ใช้จองทริป
              ระบบจะยืนยันสถานะ Traveller ให้อัตโนมัติ ไม่ต้องสมัครเพิ่ม
            </p>
            <Link href="/for-customers" className="th text-[15px] font-medium text-fg border-b border-rule-strong pb-[3px]">
              อ่านสิทธิ์ทั้งหมดของ Traveller →
            </Link>
          </section>

          {/* 02 — ขั้นบันได Cashback */}
          <section className="pb-16 mb-16 border-b border-rule">
            <div className="caps opacity-55 mb-4">02 · ขั้นบันได Cashback</div>
            <h2 className="th text-[24px] sm:text-[30px] font-semibold tracking-tight leading-tight text-fg m-0 mb-6">
              อันดับยิ่งสูง เครดิตเงินคืนยิ่งมาก
            </h2>
            <p className="th text-[16px] sm:text-[17px] leading-[1.8] text-fg-soft m-0 mb-8">
              อันดับวัดจาก GoScore ของภาพที่ดีที่สุดของคุณในหมวดของตัวเอง เมื่อจบฤดูกาล —
              {' '}{topReward ? `${topReward.rank} รับ ${topReward.reward}` : ''} และ Top 10 รับ Cashback ตามลำดับขั้น
            </p>

            <div className="border-t border-rule">
              {TRAVELLER_CASHBACK_TIERS.map((tier) => (
                <div
                  key={tier.rank}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-6 py-5 border-b border-rule"
                >
                  <div>
                    <div className="th text-[16px] font-medium text-fg">{tier.rank}</div>
                    {tier.note && (
                      <div className="th text-[13px] text-fg-soft mt-1">{tier.note}</div>
                    )}
                  </div>
                  <div className="font-mono text-[24px] sm:text-[28px] font-medium tracking-[-0.02em] text-gold leading-none">
                    {tier.percent}%
                  </div>
                </div>
              ))}
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-fg-faint mt-4 m-0">
              Cashback = เครดิตเงินคืน · ไม่ใช่เงินสด
            </p>
          </section>

          {/* 03 — เงื่อนไข */}
          <section className="pb-16 mb-16 border-b border-rule">
            <div className="caps opacity-55 mb-4">03 · เงื่อนไข</div>
            <h2 className="th text-[24px] sm:text-[30px] font-semibold tracking-tight leading-tight text-fg m-0 mb-6">
              ใช้เป็นเครดิตส่วนลดทริปถัดไป — ไม่ใช่เงินสด
            </h2>
            <ul className="th list-none p-0 m-0 text-[16px] sm:text-[17px] leading-[1.8] text-fg-soft">
              <li className="py-3 border-b border-rule">
                Cashback (เครดิตเงินคืน) ใช้เป็นส่วนลดสำหรับทริป GOGRAPHY ครั้งถัดไป
                ไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้
              </li>
              <li className="py-3 border-b border-rule">
                อันดับสรุปเมื่อจบฤดูกาล{season.endLabel ? ` (${season.endLabel})` : ''} —
                ระหว่างฤดูกาลตัวเลขบนการ์ดเป็นอันดับปัจจุบัน ยังเปลี่ยนแปลงได้
              </li>
              <li className="py-3 border-b border-rule">
                ภาพต้องเป็นภาพที่เผยแพร่อยู่บนแพลตฟอร์มและไม่ถูกซ่อนจากการรายงาน
              </li>
              <li className="py-3 border-b border-rule">{TRAVELLER_RULES.rewardNote}</li>
            </ul>
          </section>

          {/* 04 — เริ่มต้น */}
          <section>
            <div className="caps opacity-55 mb-4">04 · เริ่มต้น</div>
            <h2 className="th text-[24px] sm:text-[30px] font-semibold tracking-tight leading-tight text-fg m-0 mb-6">
              ส่งภาพแรกของคุณวันนี้
            </h2>
            <p className="th text-[16px] sm:text-[17px] leading-[1.8] text-fg-soft m-0 mb-8">
              อัพโหลดได้วันละ 1 ภาพ — ทุกภาพที่ส่งในฤดูกาลนี้มีสิทธิ์ลุ้น Cashback ตามอันดับ
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/upload" className="btn">ส่งภาพเข้าประกวด</Link>
              <Link href="/for-customers" className="btn">สิทธิ์ของ Traveller</Link>
            </div>
          </section>

        </div>
      </div>
      <Footer />
    </>
  );
}
