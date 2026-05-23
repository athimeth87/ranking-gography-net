'use client';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { VoyageurMark } from '@/components/icons';

export function RoleRibbon() {
  const { userState } = useApp();

  if (userState === 'customer') {
    return (
      <div className="bg-fg text-bg flex justify-between items-center px-10 py-2.5 text-[12px] tracking-[.12em] uppercase font-medium">
        <div className="flex items-center gap-3">
          <VoyageurMark size={8} />
          <span>Voyageur · Pim Asanachinda</span>
          <span className="th opacity-60 ml-3 tracking-[.1em]">— ส่งภาพเข้าหมวด Voyageurs · ฤดูกาล Spring 2026</span>
        </div>
        <div className="flex gap-5 items-center">
          <span className="opacity-60 font-mono">TODAY 0/1 · RESETS 00:00 ICT</span>
          <Link href="/upload" className="border-b border-bg pb-px">Upload photo →</Link>
          <Link href="/for-customers" className="opacity-70">Programme</Link>
        </div>
      </div>
    );
  }

  if (userState === 'photographer') {
    return (
      <div className="bg-cream text-fg flex justify-between items-center px-10 py-2.5 text-[12px] tracking-[.12em] uppercase font-medium border-b border-rule">
        <div>★ Photographer · Kanthorn Aroonrat</div>
        <div className="flex gap-5 items-center">
          <span className="opacity-55 font-mono">TODAY 0/1</span>
          <Link href="/upload" className="border-b border-fg pb-px">Upload</Link>
        </div>
      </div>
    );
  }

  return null;
}
