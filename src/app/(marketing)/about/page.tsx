// About — manifesto-style brand story page

import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-[48px]">
      {eyebrow && <div className="caps mb-[16px] opacity-55">{eyebrow}</div>}
      <h2 className="text-[36px] font-normal tracking-[-0.02em] m-0 leading-[1.15]">{title}</h2>
    </div>
  );
}

function BigStat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-[56px] font-medium tracking-[-0.03em] leading-[1]">{n}</div>
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55 mt-[16px]">{l}</div>
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
        title={<>A platform for photographers<br />who never stop travelling</>}
        subtitle="GOGRAPHY Ranking — เวทีสำหรับช่างภาพและนักเดินทาง ภาพต้องหายใจได้ ไม่ใช่ภาพที่ algorithm จัดการ"
      />

      <section className="pt-[96px] pb-[120px]">
        <div className="wrap-narrow">
          <p
            className="text-[clamp(22px,2.4vw,30px)] leading-[1.5] tracking-[-0.01em] text-[var(--fg)] max-w-[68ch] m-0"
            style={{ fontFamily: 'var(--serif)' }}
          >
            GOGRAPHY เริ่มต้นจากบริษัททัวร์ — เราออกแบบทริปถ่ายภาพในที่ที่นักเดินทางไม่กี่คนได้ไป
            Patagonia, Iceland, Atacama, Mongolia เราอยากเห็นภาพเหล่านั้นมารวมตัวอยู่ในที่เดียว
          </p>
          <div className="magrule my-[64px]" />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-[48px] md:gap-[64px]">
            <p
              className="text-[16px] leading-[1.85] text-[var(--fg-soft)] m-0"
              style={{ fontFamily: 'var(--serif)' }}
            >
              500px ถูกขายไปนานแล้ว Instagram
              กลายเป็นที่ของ reel ที่เร่งจังหวะให้เร็วเกินกว่าภาพจะหายใจ
              เราเห็นช่องว่าง — ที่สำหรับภาพถ่ายที่ทำด้วยใจ ไม่ใช่ algorithm
            </p>
            <p
              className="text-[16px] leading-[1.85] text-[var(--fg-soft)] m-0"
              style={{ fontFamily: 'var(--serif)' }}
            >
              GOGRAPHY Ranking คือเวทีที่นั่น คะแนนจัดอันดับเปิดเผยทั้งหมด
              ทุก 4 เดือนเราเลือกภาพที่ดีที่สุดของฤดูกาล มอบ Voucher 50,000 บาท
              และเก็บไว้ใน Hall of Fame ตลอดไป
            </p>
          </div>
        </div>
      </section>

      <section className="py-[96px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap">
          <div className="mono grid grid-cols-[repeat(4,1fr)] gap-[48px]">
            <BigStat n="2026" l="Launched" />
            <BigStat n="3" l="Categories at launch" />
            <BigStat n="50K" l="THB voucher per season" />
            <BigStat n="∞" l="Hall of Fame slots" />
          </div>
        </div>
      </section>

      <section className="py-[96px]">
        <div className="wrap-narrow">
          <SectionHeader title="Editorial team" eyebrow="Editorial team" />
          <div className="grid grid-cols-[1fr_1fr] gap-[48px]">
            {(
              [
                { name: 'Anan Khamthuan', role: 'Editor in Chief', loc: 'Bangkok' },
                { name: 'Sasin Phongphan', role: 'Curation Director', loc: 'Chiang Mai' },
                { name: 'Vichai Sasiprapha', role: 'Travel Lead, GOGRAPHY', loc: 'Bangkok' },
                { name: 'Naree Suwannapong', role: 'Community', loc: 'Bangkok' },
              ] as { name: string; role: string; loc: string }[]
            ).map((p) => (
              <div
                key={p.name}
                className="pb-[32px] border-b border-[var(--rule)]"
              >
                <h4 className="text-[22px] font-normal tracking-[-0.015em] m-0">{p.name}</h4>
                <div className="caps opacity-55 mt-[8px]">
                  {p.role} · {p.loc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-[96px] pb-[120px] rule-top">
        <div className="wrap-narrow text-center">
          <h2
            className="text-[44px] font-normal tracking-[-0.02em] m-0 leading-[1.15]"
          >
            Want to join us?
          </h2>
          <div className="flex justify-center gap-[16px] mt-[32px]">
            <button className="btn btn-solid">Apply as photographer</button>
            <button className="btn">Travel with GOGRAPHY</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
