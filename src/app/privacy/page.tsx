import { PageCover } from '@/components/layout/PageCover';

export default function PrivacyPage() {
  const sections = [
    {
      id: "data-collection",
      title: "ข้อมูลที่เราเก็บรวบรวม",
      content: "เมื่อคุณเข้าสู่ระบบ Gography Photo Awards เราอาจเก็บรวบรวมข้อมูลส่วนบุคคลที่ระบุตัวตนได้ ได้แก่ อีเมล (ผ่านการเข้าสู่ระบบด้วย Google Auth), ชื่อที่แสดงผล (Display Name), รูปโปรไฟล์เบื้องต้น, และหมายเลขโทรศัพท์ (เฉพาะเมื่อจำเป็นต้องรับรหัส OTP) รวมถึงข้อมูลการใช้งาน เช่น ไฟล์ภาพที่คุณอัปโหลด ข้อมูลกล้อง (EXIF data) ที่ติดมากับภาพถ่าย ข้อมูลประวัติการกด Like/Favorite เป็นต้น"
    },
    {
      id: "data-usage",
      title: "วิธีการใช้ข้อมูลของคุณ",
      content: "เราใช้ข้อมูลส่วนบุคคลของคุณเพื่อ:\n• สร้างและจัดการบัญชีของคุณบนแพลตฟอร์ม\n• ยืนยันตัวตนว่า 1 ผู้ใช้งานสามารถโหวตได้เพียง 1 ครั้งต่อภาพ\n• ตรวจสอบสถานะการเป็นลูกค้า (Customer) ในระบบฐานข้อมูลของทัวร์ Gography เพื่อมอบสิทธิพิเศษหรือของรางวัล\n• ปรับปรุงระบบและออกแบบการนำเสนอเนื้อหาให้ตรงใจผู้ใช้มากขึ้น (Personalization)"
    },
    {
      id: "data-sharing",
      title: "การแบ่งปันข้อมูล",
      content: "เราให้ความสำคัญกับความเป็นส่วนตัวของคุณอย่างสูงสุด GOGRAPHY Co., Ltd. จะไม่นำข้อมูลส่วนบุคคลของคุณไปขาย แลกเปลี่ยน หรือส่งต่อให้แก่บุคคลที่สามเพื่อการตลาด โดยข้อมูลบางส่วน (เช่น ชื่อผู้ใช้ และภาพโปรไฟล์) จะแสดงต่อสาธารณะเมื่อคุณคอมเมนต์ หรือเมื่อคุณอัปโหลดภาพในฐานะช่างภาพ"
    },
    {
      id: "data-rights",
      title: "การลบและการขอเข้าถึงข้อมูล",
      content: "คุณมีสิทธิ์ทุกประการที่จะขอเข้าถึง แก้ไข หรือขอลบข้อมูลส่วนตัวของคุณออกจากระบบของเราได้ทุกเมื่อ โดยสามารถทำรายการลบบัญชีด้วยตัวเองในหน้าตั้งค่าโปรไฟล์ หรือส่งอีเมลแจ้งทีมงานเพื่อดำเนินการถอดถอนข้อมูลและภาพถ่ายทั้งหมดออกจากฐานข้อมูลของเรา"
    },
    {
      id: "cookies",
      title: "คุกกี้ (Cookies)",
      content: "แพลตฟอร์มของเรามีการใช้งานคุกกี้เพื่อจดจำสถานะการล็อกอิน และเพื่อเก็บสถิติการเข้าใช้งานทั่วไป (Google Analytics) เพื่อพัฒนาปรับปรุงประสบการณ์ผู้ใช้งานให้ดีขึ้น"
    }
  ];

  return (
    <>
      <PageCover 
        title="Privacy Policy" 
        subtitle="นโยบายความเป็นส่วนตัวและการจัดการข้อมูล Gography Photo Awards"
      />
      
      {/* Date Banner */}
      <div className="bg-neutral-50/50 border-b border-neutral-100">
        <div className="wrap py-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
            Last Updated: January 1, 2026
          </p>
        </div>
      </div>

      <div className="wrap py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-16 lg:gap-24 items-start">
          
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-32">
            <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-8">Table of Contents</h4>
            <nav className="flex flex-col gap-6">
              {sections.map((s, idx) => (
                <a 
                  key={s.id} 
                  href={`#${s.id}`}
                  className="text-[15px] text-neutral-500 hover:text-black transition-colors font-medium flex items-center gap-4 group"
                >
                  <span className="font-mono text-[10px] text-neutral-300 group-hover:text-neutral-900 transition-colors">0{idx + 1}</span>
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
                  <span className="font-mono text-6xl font-light text-neutral-200 select-none hidden sm:block">
                    0{index + 1}
                  </span>
                  <span className="font-mono text-4xl font-light text-neutral-300 select-none sm:hidden">
                    0{index + 1}
                  </span>
                  <h2 className="th text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900 leading-tight">
                    {section.title}
                  </h2>
                </div>
                
                <div className="th text-[16px] sm:text-[18px] leading-[1.8] text-neutral-600 sm:pl-[5.5rem]">
                  {section.content.split('\n').map((line, i) => (
                    <p 
                      key={i} 
                      className={line.startsWith('•') ? 'pl-6 mb-3 relative before:content-[""] before:absolute before:left-0 before:top-[12px] before:w-1.5 before:h-1.5 before:bg-neutral-300 before:rounded-full' : 'mb-6'}
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
    </>
  );
}
