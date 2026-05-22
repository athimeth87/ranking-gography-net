'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { SectionHeader } from '@/components/Shared';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/about-ranking.jsx =====
// About Ranking — explains Pulse Score formula. Transparency is the differentiator.

function PageAboutRanking() {
  const sample = PHOTOS[0];
  return (
    <div className="page-fade">
      <PageCover
        photoId="p001"
        eyebrow="Pulse Score"
        title={<>How the ranking<br />is calculated</>}
        subtitle="ทุก user ควรเข้าใจว่าทำไมภาพหนึ่งจัดอันดับสูงกว่าอีกภาพ — Pulse score คือทั้งหมดที่เราใช้ ไม่มี algorithm ดำมืด"
      />

      {/* The formula */}
      <section style={{ padding: '40px 0 96px' }}>
        <div className="wrap">
          <div style={{ background: 'var(--cream)', padding: '64px 56px', border: '1px solid var(--rule)' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginBottom: 32 }}>
              The Pulse Score formula
            </div>
            <pre className="mono" style={{ fontSize: 'clamp(18px, 2.2vw, 28px)', lineHeight: 1.7, margin: 0, fontWeight: 500, letterSpacing: '-.005em', whiteSpace: 'pre-wrap' }}>
{`pulse  =  (likes × 1  +  likes_24h × 3  +  curation_bonus)
          ─────────────────────────────────────────────────
                       max(hours_since_upload, 1)`}
            </pre>
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--rule)' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginBottom: 20 }}>
                Curation bonus values
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 14 }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ padding: '14px 0', width: '50%' }}>No pick</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>+0</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ padding: '14px 0' }}>Editor's pick <em style={{ opacity: .55, fontStyle: 'normal' }}>OR</em> Ambassador's pick</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>+50</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '14px 0', fontWeight: 600 }}>Both Editor &amp; Ambassador picks</td>
                    <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 600 }}>+100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Worked example */}
      <section style={{ padding: '40px 0 96px' }}>
        <div className="wrap">
          <SectionHeader eyebrow="Worked example" title="Worked example from current #1" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            <div>
              <div style={{ aspectRatio: '4/5', background: 'var(--tile)', overflow: 'hidden' }}>
                <img src={sample.src} alt={sample.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{sample.title}</div>
                  <div className="pby" style={{ marginTop: 4 }}>{PHOTOGRAPHERS.find(p => p.username === sample.by)?.name}</div>
                </div>
                <div className="mono" style={{ fontSize: 11, opacity: .55 }}>#001</div>
              </div>
            </div>
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)' }}>
                <tbody>
                  <ExampleRow label="Total likes" expr={`${sample.likes.toLocaleString()} × 1`} val={sample.likes} />
                  <ExampleRow label="Likes in last 24h" expr={`${sample.likes24h} × 3`} val={sample.likes24h * 3} />
                  <ExampleRow label="Curation bonus" expr={
                    sample.picks.length === 2 ? 'Both picks · +100'
                    : sample.picks.length === 1 ? `${sample.picks[0]}'s pick · +50`
                    : 'No pick · +0'
                  } val={sample.picks.length === 2 ? 100 : sample.picks.length === 1 ? 50 : 0} />
                  <ExampleRow label="Subtotal" expr="sum" val={sample.likes + sample.likes24h * 3 + (sample.picks.length === 2 ? 100 : sample.picks.length === 1 ? 50 : 0)} bold />
                  <ExampleRow label="Hours since upload" expr="÷" val={sample.hours} />
                  <tr style={{ borderTop: '2px solid var(--fg)' }}>
                    <td style={{ padding: '20px 0', fontSize: 14 }}>Pulse Score</td>
                    <td style={{ padding: '20px 0' }} />
                    <td style={{ padding: '20px 0', textAlign: 'right', fontSize: 36, fontWeight: 500, letterSpacing: '-.02em' }}>{sample.pulse.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="th" style={{ marginTop: 32, fontSize: 14, color: 'var(--fg-soft)', lineHeight: 1.7 }}>
                คะแนนนี้ refresh ทุก ๆ 15 นาที — และตัวหาร <code className="mono">hours_since_upload</code> ทำให้ภาพใหม่มีโอกาสไต่อันดับเร็ว ขณะเดียวกันภาพคุณภาพที่อยู่นานก็ยังรักษาอันดับได้
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section style={{ padding: '80px 0', background: 'var(--cream)' }} className="rule-top rule-bot">
        <div className="wrap">
          <SectionHeader title="Principles" eyebrow="Why we built it this way" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 56 }}>
            <Principle n="01" title="โปร่งใส" body="ทุกตัวเลขใน formula เปิดให้ผู้ใช้ตรวจสอบได้ — ไม่มี black-box ranking" />
            <Principle n="02" title="สดใหม่" body="hours_since_upload เป็นตัวหาร ทำให้ภาพใหม่ที่ได้รับความสนใจไต่อันดับได้เร็ว" />
            <Principle n="03" title="ไม่ใช่ popularity contest" body="curation bonus จาก editor และ ambassador ทำให้ภาพคุณภาพที่อาจไม่ viral ได้รับการมองเห็น" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '96px 0' }}>
        <div className="wrap">
          <SectionHeader title="Frequently asked questions" eyebrow="FAQ" />
          <div style={{ maxWidth: 760 }}>
            {[
              ['1 บัญชี Gmail โหวตได้กี่ภาพ?', 'ภาพละ 1 ครั้ง — แต่จำนวนภาพที่คุณโหวตได้ "ไม่จำกัด" และ toggle เปิด/ปิดได้ตลอดเวลา ถ้ายกเลิก คะแนนของภาพนั้นจะลดลงทันที'],
              ['อัพโหลดได้กี่ภาพต่อวัน?', 'วันละ 1 ภาพต่อบัญชี — ทั้งหมวดทั่วไปและ Voyageurs Awards รวมกัน เพื่อรักษาคุณภาพและลด spam ระบบจะ reset เวลา 00:00 น. ตามเวลาประเทศไทย'],
              ['Pulse score เปลี่ยนแปลงบ่อยแค่ไหน?', 'คำนวณใหม่ทุก 15 นาที — ดังนั้นอันดับขยับได้ตลอดเวลา'],
              ['Editor\'s Pick เลือกอย่างไร?', 'Editorial team GOGRAPHY คัดเลือกจากภาพที่มี composition และเล่าเรื่องโดดเด่น — ไม่ขึ้นกับจำนวน like'],
              ['ถ้าภาพถูกซ่อน จะยังนับใน Pulse?', 'ไม่ — ภาพที่ถูกซ่อนโดย admin จะไม่ปรากฏใน leaderboard'],
            ].map(([q, a], i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--rule)' }} open={i === 0}>
                <summary style={{ padding: '24px 0', fontSize: 17, fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} className="th">
                  <span>{q}</span>
                  <span className="mono" style={{ fontSize: 12, opacity: .55 }}>+</span>
                </summary>
                <p style={{ margin: 0, padding: '0 0 24px 0', fontSize: 15, color: 'var(--fg-soft)', lineHeight: 1.7 }} className="th">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ExampleRow({ label, expr, val, bold }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--rule)' }}>
      <td style={{ padding: '14px 0', fontSize: 12, opacity: .65, width: '40%' }}>{label}</td>
      <td style={{ padding: '14px 0', fontSize: 12, opacity: .55, width: '35%' }}>{expr}</td>
      <td style={{ padding: '14px 0', fontSize: 16, textAlign: 'right', fontWeight: bold ? 600 : 400 }}>{typeof val === 'number' ? val.toLocaleString() : val}</td>
    </tr>
  );
}

function Principle({ n, title, body }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginBottom: 16 }}>{n}</div>
      <h3 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-.015em', margin: 0 }} className="th">{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--fg-soft)', marginTop: 16 }} className="th">{body}</p>
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageAboutRanking />; }
