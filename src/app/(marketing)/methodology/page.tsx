// Public Pulse methodology — transparency page (Trust before Growth).
// Numbers are read straight from the engine constants so they never drift.

import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import { PULSE_V2 } from '@/lib/pulse-engine-v2';

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-[32px]">
      {eyebrow && <div className="caps mb-[14px] opacity-55">{eyebrow}</div>}
      <h2 className="text-[28px] md:text-[32px] font-normal tracking-[-0.02em] m-0 leading-[1.15]">{title}</h2>
    </div>
  );
}

export default function Page() {
  const w = PULSE_V2.VOTE_WEIGHT;
  return (
    <div className="page-fade">
      <PageCover
        photoId="p001"
        eyebrow="Methodology"
        title={<>How Pulse<br />is computed</>}
        subtitle="วิธีคิดคะแนน Pulse แบบเปิดเผยทุกขั้นตอน — เพราะความเชื่อใจมาก่อนการเติบโต"
      />

      {/* 1. What Pulse is */}
      <section className="pt-[80px] pb-[64px]">
        <div className="wrap-narrow space-y-[18px]">
          <SectionHeader eyebrow="01 / What it is" title="Pulse ไม่ใช่การตัดสินคุณภาพ" />
          <p className="th text-[16px] leading-[1.85] text-fg-soft m-0 max-w-[68ch]">
            Pulse คือ <strong>ตำแหน่งสัมพัทธ์</strong>ของภาพเมื่อเทียบกับภาพอื่นในช่วงเวลาเดียวกัน —
            วัดว่า “เก่งแค่ไหนเทียบกับสนามตอนนี้” ไม่ใช่ “สวยกว่า/แย่กว่า” ในเชิงศิลปะ
            ภาพที่ Pulse ต่ำ ไม่ได้แปลว่าไม่ดี แค่ยังไม่ได้รับ engagement มากพอ ณ ขณะนั้น
          </p>
        </div>
      </section>

      {/* 2. The formula */}
      <section className="py-[64px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="02 / The formula" title="สูตร 3 ชั้น" />
          <pre className="mono text-[12px] leading-[1.7] bg-cream border border-rule p-[20px] overflow-x-auto">{`engagement   = ${PULSE_V2.W_COMMENT}·comments + ${PULSE_V2.W_FAVORITE}·favorites + ${PULSE_V2.W_LIKE}·likes(weighted)
rate         = engagement / impressions          # ใช้ impressions จริง
adjusted     = (v·rate + m·C) / (v + m)          # Bayesian — กันรูป view น้อยฟลุ๊ค
score        = adjusted × decay(age)             # ลดตามเวลา
display       = percentile(score) × 100           # 0–100 สัมพัทธ์กับสนาม`}</pre>
          <p className="th text-[14px] leading-[1.8] text-fg-soft mt-[18px] m-0 max-w-[68ch]">
            <strong>display = percentile × 100</strong> แปลว่าคะแนนที่เห็นคือ “อยู่อันดับกี่ % ของสนาม” —
            เว็บเล็กหรือใหญ่ ผู้นำก็คือ 100 เสมอ และป้ายไม่เฟ้อเมื่อคนเพิ่ม
          </p>
        </div>
      </section>

      {/* 3. Weights */}
      <section className="py-[64px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="03 / Weights" title="น้ำหนักของแต่ละสัญญาณ" />
          <table className="w-full text-[14px] border-collapse">
            <tbody>
              {[
                ['Comment', `× ${PULSE_V2.W_COMMENT}`, 'ลงแรงมากสุด'],
                ['Favorite', `× ${PULSE_V2.W_FAVORITE}`, 'ตั้งใจเก็บ'],
                ['Like', `× ${PULSE_V2.W_LIKE}`, 'เบาสุด — และถูกถ่วงน้ำหนักกันโกง (ดูข้อ 05)'],
              ].map(([k, v, note]) => (
                <tr key={k} className="border-b border-rule">
                  <td className="py-[12px] font-medium">{k}</td>
                  <td className="py-[12px] mono">{v}</td>
                  <td className="py-[12px] th text-fg-soft">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Time decay */}
      <section className="py-[64px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="04 / Time decay" title="คะแนนลดตามเวลา (ไม่หายไป)" />
          <table className="w-full text-[14px] border-collapse max-w-[420px]">
            <tbody>
              {[['0–1 วัน', '1.00', 'peak'], ['7 วัน', '0.30', 'floor'], ['14+ วัน', '0.30', 'คงที่ ไม่ลดต่อ']].map(([a, d, n]) => (
                <tr key={a} className="border-b border-rule">
                  <td className="py-[12px]">{a}</td>
                  <td className="py-[12px] mono">{d}</td>
                  <td className="py-[12px] th text-fg-soft">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="th text-[14px] leading-[1.8] text-fg-soft mt-[18px] m-0 max-w-[68ch]">
            รูปสดได้ spotlight ก่อน แล้วค่อยจางลงเหลือ floor {PULSE_V2.DECAY_FLOOR} — รูปเก่าไม่ “ตาย”
            แต่ต้องสะสม engagement มากกว่าถึงจะกลับมาแซง (fair กับ creator ใหม่)
          </p>
        </div>
      </section>

      {/* 5. Anti-collusion */}
      <section className="py-[64px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="05 / Anti-collusion" title="ไลก์ไม่เท่ากันทุกอัน — กันการปั๊ม" />
          <p className="th text-[15px] leading-[1.85] text-fg-soft m-0 max-w-[68ch] mb-[20px]">
            ไลก์ของคนแปลกหน้า 1 ไลก์ = น้ำหนัก 1.0 แต่ไลก์ที่ดู “จัดตั้ง” จะถูกหักน้ำหนัก:
          </p>
          <table className="w-full text-[14px] border-collapse">
            <tbody>
              {[
                ['คนแปลกหน้า (ปกติ)', `${w.BASE.toFixed(1)}`],
                ['ผู้ติดตามเจ้าของรูป', `× ${w.FOLLOWER_FACTOR}`],
                ['เจ้าของเพิ่งโหวตคืนให้คนนี้', `× ${w.RECIPROCITY_FACTOR}`],
                [`โหวตกันไปมาบ่อย (≥ ${w.ANTI_COLLUSION_THRESHOLD} ครั้ง)`, `× ${w.ANTI_COLLUSION_FACTOR}`],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-rule">
                  <td className="py-[12px] th">{k}</td>
                  <td className="py-[12px] mono text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Status tiers + recalibration */}
      <section className="py-[64px] rule-top">
        <div className="wrap-narrow space-y-[16px]">
          <SectionHeader eyebrow="06 / Status & recalibration" title="ป้ายสถานะ = percentile (ไม่เฟ้อ)" />
          <p className="th text-[15px] leading-[1.85] text-fg-soft m-0 max-w-[68ch]">
            ป้ายคิดจาก <strong>percentile</strong> เสมอ ไม่ใช่เลขคงที่:
            <span className="mono"> Popular = top {Math.round((1 - PULSE_V2.POPULAR_PCT) * 100)}%</span>,
            <span className="mono"> Top of the Field = top {Math.round((1 - PULSE_V2.TOP_FIELD_PCT) * 100)}%</span>
            (ต้องมี views ≥ {PULSE_V2.BADGE_MIN_VIEWS} กันป้ายเฟ้อตอนเว็บเล็ก)
          </p>
          <p className="th text-[15px] leading-[1.85] text-fg-soft m-0 max-w-[68ch]">
            ระบบ <strong>recalibrate ใหม่ทุกคืน</strong> — คำนวณ percentile ของทั้งสนามใหม่ ฉะนั้นมีคนเล่น
            100 หรือ 100,000 คน “top 5%” ก็ยังหมายถึง top 5% เสมอ
          </p>
        </div>
      </section>

      {/* 7. Known limits */}
      <section className="pt-[64px] pb-[120px] rule-top">
        <div className="wrap-narrow">
          <SectionHeader eyebrow="07 / Known limits" title="ข้อจำกัดที่เรารู้" />
          <ul className="th text-[15px] leading-[1.9] text-fg-soft m-0 pl-[20px] space-y-[6px] max-w-[68ch]">
            <li>ยังไม่เทียบข้ามหมวด (landscape vs portrait อยู่สนามเดียวกัน)</li>
            <li>Anti-collusion จับ “เครือข่ายปั๊ม” ที่ซับซ้อนยังไม่ได้ทั้งหมด (ต้องใช้ graph/ML)</li>
            <li>Bayesian prior ดึงรูป view น้อยเข้าหาค่ากลาง — รูปดีจริงต้องรอสะสม views พอสมควร</li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}
