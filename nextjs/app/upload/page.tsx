'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { useApp } from '@/components/AppProvider';
import { PageCover } from '@/components/PageCover';
import { MobileUpload } from '@/components/mobile/MobileMisc';

// ===== Ported from pages/upload.jsx =====
// Upload page — single photo upload form with daily limit
// Demonstrates the "1 photo per day per account" rule visually

function PageUpload({ userState }) {
  const router = useRouter();
  const [uploadedToday, setUploadedToday] = React.useState(0); // 0 or 1
  const [draft, setDraft] = React.useState({
    title: '',
    cat: 'Landscape',
    forCustomerAwards: userState === 'customer',
    caption: '',
    file: null,
  });
  const [dragOver, setDragOver] = React.useState(false);

  const limitReached = uploadedToday >= 1;

  // Countdown to midnight (Bangkok)
  const [countdown, setCountdown] = React.useState('');
  React.useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextMid = new Date(now);
      nextMid.setHours(24, 0, 0, 0);
      const ms = nextMid - now;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = () => {
    if (limitReached || !draft.file) return;
    setUploadedToday(1);
  };

  return (
    <>
    <div className="md:hidden"><MobileUpload /></div>
    <div className="page-fade hidden md:block">
      <PageCover
        photoId="p019"
        eyebrow="Upload"
        title="Submit a photo"
        subtitle="1 ภาพต่อวัน — JPEG/PNG/WebP สูงสุด 25 MB · ภาพต้องเป็นผลงานของคุณ"
      />
      <section style={{ padding: '48px 0 32px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 28, borderBottom: '1px solid var(--rule)' }}>
            <div>
              <div className="caps" style={{ opacity: .55, marginBottom: 14 }}>Upload</div>
              <h1 style={{ fontSize: 'clamp(40px, 4.6vw, 56px)', fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1 }} className="th">
                Submit a photo
              </h1>
            </div>

            {/* Daily limit counter */}
            <div style={{ textAlign: 'right' }}>
              <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>Today's upload</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                <span className="mono" style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-.02em', lineHeight: 1 }}>{uploadedToday}</span>
                <span className="mono" style={{ fontSize: 24, opacity: .35 }}>/1</span>
              </div>
              <div className="mono" style={{ fontSize: 11, opacity: .55, marginTop: 8 }}>
                RESETS IN {countdown} (BANGKOK)
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 80px' }}>
        <div className="wrap">
          {limitReached ? (
            <LimitReachedState countdown={countdown} onView={() => router.push('/photographer/' + (userState === 'customer' ? 'pim.travels' : 'kanthorn'))} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64 }}>
              {/* Left: drop zone + preview */}
              <div>
                <DropZone draft={draft} setDraft={setDraft} dragOver={dragOver} setDragOver={setDragOver} />

                {/* Daily rule notice */}
                <div style={{ marginTop: 24, padding: '18px 24px', background: 'var(--cream)', border: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }} className="th">วันละ 1 ภาพต่อบัญชี</div>
                    <div className="th" style={{ fontSize: 12, color: 'var(--fg-soft)', marginTop: 4 }}>
                      Limit รวมทุกหมวด · reset เวลา 00:00 ตามเวลาประเทศไทย · โหวตภาพอื่นได้ไม่จำกัด
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 11, opacity: .55 }}>{countdown}</div>
                </div>
              </div>

              {/* Right: metadata form */}
              <div>
                <div className="caps" style={{ opacity: .55, marginBottom: 24 }}>Metadata</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Field2 label="ชื่อภาพ">
                    <input className="input" placeholder="เช่น Morning fog, Doi Inthanon" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
                  </Field2>

                  <Field2 label="หมวด">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {['Landscape', 'Portrait', 'BW'].map(c => (
                        <button key={c} onClick={() => setDraft(d => ({ ...d, cat: c }))} style={{
                          padding: '14px 8px',
                          border: '1px solid ' + (draft.cat === c ? 'var(--fg)' : 'var(--rule)'),
                          background: draft.cat === c ? 'var(--fg)' : 'transparent',
                          color: draft.cat === c ? 'var(--bg)' : 'var(--fg)',
                          fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase',
                          cursor: 'pointer', fontWeight: 500,
                        }}>{c === 'BW' ? 'B&W' : c}</button>
                      ))}
                    </div>
                  </Field2>

                  {userState === 'customer' && (
                    <Field2 label="ส่งเข้าประเภทใด?">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button
                          onClick={() => setDraft(d => ({ ...d, forCustomerAwards: false }))}
                          style={{
                            padding: '20px 16px',
                            border: '1px solid ' + (!draft.forCustomerAwards ? 'var(--fg)' : 'var(--rule)'),
                            background: !draft.forCustomerAwards ? 'var(--cream)' : 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', gap: 6,
                            color: 'var(--fg)',
                          }}>
                          <div className="caps" style={{ fontSize: 9, opacity: .55 }}>General</div>
                          <div style={{ fontSize: 15, fontWeight: 500 }}>หมวดทั่วไป</div>
                          <div className="th" style={{ fontSize: 11, color: 'var(--fg-soft)', lineHeight: 1.5 }}>แข่งกับทุกคน · เข้า Pulse Score</div>
                        </button>
                        <button
                          onClick={() => setDraft(d => ({ ...d, forCustomerAwards: true }))}
                          style={{
                            padding: '20px 16px',
                            border: '1px solid ' + (draft.forCustomerAwards ? 'var(--fg)' : 'var(--rule)'),
                            background: draft.forCustomerAwards ? 'var(--fg)' : 'transparent',
                            color: draft.forCustomerAwards ? 'var(--bg)' : 'var(--fg)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', gap: 6,
                          }}>
                          <div className="caps" style={{ fontSize: 9, opacity: draft.forCustomerAwards ? .7 : .55, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <VoyageurMark size={7} /> Voyageurs
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 500 }}>หมวดลูกค้า</div>
                          <div className="th" style={{ fontSize: 11, opacity: .7, lineHeight: 1.5 }}>แข่งเฉพาะ Voyageur · ลุ้น 50,000 THB</div>
                        </button>
                      </div>
                      <div className="mono" style={{ marginTop: 10, fontSize: 10.5, opacity: .55 }}>
                        คุณเลือกได้เพราะคุณคือ Voyageur — ภาพเดียวเลือกได้เพียงหมวดเดียว
                      </div>
                    </Field2>
                  )}

                  {userState !== 'customer' && (
                    <div style={{ padding: '14px 16px', background: 'var(--cream)', border: '1px solid var(--rule)', fontSize: 12, lineHeight: 1.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>My photosจะถูกส่งเข้า <strong>หมวดทั่วไป</strong></span>
                      <Link href="/for-customers" className="caps" style={{ opacity: .6, fontSize: 10, borderBottom: '1px solid var(--rule)', paddingBottom: 2 }}>About Voyageurs →</Link>
                    </div>
                  )}

                  <Field2 label="คำบรรยายภาพ">
                    <textarea className="input" rows="4" placeholder="เล่าเรื่องของภาพ — สถานที่ เวลา หรือบริบทเล็กๆ" value={draft.caption} onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))}></textarea>
                  </Field2>

                  {/* EXIF preview */}
                  <div>
                    <div className="caps" style={{ opacity: .55, marginBottom: 12 }}>EXIF · auto-detected</div>
                    <table style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['Camera', draft.file ? 'Sony A7R V' : '—'],
                          ['Lens', draft.file ? '24-70mm f/2.8 GM II' : '—'],
                          ['ISO · F · S', draft.file ? '100 · f/8.0 · 1/250' : '—'],
                        ].map(([k, v]) => (
                          <tr key={k} style={{ borderBottom: '1px solid var(--rule)' }}>
                            <td style={{ padding: '8px 0', opacity: .55, width: '40%' }}>{k.toUpperCase()}</td>
                            <td style={{ padding: '8px 0' }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className={'btn ' + (!draft.file || !draft.title ? 'btn-ghost' : 'btn-solid')}
                    disabled={!draft.file || !draft.title}
                    onClick={handleSubmit}
                    style={{ marginTop: 12, justifyContent: 'center', opacity: !draft.file || !draft.title ? .35 : 1 }}>
                    {!draft.file ? 'เลือกภาพก่อน' : !draft.title ? 'ใส่ชื่อภาพ' : 'Submit a photo'}
                  </button>
                  <p className="mono" style={{ fontSize: 11, opacity: .55, textAlign: 'center', lineHeight: 1.7 }}>
                    หลังจากส่งแล้ว ภาพจะปรากฏใน Explore ทันที — และคุณจะกลับมาอัพภาพถัดไปได้พรุ่งนี้
                  </p>
                </div>
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

function DropZone({ draft, setDraft, dragOver, setDragOver }) {
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };
  const handleFile = (f) => {
    const url = URL.createObjectURL(f);
    setDraft(d => ({ ...d, file: { name: f.name, size: f.size, url } }));
  };
  const triggerPick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => { const f = e.target.files?.[0]; if (f) handleFile(f); };
    input.click();
  };

  if (draft.file) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--tile)' }}>
          <img src={draft.file.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
            <span className="mono" style={{ fontSize: 12 }}>{draft.file.name}</span>
            <span className="mono" style={{ fontSize: 11, opacity: .55 }}>{(draft.file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <button onClick={() => setDraft(d => ({ ...d, file: null }))} className="caps" style={{ cursor: 'pointer', borderBottom: '1px solid var(--rule)' }}>Replace</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={triggerPick}
      style={{
        aspectRatio: '4/3',
        border: '2px dashed ' + (dragOver ? 'var(--fg)' : 'var(--rule)'),
        background: dragOver ? 'var(--cream)' : 'transparent',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
        textAlign: 'center', padding: 40,
        transition: 'background .15s ease, border-color .15s ease',
      }}>
      <div>
        <div style={{ fontSize: 64, fontWeight: 300, letterSpacing: '-.04em', lineHeight: 1, marginBottom: 16, fontFamily: 'var(--mono)' }}>↑</div>
        <div style={{ fontSize: 18, fontWeight: 400 }} className="th">Drop a photo here</div>
        <p className="th" style={{ fontSize: 13, color: 'var(--fg-soft)', marginTop: 12, lineHeight: 1.6 }}>หรือคลิกเพื่อเลือกจากเครื่อง — JPEG, PNG, WebP สูงสุด 25 MB</p>
      </div>
    </div>
  );
}

function LimitReachedState({ countdown, onView }) {
  return (
    <div style={{ padding: '80px 40px', textAlign: 'center', maxWidth: 640, margin: '0 auto', border: '1px solid var(--rule)' }}>
      <div className="caps" style={{ opacity: .55, marginBottom: 24 }}>✓ Uploaded today</div>
      <h2 className="th" style={{ fontSize: 40, fontWeight: 400, letterSpacing: '-.025em', margin: 0, lineHeight: 1.15 }}>
        Today's upload is in
      </h2>
      <p className="th" style={{ marginTop: 20, fontSize: 15, color: 'var(--fg-soft)', lineHeight: 1.7 }}>
        ตามกติกา 1 บัญชีอัพภาพได้วันละ 1 ภาพ — ทำให้คนอื่นมีพื้นที่และรักษาคุณภาพในเวที
      </p>
      <div className="mono" style={{ marginTop: 32, padding: '20px 24px', background: 'var(--cream)', display: 'inline-block' }}>
        <div style={{ fontSize: 11, opacity: .55, letterSpacing: '.16em' }}>NEXT UPLOAD WINDOW IN</div>
        <div style={{ fontSize: 36, fontWeight: 500, marginTop: 6, letterSpacing: '-.02em' }}>{countdown}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
        <button className="btn" onClick={onView}>ดูโปรไฟล์ของคุณ</button>
        <button className="btn">โหวตภาพอื่น</button>
      </div>
      <p className="mono" style={{ marginTop: 32, fontSize: 11, opacity: .55 }}>คุณยังโหวตและบันทึก favorites ได้ไม่จำกัด</p>
    </div>
  );
}

function Field2({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div className="caps" style={{ opacity: .55, marginBottom: 8 }}>{label}</div>
      {children}
    </label>
  );
}



// ===== Next.js page wrapper =====
function PageWrapper() { const { userState } = useApp(); return <PageUpload userState={userState} />; }
export default PageWrapper;
