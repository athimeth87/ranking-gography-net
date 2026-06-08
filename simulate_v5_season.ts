import { rankPhotographers, photographerBadge, type PhotographerInput, PULSE_V5_HOF } from './src/lib/pulse-engine-v4.ts';

function randomScore(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// 1. จำลองข้อมูลช่างภาพ 4 คนที่ผ่านเกณฑ์ส่งรูปเกิน 22 รูป (1 ซีซั่น)
const simulatedInputs: PhotographerInput[] = [
  {
    id: 'user_1',
    // folkparin: สายเทพ ส่งรูปสม่ำเสมอ คะแนนปังทุกรูป (80-99)
    username: 'folkparin',
    photoScores: Array.from({ length: 25 }, () => randomScore(80, 99)),
    accountAgeDays: 300,
  },
  {
    id: 'user_2',
    // parintnk: สายฟลุ๊ค มีรูปไวรัล 99.9 แค่ 2 รูป ที่เหลือคะแนนกาก (10-30)
    username: 'parintnk',
    photoScores: [99.9, 99.5, ...Array.from({ length: 23 }, () => randomScore(10, 30))],
    accountAgeDays: 200,
  },
  {
    id: 'user_3',
    // athimeth87: สายมาตรฐาน ส่งรูปเยอะมาก 40 รูป คะแนนกลางๆ (50-70)
    username: 'athimeth87',
    photoScores: Array.from({ length: 40 }, () => randomScore(50, 70)),
    accountAgeDays: 150,
  },
  {
    id: 'user_4',
    // zerryboy28: ดาวรุ่งพุ่งแรง แอกเคานต์เพิ่งสร้าง 60 วัน (อายุไม่เกิน 90 วัน) คะแนนดีมาก (85-98)
    username: 'zerryboy28',
    photoScores: Array.from({ length: 22 }, () => randomScore(85, 98)),
    accountAgeDays: 60, // เข้าเกณฑ์ Rising Talent
  },
];

console.log('🏆 ---------------------------------------------------- 🏆');
console.log('🏆 SIMULATING FULL SEASON: V5 PHOTOGRAPHER HALL OF FAME 🏆');
console.log('🏆 ---------------------------------------------------- 🏆\n');

// 2. คำนวณเข้าระบบ V5
const results = rankPhotographers(simulatedInputs);

// 3. เรียงตามคะแนน HOF จากมากไปน้อย
results.sort((a, b) => (b.hofScore || 0) - (a.hofScore || 0));

let md = "| อันดับ | ตากล้อง | สไตล์ที่จำลอง | ส่งไปกี่รูป? | ค่าเฉลี่ย | HOF Score | ป้ายยศ V5 |\n";
md += "|:---:|---|---|:---:|:---:|:---:|---|\n";

let rank = 1;
for (const r of results) {
  const badge = photographerBadge({ hofScore: r.hofScore, accountAgeDays: r.item.accountAgeDays });
  
  // แกะ style description
  let style = '';
  if (r.item.username === 'folkparin') style = 'สายเทพ (คะแนนดีสม่ำเสมอ)';
  if (r.item.username === 'parintnk') style = 'สายฟลุ๊ค (ไวรัล 2 รูป ที่เหลือพัง)';
  if (r.item.username === 'athimeth87') style = 'สายมาตรฐาน (ส่งเยอะ คะแนนกลางๆ)';
  if (r.item.username === 'zerryboy28') style = 'ดาวรุ่ง (บัญชีใหม่ คะแนนโหด)';

  md += `| ${rank++} | **@${r.item.username}** | ${style} | ${r.photoCount} รูป | ${r.avgScore.toFixed(1)} | **${r.hofScore ? r.hofScore.toFixed(1) : '-'}** | ${badge || '-'} |\n`;
}

console.log(md);
