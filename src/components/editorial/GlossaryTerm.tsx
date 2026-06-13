'use client';
import type { ReactNode } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Thai definitions for ranking jargon — shown once at the first visible occurrence of each term.
export const GLOSSARY = {
  'rank-master':
    'ช่างภาพที่ติด Top 3 ของอันดับรายสัปดาห์ 3 สัปดาห์ติดต่อกัน จะได้รับสถานะ Rank Master ตลอดทั้ง Season',
  popular:
    'Badge ระดับสูงจากคะแนน GoScore — ภาพที่คะแนนโหวตจากชุมชนติดกลุ่มเปอร์เซ็นไทล์สูงสุดของรอบ และมียอดเข้าชมถึงเกณฑ์',
  rising:
    'Badge จากคะแนน GoScore — ภาพที่คะแนนโหวตจากชุมชนกำลังไต่อันดับเปอร์เซ็นไทล์ขึ้น',
  trending:
    'Badge จากความเร็วการมีส่วนร่วม (velocity) — ภาพที่ได้คะแนนโหวตจากชุมชนพุ่งแรงที่สุดในรอบ 7 วันล่าสุดของ Season',
  'ambassadors-pick':
    'ภาพที่ Ambassador คัดเลือก มีผลต่อ badge และการมองเห็น แต่ไม่บวกคะแนน',
  traveller:
    'ลูกค้าที่เคยร่วมทริปกับ Gography (ยืนยันจากระบบ booking) มีหมวดประกวดและรางวัล Cashback เฉพาะ',
  season:
    'รอบการประกวด — Season 01: 8 มิ.ย. – 8 ต.ค. 2569',
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

export function GlossaryTerm({
  term,
  children,
  underline = true,
  className = '',
}: {
  term: GlossaryKey;
  children: ReactNode;
  underline?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              className={`cursor-help outline-none ${
                underline ? 'underline decoration-dotted decoration-1 underline-offset-[3px] decoration-current' : ''
              } ${className}`}
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipContent className="th max-w-[280px] whitespace-normal normal-case tracking-normal text-left text-[12px] leading-[1.6] px-3 py-2">
          {GLOSSARY[term]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
