// Ranking — explains the Gography Photo Ranking concept and special statuses.

import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

function SectionHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-[48px]">
      {eyebrow && (
        <div className="caps mb-[16px] opacity-55">{eyebrow}</div>
      )}
      <h2 className="text-[36px] font-normal tracking-[-0.02em] m-0 leading-[1.15]">{title}</h2>
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="th text-[16px] leading-[1.85] text-[var(--fg-soft)] m-0">{children}</p>
  );
}

export default function Page() {
  return (
    <div className="page-fade">
      <PageCover
        photoId="p001"
        eyebrow="Ranking"
        title={<>Gography<br />Photo Ranking</>}
        subtitle="พื้นที่สำหรับนักเดินทางและช่างภาพ ที่อยากแบ่งปันภาพถ่ายจากการเดินทาง พร้อมเข้าร่วมการจัดอันดับภาพถ่ายประจำสัปดาห์"
      />

      {/* Intro: About Gography Photo Ranking */}
      <section className="pt-[80px] pb-[96px]">
        <div className="wrap">
          <SectionHeader eyebrow="About" title="Gography Photo Ranking" />
          <div className="max-w-[820px] space-y-[24px]">
            <Paragraph>
              พื้นที่สำหรับนักเดินทางและช่างภาพ ที่อยากแบ่งปันภาพถ่ายจากการเดินทาง
              พร้อมเข้าร่วมการจัดอันดับภาพถ่ายประจำสัปดาห์
              เพื่อค้นหาภาพที่โดดเด่นที่สุดจากชุมชน Gography
            </Paragraph>
            <Paragraph>
              ระบบนี้ถูกออกแบบมาเพื่อให้ทุกภาพถ่ายมีโอกาสถูกมองเห็น
              ไม่ว่าจะเป็นภาพจากช่างภาพมืออาชีพ
              หรือลูกค้าที่ร่วมเดินทางไปกับ Gography
              ทุกคนสามารถส่งภาพเข้าร่วม แบ่งปันแรงบันดาลใจ
              และเป็นส่วนหนึ่งของชุมชนคนรักการเดินทางและการถ่ายภาพได้
            </Paragraph>
          </div>
        </div>
      </section>

      {/* Ambassador */}
      <section className="py-[80px] section-alt rule-top rule-bot">
        <div className="wrap">
          <SectionHeader eyebrow="Status" title="Ambassador" />
          <div className="max-w-[820px] space-y-[24px]">
            <Paragraph>
              Ambassador คือสถานะพิเศษสำหรับช่างภาพที่ได้รับการคัดเลือกโดยทีมงาน Gography
            </Paragraph>
            <Paragraph>
              สถานะนี้มอบให้กับช่างภาพที่มีผลงานโดดเด่น
              มีมุมมองการถ่ายภาพที่ชัดเจน
              และมีคุณภาพเหมาะสมกับภาพลักษณ์ของเว็บไซต์
              โดยไม่จำเป็นต้องติดอันดับในระบบ Ranking
            </Paragraph>
            <Paragraph>
              Ambassador จึงเป็นเหมือนตัวแทนของช่างภาพคุณภาพ
              ที่ Gography ให้การยอมรับและคัดเลือกเป็นพิเศษ
            </Paragraph>
          </div>
        </div>
      </section>

      {/* Ranked Master */}
      <section className="py-[96px]">
        <div className="wrap">
          <SectionHeader eyebrow="Badge" title="Ranked Master" />
          <div className="max-w-[820px] space-y-[24px]">
            <Paragraph>
              คือ Badge พิเศษสำหรับช่างภาพที่สามารถติดอันดับ Top 1–3
              ติดต่อกันเป็นเวลา 4 สัปดาห์
            </Paragraph>
            <Paragraph>
              Badge นี้สะท้อนถึงความสามารถ ความสม่ำเสมอ
              และคุณภาพของผลงานที่ได้รับการยอมรับจากระบบ Ranking อย่างต่อเนื่อง
            </Paragraph>
            <Paragraph>
              ช่างภาพที่ได้รับ Ranked Master ไม่ได้โดดเด่นเพียงแค่ครั้งเดียว
              แต่สามารถรักษามาตรฐานของผลงานไว้ได้ในระดับสูงติดต่อกันหลายสัปดาห์
            </Paragraph>
          </div>
        </div>
      </section>

      {/* Voyageurs */}
      <section className="py-[80px] section-alt rule-top rule-bot">
        <div className="wrap">
          <SectionHeader eyebrow="Community" title="Voyageurs" />
          <div className="max-w-[820px] space-y-[24px]">
            <Paragraph>
              Voyageurs คือกลุ่มลูกค้าที่เคยร่วมเดินทางกับ Gography
            </Paragraph>
            <Paragraph>
              สมาชิกกลุ่มนี้จะได้รับสิทธิ์พิเศษในการอัปโหลดภาพถ่ายเข้าสู่เว็บไซต์ได้
              ทั้งในหมวดภาพถ่ายทั่วไป และหมวดพิเศษสำหรับลูกค้า Gography โดยเฉพาะ
            </Paragraph>
            <Paragraph>
              ในหมวด Voyageurs Ranking
              ลูกค้าจะได้ร่วมสนุกกับการส่งภาพเข้าประกวด
              และแข่งขันกับลูกค้าที่เคยเดินทางกับ Gography ด้วยกันเอง
              โดยเว็บไซต์จะเป็นผู้กำหนดรางวัลพิเศษให้กับภาพที่ได้รับการคัดเลือก
              หรือได้รับคะแนนสูงสุดในแต่ละรอบ
            </Paragraph>
            <Paragraph>
              หมวดนี้ถูกสร้างขึ้นเพื่อให้ภาพถ่ายจากทุกการเดินทาง
              ไม่ได้เป็นเพียงความทรงจำส่วนตัว
              แต่ยังสามารถถูกแบ่งปัน สร้างแรงบันดาลใจ
              และกลายเป็นส่วนหนึ่งของชุมชน Gography ได้
            </Paragraph>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
