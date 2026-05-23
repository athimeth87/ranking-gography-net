'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PageCover } from '@/components/PageCover';
import { MobileApplyPhotographer } from '@/components/mobile/MobileMisc';

// ===== Ported from pages/apply-photographer.jsx =====
// Apply as Photographer — portfolio submission form
// Reachable from: /me sidebar, hero CTAs, footer

function PageApplyPhotographer() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name: '', username: '', email: '',
    portfolio: '', instagram: '', website: '',
    category: 'Landscape', experience: '3+',
    statement: '',
    sampleUrls: ['', '', ''],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (step === 4) {
    return (
      <div className="page-fade" style={{ padding: '120px 0' }}>
        <div className="wrap-narrow" style={{ textAlign: 'center' }}>
          <div className="caps" style={{ opacity: .55, marginBottom: 24 }}>✓ Submitted</div>
          <h1 className="display-hero th" style={{ fontSize: 'clamp(48px, 5vw, 72px)', margin: 0 }}>
            Your application<br />is with our team
          </h1>
          <p className="th" style={{ marginTop: 24, fontSize: 16, color: 'var(--fg-soft)', lineHeight: 1.7 }}>
            ทีม Editorial จะตรวจสอบ portfolio ของคุณภายใน 7 วันทำการ — เมื่ออนุมัติแล้ว คุณจะได้รับอีเมลพร้อมสิทธิ์อัพโหลดภาพ
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 40 }}>
            <button className="btn" onClick={() => router.push('/explore')}>Browse photos</button>
            <button className="btn btn-solid" onClick={() => router.push('/')}>Back to home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
    <div className="md:hidden"><MobileApplyPhotographer /></div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId="p005"
        eyebrow="Apply"
        title={<>Submit your portfolio<br />for upload access</>}
        subtitle="เราเปิดรับช่างภาพมือสมัครเล่นและอาชีพ — ทีม Editorial จะตรวจสอบ portfolio ของคุณก่อนอนุมัติสิทธิ์อัพโหลด (ภายใน 7 วัน)"
      />

      {/* Progress */}
      <section style={{ padding: '32px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="wrap">
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {[
              { n: 1, l: 'About you' },
              { n: 2, l: 'Portfolio' },
              { n: 3, l: 'Statement' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.n}>
                <button onClick={() => step > s.n && setStep(s.n)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: step > s.n ? 'pointer' : 'default',
                  opacity: step === s.n ? 1 : .55,
                }}>
                  <span className="mono" style={{
                    width: 28, height: 28, border: '1px solid var(--fg)',
                    display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 500,
                    background: step >= s.n ? 'var(--fg)' : 'transparent',
                    color: step >= s.n ? 'var(--bg)' : 'var(--fg)',
                  }}>{step > s.n ? '✓' : String(s.n).padStart(2,'0')}</span>
                  <span className="caps" style={{ fontWeight: step === s.n ? 500 : 400 }}>{s.l}</span>
                </button>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--rule)', margin: '0 24px' }}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Form steps */}
      <section style={{ padding: '64px 0 96px' }}>
        <div className="wrap-narrow">
          {step === 1 && (
            <div>
              <h2 className="th" style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: '0 0 32px' }}>About you</h2>
              <FieldX label="ชื่อจริง"><input className="input" placeholder="เช่น Kanthorn Aroonrat" value={form.name} onChange={e => set('name', e.target.value)} /></FieldX>
              <FieldX label="Username ที่ต้องการ" sub="ตัวอักษร a-z, 0-9, จุด — ตั้งครั้งเดียวเปลี่ยนได้ทีหลัง">
                <input className="input" placeholder="kanthorn" value={form.username} onChange={e => set('username', e.target.value)} />
              </FieldX>
              <FieldX label="Gmail" sub="ใช้สำหรับ login + ติดต่อกลับ">
                <input className="input" placeholder="your.name@gmail.com" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </FieldX>
              <FieldX label="หมวดที่คุณเชี่ยวชาญ">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {['Landscape', 'Portrait', 'BW'].map(c => (
                    <button key={c} onClick={() => set('category', c)} style={{
                      padding: '14px 8px',
                      border: '1px solid ' + (form.category === c ? 'var(--fg)' : 'var(--rule)'),
                      background: form.category === c ? 'var(--fg)' : 'transparent',
                      color: form.category === c ? 'var(--bg)' : 'var(--fg)',
                      fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase',
                      cursor: 'pointer', fontWeight: 500,
                    }}>{c === 'BW' ? 'B&W' : c}</button>
                  ))}
                </div>
              </FieldX>
              <FieldX label="ประสบการณ์ถ่ายภาพ">
                <select className="input" value={form.experience} onChange={e => set('experience', e.target.value)}>
                  <option value="0-1">น้อยกว่า 1 ปี (มือใหม่)</option>
                  <option value="1-3">1–3 ปี</option>
                  <option value="3+">3+ ปี</option>
                  <option value="10+">10+ ปี (มืออาชีพ)</option>
                </select>
              </FieldX>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                <button className="btn btn-solid" disabled={!form.name || !form.username || !form.email} onClick={() => setStep(2)} style={{ opacity: form.name && form.username && form.email ? 1 : .4 }}>
                  ถัดไป — Portfolio
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="th" style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: '0 0 8px' }}>Portfolio</h2>
              <p className="th" style={{ marginTop: 0, marginBottom: 32, color: 'var(--fg-soft)', fontSize: 14 }}>ลิงก์อย่างน้อย 1 ลิงก์ เพื่อให้ทีมตรวจสอบผลงาน</p>
              <FieldX label="Portfolio link (เช่น 500px, Behance, Adobe Portfolio)" sub="แนะนำ">
                <input className="input" placeholder="https://..." value={form.portfolio} onChange={e => set('portfolio', e.target.value)} />
              </FieldX>
              <FieldX label="Instagram"><input className="input" placeholder="@username" value={form.instagram} onChange={e => set('instagram', e.target.value)} /></FieldX>
              <FieldX label="Website (ถ้ามี)"><input className="input" placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} /></FieldX>

              <div style={{ marginTop: 32, padding: '24px 28px', background: 'var(--cream)', border: '1px solid var(--rule)' }}>
                <div className="caps" style={{ opacity: .55, marginBottom: 12 }}>OR upload sample photos</div>
                <p className="th" style={{ fontSize: 13, color: 'var(--fg-soft)', marginBottom: 16 }}>ถ้าไม่มี portfolio online ส่ง 3 ภาพตัวอย่างของคุณ — JPEG/PNG/WebP ≤ 25MB ต่อภาพ</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      aspectRatio: '1', border: '1px dashed var(--rule)',
                      display: 'grid', placeItems: 'center', cursor: 'pointer', textAlign: 'center', padding: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 24, fontFamily: 'var(--mono)', fontWeight: 300, opacity: .55 }}>+</div>
                        <div className="caps" style={{ marginTop: 6, opacity: .55, fontSize: 9.5 }}>Sample {i+1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← ย้อนกลับ</button>
                <button className="btn btn-solid" disabled={!form.portfolio && !form.instagram} onClick={() => setStep(3)} style={{ opacity: (form.portfolio || form.instagram) ? 1 : .4 }}>
                  ถัดไป — Statement
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="th" style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: '0 0 8px' }}>Statement</h2>
              <p className="th" style={{ marginTop: 0, marginBottom: 32, color: 'var(--fg-soft)', fontSize: 14 }}>เล่าให้ทีมรู้ว่าทำไมคุณอยากเป็นส่วนหนึ่งของเวที</p>
              <FieldX label="คุณถ่ายภาพอะไร? อะไรคือสิ่งที่คุณกำลังตามล่า?" sub="200–500 ตัวอักษร">
                <textarea className="input" rows="8" placeholder="เช่น ผมถ่ายภาพภูเขาทางเหนือมา 5 ปี เริ่มจากความหลงใหลในหมอกตอนเช้าที่ดอยอินทนนท์..." value={form.statement} onChange={e => set('statement', e.target.value)}></textarea>
                <div className="mono" style={{ fontSize: 10, opacity: .55, marginTop: 8, textAlign: 'right' }}>{form.statement.length} / 500</div>
              </FieldX>
              <div style={{ marginTop: 32, padding: '20px 24px', background: 'var(--cream)', border: '1px solid var(--rule)' }}>
                <div className="caps" style={{ opacity: .55, marginBottom: 12 }}>What happens next</div>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: 'var(--fg-soft)' }} className="th">
                  <li>ทีม Editorial ตรวจสอบ portfolio (3-7 วัน)</li>
                  <li>หากผ่าน คุณจะได้รับอีเมลพร้อม activation link</li>
                  <li>หลังจากนั้นอัพโหลดภาพแรกได้ทันที (วันละ 1 ภาพ)</li>
                </ol>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>← ย้อนกลับ</button>
                <button className="btn btn-solid" disabled={form.statement.length < 50} onClick={() => setStep(4)} style={{ opacity: form.statement.length >= 50 ? 1 : .4 }}>
                  ส่งใบสมัคร
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}

function FieldX({ label, sub, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="caps" style={{ opacity: .65 }}>{label}</span>
        {sub && <span className="mono" style={{ fontSize: 10.5, opacity: .45 }}>{sub}</span>}
      </div>
      {children}
    </label>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageApplyPhotographer />; }
