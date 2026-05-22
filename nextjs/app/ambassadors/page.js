'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PageCover } from '@/components/PageCover';

// ===== Ported from pages/ambassadors.jsx =====
// Ambassadors — list of trusted curators (invite-only)

function PageAmbassadors() {
  const router = useRouter();
  return (
    <div className="page-fade">
      <PageCover
        photoId="p002"
        eyebrow="Curators"
        title="Ambassadors"
        subtitle="ช่างภาพรับเชิญที่ GOGRAPHY ไว้วางใจให้คัดเลือก Ambassador Pick — เพิ่ม Pulse Score +50 ต่อภาพ"
      />

      <section style={{ padding: '40px 0 96px' }} className="rule-top">
        <div className="wrap">
          {AMBASSADORS.map((a, i) => {
            const theirPicks = PHOTOS.filter(p => p.by === a.username || p.picks.includes('ambassador')).slice(0, 4);
            return (
              <div key={a.username} style={{ display: 'grid', gridTemplateColumns: '300px 1fr 1fr', gap: 48, padding: '56px 0', borderBottom: '1px solid var(--rule)', alignItems: 'start' }}>
                <div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', opacity: .55, marginBottom: 24 }}>
                    {String(i + 1).padStart(2,'0')} of {AMBASSADORS.length}
                  </div>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', background: 'var(--tile)', marginBottom: 20 }}>
                    <img src={a.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h3 style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-.02em', margin: 0 }}>{a.name}</h3>
                  <div className="caps" style={{ opacity: .55, marginTop: 8 }}>{a.loc} · @{a.username}</div>
                  <button onClick={() => router.push(`/photographer/${a.username}`)} className="btn btn-sm" style={{ marginTop: 24 }}>View profile</button>
                </div>
                <div>
                  <div className="caps" style={{ opacity: .55, marginBottom: 16 }}>Statement</div>
                  <p style={{ fontSize: 18, lineHeight: 1.55, margin: 0, letterSpacing: '-.005em' }} className="th">{a.bio}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--fg-soft)', marginTop: 20 }} className="th">
                    คัดเลือกภาพในแนว <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{a.username === 'wattana' ? 'Black & White' : (a.username === 'kanthorn' ? 'Landscape' : 'Portrait')}</strong> — เน้นที่ composition และจังหวะของแสง
                  </p>
                </div>
                <div>
                  <div className="caps" style={{ opacity: .55, marginBottom: 16 }}>Recent picks</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {theirPicks.slice(0, 4).map(p => (
                      <div key={p.id} onClick={() => router.push(`/photo/${p.id}`)} style={{ cursor: 'pointer' }}>
                        <div style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                          <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ padding: '80px 0 120px', background: 'var(--cream)' }} className="rule-top rule-bot">
        <div className="wrap-narrow" style={{ textAlign: 'center' }}>
          <div className="caps" style={{ opacity: .55, marginBottom: 24 }}>Become an Ambassador</div>
          <h2 style={{ fontSize: 40, fontWeight: 400, letterSpacing: '-.02em', margin: 0, lineHeight: 1.15 }} className="th">
            Ambassador programme is invite-only by the GOGRAPHY team
          </h2>
          <p style={{ fontSize: 15, color: 'var(--fg-soft)', marginTop: 24, lineHeight: 1.7 }} className="th">
            หากคุณมีผลงานต่อเนื่องและได้รับ Editor's Pick มากกว่า 3 ครั้ง คุณอาจได้รับคำเชิญในฤดูกาลถัดไป
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}



// ===== Next.js page wrapper =====
export default function Page() { return <PageAmbassadors />; }
