// Single source of truth for competition rule copy (Thai-first).
// Every public page that states a rule must read from here — never restate locally.

import { getSeasons } from '@/lib/data';
import type { Season } from '@/lib/types';

export interface RewardTier {
  rank: string;
  reward: string;
}

export interface RuleLine {
  num: string;
  label: string;
  detail: string;
}

// ── Upload / photographer rules ──────────────────────────────────────────────
// Quota matches real enforcement (checkUploadLimit counts photos per account per day).
export const UPLOAD_RULES = {
  quota: '1 ภาพต่อบัญชีต่อวัน',
  quotaShort: '1/day',
  quotaDetail: 'อัพโหลดได้วันละ 1 ภาพต่อบัญชี รวมทุกหมวด — ทุกภาพได้ช่วงเปิดรับโหวต 24 ชั่วโมงเท่ากัน',
  fileTypes: 'JPEG · PNG · WebP',
  maxFileSize: 'ขนาดสูงสุด 5 MB',
  voteRule: 'โหวตให้ภาพอื่นได้ไม่จำกัด · 1 ภาพโหวตได้ครั้งเดียว กดถอนโหวตได้ตลอด',
} as const;

// ── GoScore / scoring rules ──────────────────────────────────────────────────
// Truth from the live Pulse V4 engine. No time-decay, no curation bonus —
// never claim either. Exact weights are intentionally not disclosed.
export const SCORING_RULES = {
  name: 'GoScore',
  summary:
    'คะแนนมาจากการโหวตของชุมชน ถ่วงน้ำหนักตามความน่าเชื่อถือของผู้โหวต — ออกแบบให้ปั่นโหวตไม่ได้',
  summaryEn:
    'Scores come from community votes, weighted by voter trust — designed so votes cannot be gamed.',
  inputs: [
    'การโหวตของชุมชน (ไลก์ · เฟเวอริต · แชร์)',
    'น้ำหนักตามบทบาทผู้โหวต — โหวตจาก Ambassador และ Traveller มีน้ำหนักมากกว่า',
    'โมเมนตัมช่วงแรก — โหวตใน 24 ชั่วโมงแรกหลังเผยแพร่มีน้ำหนักมากกว่า',
  ],
  notCounted: [
    'ไม่มีการลดทอนคะแนนตามเวลา (no time-decay)',
    'ไม่มีโบนัสคะแนนจากทีมงานหรือการคัดเลือก (no curation bonus)',
    "Ambassador's Pick มีผลต่อ badge และการมองเห็นเท่านั้น — ไม่บวกคะแนน",
  ],
  transparency:
    'เราเปิดเผยว่า "อะไร" ถูกนับ แต่ไม่เปิดเผยค่าน้ำหนักที่แน่นอน เพื่อป้องกันการปั่นคะแนน',
  winnerRule: 'ผู้ชนะของแต่ละหมวด คือภาพที่ได้ GoScore สูงสุดเมื่อจบฤดูกาล',
} as const;

// ── Traveller (ลูกค้าทัวร์) rules — separate labelled rule set ───────────────
// Reward is Cashback (เครดิตเงินคืน) only. Never the word "Voucher".
export const TRAVELLER_RULES = {
  label: 'กติกาเฉพาะหมวด Traveller',
  eligibility:
    'เฉพาะลูกค้าที่เคยร่วมเดินทางกับ GOGRAPHY — ระบบยืนยันสถานะ Traveller จากข้อมูลการจองทัวร์',
  rewardType: 'เครดิตเงินคืน (Cashback)',
  rewards: [
    { rank: 'อันดับ 1', reward: 'Cashback 50,000 บาท' },
    { rank: 'Top 10', reward: 'Cashback 3–15% (ตามลำดับขั้น)' },
  ] as readonly RewardTier[],
  rewardNote: 'Cashback ใช้เป็นเครดิตเงินคืนสำหรับทริป GOGRAPHY · เงื่อนไขเป็นไปตามที่บริษัทกำหนด',
} as const;

// ── Season info — dates derive from the data layer, never hardcoded counts ──
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
] as const;

export function formatThaiDate(iso: string): string {
  const d = new Date(iso);
  const month = THAI_MONTHS[d.getMonth()] ?? '';
  return `${d.getDate()} ${month} ${d.getFullYear() + 543}`;
}

export interface SeasonInfo {
  name: string;
  label: string;
  startLabel: string;
  endLabel: string;
  rangeLabel: string;
  endDate: string | null;
}

export function getSeasonInfo(): SeasonInfo {
  const seasons = getSeasons();
  const live: Season | undefined = seasons.find((s) => s.status === 'live') ?? seasons[0];
  const endDate = live?.endDate ?? null;
  const startLabel = '8 มิถุนายน 2569';
  const endLabel = endDate ? formatThaiDate(endDate) : '';
  return {
    name: live?.name ?? 'Season 1',
    label: 'Season 01',
    startLabel,
    endLabel,
    rangeLabel: endLabel ? `${startLabel} – ${endLabel}` : startLabel,
    endDate,
  };
}
