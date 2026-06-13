import { ColorIcon, CompositionIcon, LightIcon } from './aspectIcons';

// The permanent "what is voting" card. Explains the three aspects without any
// mention of weights (layered transparency) — the season winner is simply the
// highest total score. Copy locked in the 2026-06-12 mockup.
const ITEMS = [
  { Icon: ColorIcon, th: 'สี', en: 'Color', desc: 'สีและโทนของภาพโดนใจ — การเลือกสี อารมณ์ของโทน ความกลมกลืน' },
  { Icon: CompositionIcon, th: 'องค์ประกอบ', en: 'Composition', desc: 'การจัดวางองค์ประกอบเฉียบ — มุมมอง เส้นนำสายตา จังหวะของเฟรม' },
  { Icon: LightIcon, th: 'แสง', en: 'Light', desc: 'แสงคือพระเอกของภาพ — จังหวะแสง เงา มิติที่แสงสร้างขึ้น' },
];

export function VoteAspectExplainer() {
  return (
    <div className="border border-rule">
      <p className="th text-[15px] leading-[1.85] text-fg-soft m-0 px-6 pt-[22px] pb-[18px]">
        ทุกโหวตมีค่าเท่ากันและรวมเป็นคะแนนของภาพ — การเลือกปุ่มคือการบอกช่างภาพว่า ภาพนี้เด่นเรื่องอะไรในสายตาคุณ
      </p>
      <div className="divide-y divide-[var(--rule)] border-t border-rule">
        {ITEMS.map((it) => (
          <div key={it.en} className="flex gap-5 px-6 py-[18px] items-start">
            <span className="shrink-0 w-9 h-9 border border-rule flex items-center justify-center text-fg">
              <it.Icon size={16} />
            </span>
            <div className="min-w-0">
              <div className="th text-[15px] font-medium">
                {it.th}
                <span className="mono text-[10px] tracking-[.14em] uppercase text-fg-faint ml-2">{it.en}</span>
              </div>
              <p className="th text-[14px] leading-[1.7] text-fg-soft m-0 mt-1">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="th text-[13px] leading-[1.8] text-fg-soft opacity-70 m-0 px-6 py-[18px] border-t border-rule">
        เลือกด้านที่เด่นที่สุด หรือมากกว่าหนึ่งถ้าเด่นจริงหลายด้าน · ผู้ชนะซีซั่นคือภาพที่คะแนนรวมสูงสุด
      </p>
    </div>
  );
}
