import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

export default function PhotoRightsPage() {
  const sections = [
    {
      id: "ownership",
      title: "ภาพเป็นลิขสิทธิ์ของช่างภาพ 100% — ตลอดเวลา",
      content: "ภาพถ่ายทุกภาพที่คุณอัปโหลดขึ้น Gography Ranking ยังคงเป็นลิขสิทธิ์ของคุณโดยสมบูรณ์ 100% ตลอดเวลา การอัปโหลดภาพเข้าสู่แพลตฟอร์ม ไม่ใช่การโอนสิทธิ์ ไม่ใช่การขายสิทธิ์ และไม่ใช่การมอบความเป็นเจ้าของในรูปแบบใดทั้งสิ้น\n• คุณเป็นเจ้าของผลงานก่อนอัปโหลด ระหว่างที่ภาพอยู่บนแพลตฟอร์ม และหลังจากลบภาพออกไปแล้ว — ไม่มีข้อยกเว้น\n• คุณยังคงมีสิทธิ์นำภาพไปขาย ตีพิมพ์ ส่งประกวดที่อื่น หรือใช้งานเชิงพาณิชย์ได้เต็มที่ โดยไม่ต้องขออนุญาตจากแพลตฟอร์ม"
    },
    {
      id: "platform-license",
      title: "สิทธิ์ของแพลตฟอร์ม — เฉพาะในบริบทของ Ranking เท่านั้น",
      content: "สิ่งเดียวที่แพลตฟอร์มได้รับจากการอัปโหลดของคุณ คือสิทธิ์ในการแสดงผลภาพ \"ภายในบริบทของการจัดอันดับ (Ranking)\" เท่านั้น ได้แก่:\n• การแสดงภาพใน Feed และหน้า Explore\n• การแสดงบน Leaderboard และผลการจัดอันดับ\n• การประกาศผลรางวัลประจำซีซัน\n• หอเกียรติยศ (Hall of Fame)\nนอกเหนือจากบริบทเหล่านี้ แพลตฟอร์มไม่มีสิทธิ์นำภาพของคุณไปใช้งานที่อื่นโดยอัตโนมัติ"
    },
    {
      id: "no-marketing-use",
      title: "ห้ามนำภาพไปใช้การตลาดโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
      content: "GOGRAPHY จะไม่นำภาพของคุณไปใช้ในสื่อการตลาด โฆษณาทัวร์ โบรชัวร์ หรือแคมเปญเชิงพาณิชย์ใดๆ โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากคุณ \"เป็นรายภาพ\"\n• หากทีมงานต้องการใช้ภาพใดของคุณ เราจะติดต่อคุณโดยตรงเป็นรายกรณี โดยระบุภาพ วัตถุประสงค์ และขอบเขตการใช้งานให้ชัดเจนก่อนเสมอ\n• การตัดสินใจเป็นของคุณ 100% — การปฏิเสธจะไม่มีผลใดๆ ต่ออันดับ คะแนน หรือสถานะบัญชีของคุณ"
    },
    {
      id: "deletion",
      title: "ลบภาพหรือลบบัญชีได้ทุกเมื่อ — และลบจริง",
      content: "คุณสามารถลบภาพใดก็ได้ หรือลบบัญชีทั้งหมด ได้ทุกเมื่อ โดยไม่ต้องแจ้งเหตุผลและไม่มีเงื่อนไขผูกมัด\n• เมื่อคุณลบ ภาพจะถูกนำออกจากระบบจริง รวมถึงไฟล์ต้นฉบับใน storage — ไม่ใช่เพียงการซ่อนจากหน้าจอ\n• ภาพที่ถูกลบจะหายไปจาก Feed, Explore, Leaderboard และหน้าโปรไฟล์ของคุณทั้งหมด"
    }
  ];

  return (
    <>
      <PageCover
        title="Photo Rights"
        subtitle="ลิขสิทธิ์ภาพและสิทธิ์ของช่างภาพบน Gography Ranking"
      />

      {/* Date Banner */}
      <div className="bg-cream border-b border-rule">
        <div className="wrap py-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-fg-faint">
            Last Updated: June 11, 2026
          </p>
        </div>
      </div>

      <div className="wrap py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-16 lg:gap-24 items-start">

          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-32">
            <h4 className="font-mono text-xs uppercase tracking-widest text-fg-faint mb-8">Table of Contents</h4>
            <nav className="flex flex-col gap-6">
              {sections.map((s, idx) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-[15px] text-fg-soft hover:text-fg transition-colors font-medium flex items-center gap-4 group"
                >
                  <span className="font-mono text-[10px] text-fg-faint group-hover:text-fg transition-colors">0{idx + 1}</span>
                  <span className="th">{s.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="max-w-[760px]">
            {sections.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                className="mb-24 last:mb-0 scroll-mt-32"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6 mb-8">
                  <span className="font-mono text-6xl font-light text-fg-faint select-none hidden sm:block">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-4xl font-light text-fg-faint select-none sm:hidden">
                    0{index + 1}
                  </span>
                  <h2 className="th text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-fg leading-tight">
                    {section.title}
                  </h2>
                </div>

                <div className="th text-[16px] sm:text-[18px] leading-[1.8] text-fg-soft sm:pl-[5.5rem]">
                  {section.content.split('\n').map((line, i) => (
                    <p
                      key={i}
                      className={line.startsWith('•') ? 'pl-6 mb-3 relative before:content-[""] before:absolute before:left-0 before:top-[12px] before:w-1.5 before:h-1.5 before:bg-fg-faint before:rounded-full' : 'mb-6'}
                    >
                      {line.replace('• ', '')}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
