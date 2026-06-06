// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PHOTOS, pulseScore, PHOTOGRAPHERS } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader } from './MobileShared';
import { MasonryTile } from './MobileExplore';

const LB_TABS = [
  { id: 'all', label: 'All' },
  { id: 'voyageurs', label: 'Voy', voyageur: true },
  { id: 'Landscape', label: 'Land' },
  { id: 'Portrait', label: 'Port' },
  { id: 'BW', label: 'B&W' },
];
const LB_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatCloseShort(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${LB_MONTHS[m - 1]} ${y}`;
}

function useMobileCountdown(endIso) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (now === null || !endIso) return null;
  const end = new Date(`${endIso}T23:59:59`).getTime();
  const diff = Math.max(0, end - now);
  return {
    over: diff <= 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

const tiers = [
  { t: 'Traveller III', p: '฿15,000', l: '8% cashback', tag: 'top tier' },
  { t: 'Traveller II',  p: '฿8,000',  l: '5% cashback', tag: '' },
  { t: 'Traveller I',   p: '฿3,000',  l: '3% cashback', tag: '' },
];

export function MobileHallOfFame({
  realSeasons = [],
  realAllPhotos = [],
  realPhotographers = []
}: {
  realSeasons?: any[];
  realAllPhotos?: any[];
  realPhotographers?: any[];
}) {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const inkBg = dark ? '#fff' : '#000';
  const inkFg = dark ? '#000' : '#fff';

  const coverPhoto = realAllPhotos.find(p => p.id === 'p010') || PHOTOS.find(p => p.id === 'p010') || PHOTOS[0];

  // ── Live leaderboard (gamification) ──────────────────────────────────────
  const [lbTab, setLbTab] = useState('all');
  const liveSeason = (realSeasons || []).find(s => s.status === 'live');
  const lbEndDate = liveSeason?.endDate || '2026-09-30';
  const countdown = useMobileCountdown(lbEndDate);

  const voyageurSet = new Set([
    ...(realPhotographers || []).filter(p => p.isCustomer).map(p => p.username),
    ...PHOTOGRAPHERS.filter(p => p.isCustomer).map(p => p.username),
  ]);
  const isVoyageurPhoto = (p) => p.voyageurOnly || voyageurSet.has(p.by);

  const lbSource = (realAllPhotos && realAllPhotos.length > 0 ? realAllPhotos : PHOTOS).slice();
  const lbRanked = lbSource.sort((a, b) => (b.pulse ?? pulseScore(b)) - (a.pulse ?? pulseScore(a)));
  const lbFiltered = lbTab === 'all' ? lbRanked
    : lbTab === 'voyageurs' ? lbRanked.filter(isVoyageurPhoto)
    : lbRanked.filter(p => p.cat === lbTab);
  const lbRows = lbFiltered
    .slice(0, 10)
    .map((p, i) => ({ ...p, lbRank: i + 1 }));
  const lbRest = lbRows.slice(3);
  const seasonTotalDays = 122; // ~4 months
  const seasonPct = countdown ? Math.max(0, Math.min(100, Math.round((seasonTotalDays - countdown.days) / seasonTotalDays * 100))) : 0;
  const rarityCount = (realSeasons || [])
    .filter(s => s.status === 'closed' && s.winners)
    .reduce((n, s) => n + Object.keys(s.winners).length, 0);

  const lookupName = (by) =>
    (realPhotographers.find(p => p.username === by) || PHOTOGRAPHERS.find(p => p.username === by))?.name || by;

  const mono = "'IBM Plex Mono', monospace";
  const thai = "'Noto Sans Thai', sans-serif";
  const serif = "'Playfair Display', serif";

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
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 14 }}>Hall of Fame</div>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 'clamp(34px, 9vw, 56px)', lineHeight: 1.02, letterSpacing: '-0.02em', maxWidth: '16ch' }}>Season 1 begins.</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, maxWidth: '32ch', marginTop: 12 }}>
            Highest pulse wins. Be the first name in the Hall of Fame.
          </div>
        </div>
      </div>

      {/* ═══ Season Standings — iOS editorial ═══ */}
      <section style={{ paddingTop: 28 }}>
        {/* hero */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--fg-soft)' }}>Season Standings</div>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 'clamp(34px, 10vw, 52px)', lineHeight: 0.98, letterSpacing: '-0.02em', marginTop: 12 }}>{liveSeason?.name || 'This Season'}</div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 64, fontWeight: 500, lineHeight: 0.8 }}>{countdown ? countdown.days : '—'}</span>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-soft)' }}>days left</div>
                <div style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--fg-soft)', marginTop: 3, opacity: 0.7 }}>
                  {countdown && !countdown.over ? `${countdown.hours}h ${countdown.minutes}m` : ' '}
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 11px', border: '1px solid var(--fg)', fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />Live
            </div>
          </div>

          {/* season progress */}
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 4, background: 'var(--rule)', overflow: 'hidden' }}>
              <div style={{ height: 4, width: `${seasonPct}%`, background: 'var(--fg)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-soft)' }}>
              <span>closes {formatCloseShort(lbEndDate)}</span>
              <span>{seasonPct}%</span>
            </div>
          </div>
        </div>

        {/* divider */}
        <div style={{ height: 1, background: 'var(--rule-strong)', marginTop: 28 }} />

        {/* sticky segmented control (iOS) */}
        <div style={{ position: 'sticky', top: 61, zIndex: 30, background: dark ? '#0a0a0a' : '#fff', borderBottom: '1px solid var(--rule)', padding: '10px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: `1px solid ${inkBg}` }}>
            {LB_TABS.map((t, i) => {
              const active = lbTab === t.id;
              return (
                <button key={t.id} onClick={() => setLbTab(t.id)} aria-label={t.voyageur ? 'Voyageurs' : t.label} style={{
                  height: 40, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: active ? inkBg : 'transparent',
                  color: active ? inkFg : 'var(--fg-soft)',
                  borderLeft: i === 0 ? 'none' : `1px solid ${inkBg}`,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {t.voyageur ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#b08e54" aria-hidden="true"><path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" /></svg>
                  ) : t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* #1 — featured */}
        {lbRows[0] && (
          <Link href={`/photo/${lbRows[0].id}`} style={{ display: 'block', padding: '22px 16px 0', color: 'inherit', textDecoration: 'none' }}>
            <div style={{ position: 'relative', width: '100%', height: 240, background: 'var(--tile)', overflow: 'hidden', border: '1px solid var(--fg)' }}>
              <img src={lbRows[0].src} alt={lbRows[0].title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--fg)', padding: '6px 11px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" /></svg>
                <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>01</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{lbRows[0].title}</div>
                <div style={{ fontFamily: thai, fontSize: 13, color: 'var(--fg-soft)', marginTop: 4 }}>{lookupName(lbRows[0].by)}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{lbRows[0].pulse ?? pulseScore(lbRows[0])}</div>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginTop: 4 }}>Pulse</div>
              </div>
            </div>
          </Link>
        )}

        {/* #2 / #3 */}
        {(lbRows[1] || lbRows[2]) && (
          <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[lbRows[1], lbRows[2]].filter(Boolean).map((p) => (
              <Link key={p.id} href={`/photo/${p.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <div style={{ position: 'relative', width: '100%', height: 150, background: 'var(--tile)', overflow: 'hidden', border: '1px solid var(--rule-strong)' }}>
                  <img src={p.src} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--fg)', padding: '3px 8px', fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{String(p.lbRank).padStart(2, '0')}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: thai, fontSize: 12, color: 'var(--fg-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lookupName(p.by)}</span>
                  <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>{p.pulse ?? pulseScore(p)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* the chasing pack — 4 to 10 */}
        {lbRest.length > 0 && (
          <div style={{ padding: '24px 16px 0' }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginBottom: 8 }}>The chasing pack</div>
            <div style={{ borderTop: '1px solid var(--rule-strong)' }}>
              {lbRest.map((p) => (
                <Link key={p.id} href={`/photo/${p.id}`} style={{
                  display: 'grid', gridTemplateColumns: '26px 46px 1fr auto', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--rule)', color: 'inherit', textDecoration: 'none',
                }}>
                  <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 16, fontWeight: 700, textAlign: 'right', color: 'var(--fg-soft)', lineHeight: 1 }}>{String(p.lbRank).padStart(2, '0')}</span>
                  <div style={{ width: 46, height: 58, background: 'var(--tile)', overflow: 'hidden' }}>
                    <img src={p.src} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ fontFamily: thai, fontSize: 12, color: 'var(--fg-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{lookupName(p.by)}</div>
                  </div>
                  <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 17, fontWeight: 700, lineHeight: 1 }}>{p.pulse ?? pulseScore(p)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* submit CTA + rarity */}
        <div style={{ padding: '26px 16px 0' }}>
          <Link href="/upload" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            height: 56, background: inkBg, color: inkFg,
            fontFamily: thai, fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>ส่งภาพเพื่อติดอันดับ <span style={{ fontFamily: mono }}>→</span></Link>
          <div style={{ fontFamily: thai, fontSize: 12, color: 'var(--fg-soft)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            {rarityCount > 0
              ? <>มีเพียง <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums' }}>{rarityCount}</span> ภาพเท่านั้น ที่เคยได้ขึ้น Hall of Fame</>
              : <>ยังไม่มีใครได้ขึ้น Hall of Fame — จงเป็นภาพแรกของประวัติศาสตร์</>}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section style={{ padding: '40px 0 0', background: dark ? '#131310' : 'var(--cream)', marginTop: 40 }}>
        <div style={{ padding: '16px 16px 0' }}>
          <MobileSectionHeader num="02 / Tiers" title="Traveller cashback" />
          <p style={{
            fontFamily: thai,
            fontSize: 13, lineHeight: 1.55, color: 'var(--fg-soft)',
            marginTop: 6, maxWidth: '34ch',
          }}>
            ผู้เข้าร่วมที่ผ่านการคัดเลือกจะได้รับส่วนแบ่งจากค่าโฆษณาฤดูกาล
          </p>
        </div>
        <div style={{ padding: '12px 16px 32px', display: 'grid', gap: 10 }}>
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
                  fontFamily: mono, fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b08e54',
                }}>
                  <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
                  {t.t}
                </div>
                <div style={{
                  marginTop: 14, fontFamily: mono,
                  fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em',
                }}>{t.p}</div>
                <div style={{
                  fontFamily: mono, fontSize: 11,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  marginTop: 4, opacity: isTop ? 0.6 : 0.55,
                }}>per season · {t.l}</div>
                {t.tag && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    fontFamily: mono, fontSize: 9,
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

      {/* Gallery — masonry */}
      <section style={{ padding: '56px 16px 0' }}>
        <MobileSectionHeader num="03 / Gallery" title="This season's frames" />
      </section>
      <div style={{ padding: '16px 6px 0' }}>
        <div style={{ columnCount: 3, columnGap: 6 }}>
          {(realAllPhotos.length > 0 ? realAllPhotos : PHOTOS).slice().sort((a, b) => pulseScore(b) - pulseScore(a)).slice(0, 18).map((p) => (
            <MasonryTile key={p.id} photo={p} />
          ))}
        </div>
      </div>

      <div style={{ height: 48 }} />
      <MobileMarquee text="◆ Season 1 is live ◆ Be the first legend ◆ 50,000 THB per category ◆" />
      <MobileFooter />
    </div>
  );
}
