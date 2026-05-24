// @ts-nocheck
'use client';
import { useRouter } from 'next/navigation';
import { PHOTOS } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

const rewards = [
  { t: 'Print credit',     v: '฿800',  d: 'Toward a fine-art print of any winning frame' },
  { t: 'Travel cashback',  v: '5%',    d: 'On accommodation bookings via partner stays' },
  { t: 'Season tote',      v: 'Free',  d: 'Limited-run cotton tote for top 100 voters' },
];

const rules = [
  { n: '01', t: '1 like, 1 vote',  b: 'No anonymous accounts.' },
  { n: '02', t: 'Weight decays',    b: 'Likes in first 24h count 3×.' },
  { n: '03', t: 'No vote trading',  b: 'Detected rings get flagged.' },
  { n: '04', t: 'One season',       b: 'Pulse resets each cycle.' },
];

const steps = [
  { n: '01', t: 'Browse', b: 'Open Explore. Sort by Fresh or Hirest. Filter by category if you like.' },
  { n: '02', t: 'Pulse',  b: 'Tap the heart on frames that move you. Within 24h, your like counts more.' },
  { n: '03', t: 'Claim',  b: 'After Season close, top 100 voters get the season tote + ฿800 print credit.' },
];

export function MobileForCustomers() {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const coverPhoto = PHOTOS.find(p => p.id === 'p015') || PHOTOS[0];

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* Cover */}
      <div style={{ position: 'relative', width: '100%', height: 400, overflow: 'hidden', color: '#fff' }}>
        <img src={coverPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.78) 100%)' }} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 2 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 14 }}>— For Customers</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(34px, 9vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.02em', maxWidth: '16ch' }}>Vote with your eye. Get something back.</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, maxWidth: '32ch', marginTop: 12 }}>
            Your likes shape the season ranking — and earn rewards.
          </div>
        </div>
      </div>

      {/* Rewards */}
      <section style={{ padding: '40px 16px 0' }}>
        <MobileSectionHeader num="01 / Rewards" title="What you take home" />
        <div style={{ marginTop: 18, display: 'grid', gap: 0, border: '1px solid var(--rule-strong)' }}>
          {rewards.map((r, i, a) => (
            <div key={r.t} style={{
              padding: 18,
              borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 12,
            }}>
              <div>
                <h3 style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 22, letterSpacing: '-0.01em',
                }}>{r.t}</h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.55, color: 'var(--fg-soft)' }}>{r.d}</p>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 500 }}>{r.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules 2-col */}
      <section style={{ padding: '56px 0 0', background: dark ? '#131310' : 'var(--cream)' }}>
        <div style={{ padding: '40px 16px 0' }}>
          <MobileSectionHeader num="02 / Rules" title="Four lines, no asterisks" />
        </div>
        <div style={{
          margin: '20px 16px 40px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          border: '1px solid var(--rule-strong)',
        }}>
          {rules.map((r, i) => (
            <div key={r.n} style={{
              padding: 16,
              background: dark ? '#0a0a0a' : 'var(--bg)',
              borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 0,
              borderBottom: i < 2 ? '1px solid var(--rule)' : 0,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 500 }}>{r.n}</div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: 17, letterSpacing: '-0.01em', lineHeight: 1.2,
                marginTop: 8,
              }}>{r.t}</div>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fg-soft)', marginTop: 6 }}>{r.b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '56px 16px 0' }}>
        <MobileSectionHeader num="03 / Steps" title="Three taps to participate" />
        <div style={{ marginTop: 20 }}>
          {steps.map((s, i, a) => (
            <div key={s.n} style={{
              padding: '24px 0',
              borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
              display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 500 }}>{s.n}</div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 22, letterSpacing: '-0.01em',
                }}>{s.t}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-soft)' }}>{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '56px 16px', textAlign: 'center', background: '#000', color: '#fff', marginTop: 56 }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6,
        }}>Season 04</div>
        <h2 style={{
          margin: '14px 0 22px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>Start voting.</h2>
        <button onClick={() => router.push('/explore')} style={{
          width: '100%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 44, padding: '0 18px',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          background: '#fff', color: '#000', border: '1px solid #fff',
          cursor: 'pointer',
        }}>Open Explore</button>
      </section>

      <MobileMarquee text="★ Top 100 voters get a season tote ★ ฿800 print credit ★" />
      <MobileFooter />
    </div>
  );
}
