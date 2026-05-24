// Hall of Fame — past Best Photo of Season winners

import { getSeasons, getPhoto, getPhotographer } from '@/lib/data';
import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';
import { MobileHallOfFame } from '@/components/mobile/MobileHallOfFame';

// ─── helpers ────────────────────────────────────────────────────────────────

function CashbackTier({
  rank,
  label,
  detail,
}: {
  rank: string;
  label: string;
  detail: string;
}) {
  return (
    <div>
      <div className="mono text-[11px] tracking-[.16em] uppercase opacity-55">
        Rank {rank}
      </div>
      <div className="text-[32px] font-normal tracking-[-0.02em] mt-[12px] leading-[1.1]">
        {label}
      </div>
      <div className="th text-[13px] text-[var(--fg-soft)] mt-[12px] leading-[1.6]">{detail}</div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function Page() {
  const seasons = getSeasons();

  return (
    <>
      <div className="md:hidden">
        <MobileHallOfFame />
      </div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId="p010"
        eyebrow="Awards Archive"
        title="Hall of Fame"
        subtitle="ทุก 4 เดือน GOGRAPHY คัดเลือกภาพแห่งฤดูกาลในแต่ละหมวด — ผู้ชนะรับ Voucher 50,000 THB และที่ใน Hall of Fame ตลอดไป"
      />

      {/* Cashback program ribbon */}
      <section className="py-8 md:py-[48px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 lg:gap-[48px]">
            <CashbackTier rank="1" label="Best Photo" detail="Voucher 50,000 THB ต่อหมวด" />
            <CashbackTier rank="2–3" label="Cashback 15%" detail="ส่วนลดทริปครั้งถัดไป" />
            <CashbackTier rank="4–10" label="Cashback 3–10%" detail="ส่วนลดทริปครั้งถัดไป" />
          </div>
          <p className="th mt-[32px] text-[12px] text-[var(--fg-soft)] max-w-[720px] leading-[1.7]">
            รางวัลเฉพาะลูกค้าทริป GOGRAPHY ที่ได้รับการรับรองโดยEditorial team —
            ตรวจสอบสถานะลูกค้าได้ที่หน้าโปรไฟล์ของคุณ
          </p>
        </div>
      </section>

      {/* Seasons */}
      <section className="py-[80px]">
        <div className="wrap">
          {seasons.map((season, idx) => (
            <div key={season.id} className="mb-12 md:mb-20 lg:mb-[80px]">
              <div
                className="flex flex-wrap justify-between items-baseline gap-3 pb-4 md:pb-6 mb-6 md:mb-8 border-b border-[var(--fg)]"
              >
                <div className="flex items-baseline gap-3 md:gap-[24px] flex-wrap">
                  <span className="mono text-[11px] tracking-[.16em] uppercase opacity-55">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2
                    className="text-[clamp(28px,6.5vw,56px)] font-normal tracking-[-0.025em] m-0 leading-[1]"
                  >
                    {season.name}
                  </h2>
                  <span className="caps th opacity-55">{season.range}</span>
                </div>
                <div>
                  {season.status === 'live' ? (
                    <span className="pick solid">● Live now</span>
                  ) : (
                    <span className="caps opacity-55">Closed</span>
                  )}
                </div>
              </div>

              {season.status === 'live' || !season.winners ? (
                <div className="py-[64px] text-center">
                  <p
                    className="th text-[18px] text-[var(--fg-soft)] max-w-[520px] mx-auto"
                  >
                    ฤดูกาลปัจจุบันยังเปิดอยู่ — ผลรางวัลจะประกาศในเดือนเมษายน 2569
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-[32px]">
                  {(Object.entries(season.winners) as [string, { photoId: string; voucher: string }][]).map(
                    ([cat, w]) => {
                      const photo = getPhoto(w.photoId);
                      const photographer = photo ? getPhotographer(photo.by) : undefined;
                      if (!photo) return null;
                      return (
                        <div key={cat} className="cursor-pointer">
                          <div
                            className="aspect-[4/5] bg-[var(--tile)] overflow-hidden relative"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.src}
                              alt={photo.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            <div
                              className="absolute top-[12px] left-[12px] bg-[var(--bg)] px-[10px] py-[6px]"
                            >
                              <div className="caps text-[9px]">
                                {cat === 'BW' ? 'Black & White' : cat}
                              </div>
                            </div>
                          </div>
                          <div className="mt-[20px]">
                            <div className="caps opacity-55 mb-[8px]">Winner</div>
                            <h3
                              className="text-[24px] font-normal tracking-[-0.015em] m-0"
                            >
                              {photo.title}
                            </h3>
                            <div className="mt-[12px] flex justify-between items-baseline">
                              <div className="text-[13px] text-[var(--fg-soft)]">
                                {photographer?.name}
                              </div>
                              <div className="mono text-[11px] opacity-60">{w.voucher}</div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
