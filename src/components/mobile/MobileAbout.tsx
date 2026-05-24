// @ts-nocheck
'use client';
import { PHOTOS } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

const principles = [
  { n: '01', t: 'Pulse over reach',        b: 'Engagement velocity beats follower count. Time-decayed, transparent formula.' },
  { n: '02', t: 'One season, one winner',  b: 'Highest pulse across all categories. Not split — concentrated.' },
  { n: '03', t: 'Travel is the medium',    b: 'Voyageurs photograph on the road. Cashback funds the next trip.' },
];

const team = [
  { name: 'Tul Manoonpong', role: 'Founder · Curator', tag: 'Bangkok',       seed: 'team-tul' },
  { name: 'Praewa Suwan',   role: 'Editorial Lead',    tag: 'Chiang Mai',    seed: 'team-praewa' },
  { name: 'Anuwat Phon',    role: 'Voyageur Liaison',  tag: 'Mae Hong Son',  seed: 'team-anuwat' },
  { name: 'Sirintra L.',    role: 'Community',         tag: 'Phuket',        seed: 'team-sirintra' },
];

export function MobileAbout() {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const coverPhoto = PHOTOS.find(p => p.id === 'p013') || PHOTOS[0];

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* Cover */}
      <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden', color: '#fff' }}>
        <img src={coverPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.78) 100%)',
        }} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 2 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            opacity: 0.85, marginBottom: 14,
          }}>— About</div>
          <div style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700,
            fontSize: 'clamp(34px, 9vw, 56px)', lineHeight: 1.02,
            letterSpacing: '-0.02em', maxWidth: '16ch',
          }}>A platform for the long, slow look.</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, maxWidth: '32ch', marginTop: 12 }}>
            Gography ranks Thai travel photography by what moves people — not who they follow.
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <section style={{ padding: '40px 16px 0' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.16em', color: 'var(--fg-soft)',
        }}>— Manifesto</div>
        <h2 style={{
          margin: '8px 0 16px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>We started in 2022 from a single road trip across the north.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: '38ch' }}>
          What began as a Drive folder of frames between four friends became a season-based competition. We wanted a place where the photographer who slept in a truck for a week stood beside the one who drove to a sunset spot — and let the audience decide.
        </p>
        <p style={{
          fontFamily: "'Noto Sans Thai', sans-serif",
          fontSize: 14, lineHeight: 1.65, marginTop: 16,
          color: 'var(--fg-soft)', maxWidth: '34ch',
        }}>
          เราเชื่อว่าภาพถ่ายที่ดีที่สุดเกิดขึ้นเมื่อช่างภาพใช้เวลาอยู่กับสถานที่ ไม่ใช่แค่ผ่านมัน
        </p>
      </section>

      {/* Stats — 2x2 */}
      <section style={{ padding: '40px 0 0' }}>
        <div style={{
          margin: '0 16px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          border: '1px solid var(--rule-strong)',
        }}>
          {[
            ['2022',   'Founded'],
            ['1,047',  'Photographers'],
            ['12,840', 'Frames'],
            ['฿1.2M',  'Cashback paid'],
          ].map(([n, l], i) => (
            <div key={l} style={{
              padding: '20px 14px',
              borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 0,
              borderBottom: i < 2 ? '1px solid var(--rule)' : 0,
            }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 500,
                letterSpacing: '-0.02em', lineHeight: 1, display: 'block',
              }}>{n}</span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--fg-soft)', marginTop: 6, display: 'block',
              }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section style={{ padding: '56px 16px 0' }}>
        <MobileSectionHeader num="01 / Principles" title="Three things we don't compromise on." />
        <div style={{ marginTop: 20 }}>
          {principles.map((p, i, a) => (
            <div key={p.n} style={{
              padding: '24px 0',
              borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
              display: 'grid', gridTemplateColumns: '52px 1fr', gap: 16,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 500 }}>{p.n}</div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 22, letterSpacing: '-0.01em',
                }}>{p.t}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-soft)' }}>{p.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '56px 16px 0' }}>
        <MobileSectionHeader num="02 / Team" title="Four people, one Drive folder." />
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {team.map(t => (
            <div key={t.name} style={{
              display: 'grid', gridTemplateColumns: '88px 1fr', gap: 14,
              padding: '14px 0', borderTop: '1px solid var(--rule)',
              alignItems: 'center',
            }}>
              <div style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                <img src={`https://picsum.photos/seed/${t.seed}/200/200`} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 18, letterSpacing: '-0.01em',
                }}>{t.name}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.12em', color: 'var(--fg-soft)',
                  textTransform: 'uppercase', marginTop: 4,
                }}>{t.role}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.08em', color: 'var(--fg-soft)', marginTop: 2,
                }}>{t.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 64 }} />
      <MobileMarquee text="◆ Since 2022 ◆ 4 seasons ◆ 1,047 photographers ◆ Bangkok · Chiang Mai ◆" />
      <MobileFooter />
    </div>
  );
}
