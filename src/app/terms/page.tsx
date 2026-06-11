import { PageCover } from '@/components/layout/PageCover';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  const sections = [
    {
      id: "introduction",
      title: "บทนำ (Introduction)",
      content: "ยินดีต้อนรับสู่ Gography Ranking (ต่อจากนี้จะเรียกว่า \"แพลตฟอร์ม\") ซึ่งดำเนินการโดย GOGRAPHY Co., Ltd. การที่คุณเข้าใช้งานแพลตฟอร์มนี้ ไม่ว่าจะในฐานะ Visitor, Registered User, หรือ Photographer ถือว่าคุณได้ยอมรับและตกลงที่จะปฏิบัติตามข้อตกลงและเงื่อนไขเหล่านี้อย่างครบถ้วน"
    },
    {
      id: "copyright",
      title: "ลิขสิทธิ์และความเป็นเจ้าของภาพ",
      content: "ผู้ใช้งานที่อัปโหลดภาพถ่ายลงบนแพลตฟอร์ม ยังคงเป็นเจ้าของลิขสิทธิ์ภาพถ่ายนั้น 100% อย่างไรก็ตาม คุณยินยอมให้ GOGRAPHY Co., Ltd. มีสิทธิ์ในการแสดงผล ทำซ้ำ ปรับขนาด และใช้ภาพถ่ายเหล่านั้นเพื่อการประชาสัมพันธ์บนแพลตฟอร์มและสื่อโซเชียลมีเดียของ Gography โดยจะมีการให้เครดิตช่างภาพเสมอ"
    },
    {
      id: "scoring",
      title: "กฎเกณฑ์การให้คะแนนและการประกวด",
      content: "คะแนน GoScore คำนวณจากการโหวตของชุมชน ถ่วงน้ำหนักตามความน่าเชื่อถือของผู้โหวต โดยแพลตฟอร์มเปิดเผยปัจจัยที่ถูกนับในหน้า How Ranking Works แต่ไม่เปิดเผยค่าน้ำหนักที่แน่นอนเพื่อป้องกันการปั่นคะแนน การตัดสินของแอดมิน, Editor, และ Ambassador ถือเป็นที่สิ้นสุด\n• แพลตฟอร์มขอสงวนสิทธิ์ในการริบรางวัลหรือระงับบัญชีผู้ใช้งาน หากตรวจสอบพบว่ามีการใช้บอท สแปม หรือวิธีการใดๆ ที่ไม่สุจริตเพื่อเพิ่มคะแนน (GoScore)"
    },
    {
      id: "customer-privileges",
      title: "สิทธิ์พิเศษสำหรับ Customer",
      content: "การเลื่อนขั้น (Upgrade) บัญชีให้มีสิทธิ์เป็น Customer (ลูกค้าที่เคยร่วมทริปของ Gography) เป็นไปตามดุลยพินิจและข้อมูลจากระบบจองทัวร์ของ Gography\n• รางวัล Cashback (เครดิตเงินคืน) ที่ได้จากการประกวด ไม่สามารถแลกเปลี่ยนหรือทอนเป็นเงินสดได้ และต้องนำไปใช้เป็นส่วนลดตามเงื่อนไขที่กำหนดเท่านั้น"
    },
    {
      id: "limitation",
      title: "ข้อจำกัดความรับผิดชอบ (Limitation)",
      content: "แพลตฟอร์มให้บริการแบบ \"ตามสภาพ\" (As is) เราไม่รับประกันว่าแพลตฟอร์มจะทำงานได้โดยไม่มีข้อผิดพลาด หรือปราศจากการหยุดชะงัก GOGRAPHY จะไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นจากการดาวน์โหลดภาพ การละเมิดลิขสิทธิ์โดยผู้ใช้อื่น หรือการสูญหายของข้อมูล"
    },
    {
      id: "termination",
      title: "การยกเลิกและระงับบัญชี",
      content: "เราขอสงวนสิทธิ์ในการระงับ ลบ หรือแบนบัญชีผู้ใช้งานที่ทำผิดกฎ อัปโหลดภาพอนาจาร ภาพผิดกฎหมาย หรือทำตัวไม่เหมาะสมในช่องคอมเมนต์ โดยไม่จำเป็นต้องแจ้งให้ทราบล่วงหน้า"
    }
  ];

  return (
    <>
      <PageCover 
        title="Terms of Service" 
        subtitle="ข้อตกลงและเงื่อนไขการใช้งาน Gography Ranking"
      />
      
      {/* Date Banner */}
      <div className="bg-cream border-b border-rule">
        <div className="wrap py-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-fg-faint">
            Last Updated: January 1, 2026
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
