// @ts-nocheck
'use client';
import { PHOTOS } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader, BottomNav } from './MobileShared';

const seasons = [
  { s: '04', y: '2026', winner: 'Anuwat Phon',       title: 'Mae Hong Son, blue hour', pulse: 1240, seed: 'maehongson-bluehour' },
  { s: '03', y: '2025', winner: 'Sirintra L.',       title: 'Phang Nga channels',       pulse: 1108, seed: 'phangnga-channels' },
  { s: '02', y: '2025', winner: 'Nuttachai Kirdsuk', title: 'Doi Inthanon dawn',        pulse: 982,  seed: 'doi-inthanon-dawn-win' },
  { s: '01', y: '2024', winner: 'Tul Manoonpong',    title: 'Bangkok last light',       pulse: 874,  seed: 'bangkok-last-light' },
];

const tiers = [
  { t: 'Voyageur III', p: '฿15,000', l: '8% cashback', tag: 'top tier' },
  { t: 'Voyageur II',  p: '฿8,000',  l: '5% cashback', tag: '' },
  { t: 'Voyageur I',   p: '฿3,000',  l: '3% cashback', tag: '' },
];

export function MobileHallOfFame() {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const coverPhoto = PHOTOS.find(p => p.id === 'p010') || PHOTOS[0];
  const winnerPhoto = PHOTOS.find(p => p.id === 'p010') || PHOTOS[0];

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
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.78) 100%)' }} />
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 2 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 14 }}>— Hall of Fame</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(34px, 9vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.02em', maxWidth: '16ch' }}>Four seasons. Four winners.</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, maxWidth: '32ch', marginTop: 12 }}>
            Highest pulse across all categories. One frame per season.
          </div>
        </div>
      </div>

      {/* Featured winner */}
      <section style={{ padding: '40px 16px 0' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.16em', color: 'var(--fg-soft)' }}>
          Season 04 · Reigning
        </div>
        <div style={{ marginTop: 14, aspectRatio: '4 / 5', background: 'var(--tile)', overflow: 'hidden' }}>
          <img src={winnerPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{
          margin: '24px 0 8px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 30, lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>"Mae Hong Son, <em style={{ fontStyle: 'italic' }}>blue hour</em>"</h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b08e54',
        }}>
          <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
          Anuwat Phon · Voyageur III
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-soft)', marginTop: 16, maxWidth: '40ch' }}>
          Shot at 5:47am in Pang Mapha district. Three nights of waiting for the fog to break through the valley.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          marginTop: 20, border: '1px solid var(--rule-strong)',
        }}>
          {[
            ['1,240', 'Pulse'],
            ['8,420', 'Likes'],
            ['142',   'Hours to peak'],
            ['◆',     'Curator pick'],
          ].map(([n, l], i) => (
            <div key={l} style={{
              padding: '16px 14px',
              borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 0,
              borderBottom: i < 2 ? '1px solid var(--rule)' : 0,
            }}>
              <span style={{
                fontFamily: n === '◆' ? "'Inter', sans-serif" : "'IBM Plex Mono', monospace",
                fontSize: 22, fontWeight: 500,
                letterSpacing: '-0.02em', lineHeight: 1, display: 'block',
                color: n === '◆' ? '#b08e54' : undefined,
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

      {/* Past winners */}
      <section style={{ padding: '56px 16px 0' }}>
        <MobileSectionHeader num="01 / Archive" title="Past winners" />
        <div style={{ marginTop: 18 }}>
          {seasons.slice(1).map((w, i, a) => (
            <article key={w.s} style={{
              padding: '20px 0',
              borderTop: '1px solid var(--rule)',
              borderBottom: i === a.length - 1 ? '1px solid var(--rule)' : 0,
              display: 'grid', gridTemplateColumns: '92px 1fr', gap: 14,
            }}>
              <div style={{ aspectRatio: '4 / 5', background: 'var(--tile)', overflow: 'hidden' }}>
                <img src={`https://picsum.photos/seed/${w.seed}/400/500`} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.16em', color: 'var(--fg-soft)', textTransform: 'uppercase',
                }}>Season {w.s} · {w.y}</div>
                <h3 style={{
                  margin: '4px 0 6px',
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 20, letterSpacing: '-0.01em', lineHeight: 1.15,
                }}>"{w.title}"</h3>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{w.winner}</div>
                <div style={{
                  marginTop: 8, fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  display: 'inline-block', padding: '4px 8px',
                  border: '1px solid var(--rule-strong)',
                }}>Pulse {w.pulse}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section style={{ padding: '56px 0 0', background: dark ? '#131310' : 'var(--cream)' }}>
        <div style={{ padding: '40px 16px 0' }}>
          <MobileSectionHeader num="02 / Tiers" title="Voyageur cashback" />
          <p style={{
            fontFamily: "'Noto Sans Thai', sans-serif",
            fontSize: 13, lineHeight: 1.6, color: 'var(--fg-soft)',
            marginTop: 12, maxWidth: '34ch',
          }}>
            ผู้เข้าร่วมที่ผ่านการคัดเลือกจะได้รับส่วนแบ่งจากค่าโฆษณาฤดูกาล
          </p>
        </div>
        <div style={{ padding: '20px 16px 40px', display: 'grid', gap: 12 }}>
          {tiers.map((t, i) => {
            const isTop = i === 0;
            return (
              <div key={t.t} style={{
                padding: 18,
                background: isTop ? '#000' : (dark ? '#0a0a0a' : 'var(--bg)'),
                color: isTop ? '#fff' : (dark ? '#fff' : '#000'),
                border: isTop ? '1px solid #000' : '1px solid var(--rule-strong)',
                position: 'relative',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b08e54',
                }}>
                  <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
                  {t.t}
                </div>
                <div style={{
                  marginTop: 14, fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em',
                }}>{t.p}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  marginTop: 4, opacity: isTop ? 0.6 : 0.55,
                }}>per season · {t.l}</div>
                {t.tag && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                    letterSpacing: '0.14em', padding: '3px 6px',
                    border: '1px solid #b08e54', color: '#b08e54',
                    textTransform: 'uppercase',
                  }}>{t.tag}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ height: 48 }} />
      <MobileMarquee text="◆ 4 seasons ◆ 4 winners ◆ ฿1.2M cashback paid ◆" />
      <MobileFooter />
      <BottomNav />
    </div>
  );
}
