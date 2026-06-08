// @ts-nocheck
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PHOTOS, pulseScore, PHOTOGRAPHERS } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, MobileMarquee } from './MobileShared';

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

function Crown({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M2 8l4.2 3.4L12 4l5.8 7.4L22 8l-1.7 10.4H3.7L2 8z" />
    </svg>
  );
}

function ProBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 5px', borderRadius: 3, background: 'var(--fg)', color: 'var(--bg)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1, marginLeft: 6 }}>
      PRO
    </span>
  );
}

export function MobileHallOfFame({
  realSeasons = [],
  realAllPhotos = [],
  realPhotographers = [],
  photographersRanking = []
}: {
  realSeasons?: any[];
  realAllPhotos?: any[];
  realPhotographers?: any[];
  photographersRanking?: any[];
}) {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const inkBg = dark ? '#fff' : '#000';
  const inkFg = dark ? '#000' : '#fff';
  const tileBg = 'var(--tile)';
  const fgColor = 'var(--fg)';
  const bgRule = 'var(--rule)';

  const coverPhoto = realAllPhotos.find(p => p.id === 'p010') || PHOTOS.find(p => p.id === 'p010') || PHOTOS[0];

  const liveSeason = (realSeasons || []).find(s => s.status === 'live');
  const lbEndDate = liveSeason?.endDate || '2026-09-30';
  const countdown = useMobileCountdown(lbEndDate);

  const lookupName = (by) =>
    (realPhotographers.find(p => p.username === by) || PHOTOGRAPHERS.find(p => p.username === by))?.name || by;

  const resolvePhotographer = (username) => realPhotographers.find(p => p.username === username) || PHOTOGRAPHERS.find(p => p.username === username);

  const rankingEntries = useMemo(() => {
    return (photographersRanking || []).map(r => {
      const owner = resolvePhotographer(r.username);
      return {
        ...r,
        cover_url: r.cover_url || owner?.cover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        is_customer: owner?.isCustomer ?? false,
      };
    });
  }, [photographersRanking, realPhotographers]);

  const [lbTab, setLbTab] = useState('classic');

  const filteredRanking = useMemo(() => {
    return lbTab === 'classic'
      ? rankingEntries.filter(e => !e.is_customer)
      : rankingEntries.filter(e => e.is_customer);
  }, [lbTab, rankingEntries]);

  const top3 = filteredRanking.slice(0, 3);
  const pack = filteredRanking.slice(3, 10);

  const mono = "'IBM Plex Mono', monospace";
  const thai = "'Noto Sans Thai', sans-serif";
  const serif = "'Playfair Display', serif";

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--fg)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* Hero */}
      <div style={{ position: 'relative', width: '100%', height: '80vh', minHeight: 480, maxHeight: 640, overflow: 'hidden', color: '#fff', background: '#000' }}>
        <img src={coverPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.8 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.95) 100%)' }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          <span>GOGRAPHY</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />Live</span>
        </div>

        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 32, zIndex: 2 }}>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 16, color: '#22c55e', fontWeight: 700 }}>{liveSeason?.name || 'Season 1'}</div>
          <div style={{ fontWeight: 800, fontSize: 'clamp(46px, 15vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.03em', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>HALL OF<br/>FAME</div>
          <div style={{ fontFamily: thai, fontSize: 14, lineHeight: 1.55, opacity: 0.9, maxWidth: '34ch', marginTop: 18 }}>
            The best photographers.<br/>One global stage.
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700 }}>{countdown ? countdown.days : '—'}</div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>DAYS LEFT</div>
          </div>
        </div>
      </div>

      {/* Segmented Control */}
      <div style={{ position: 'sticky', top: 61, zIndex: 30, background: 'rgba(var(--bg-rgb), 0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--rule)', padding: '0 16px' }}>
        <div style={{ display: 'flex', width: '100%', height: 50 }}>
          <button onClick={() => setLbTab('classic')} style={{
            flex: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            background: 'transparent', color: lbTab === 'classic' ? 'var(--fg)' : 'var(--fg-soft)',
            borderBottom: lbTab === 'classic' ? '3px solid var(--fg)' : '3px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Classic
          </button>
          <button onClick={() => setLbTab('traveller')} style={{
            flex: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            background: 'transparent', color: lbTab === 'traveller' ? '#cd7f32' : 'var(--fg-soft)',
            borderBottom: lbTab === 'traveller' ? '3px solid #cd7f32' : '3px solid transparent',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Traveller <Crown size={12} />
          </button>
        </div>
      </div>

      {/* TOP 3 THIS SEASON */}
      <section style={{ padding: '32px 16px' }}>
        <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: fgColor, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          TOP 3 {lbTab === 'classic' ? 'CLASSIC' : 'TRAVELLER'}
        </div>

        {top3.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--rule)', borderRadius: 12, color: 'var(--fg-soft)', fontSize: 13, fontFamily: thai }}>
            ยังไม่มีช่างภาพที่ผ่านเกณฑ์ในหมวดหมู่นี้
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Rank 1 */}
            {top3[0] && (
              <Link href={`/photographer/${top3[0].username}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: tileBg, borderRadius: 16, border: '1px solid #eab308', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 24, position: 'relative' }}>
                  <div style={{ width: '100%', height: 140, background: bgRule, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
                    <img src={top3[0].cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 32, height: 32, background: '#eab308', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, border: '2px solid var(--bg)', zIndex: 2 }}>1</div>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--bg)', background: tileBg, overflow: 'hidden', marginTop: -40, position: 'relative', zIndex: 1 }}>
                    <img src={top3[0].avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + top3[0].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ color: '#eab308', marginTop: 8 }}><Crown size={20} color="#eab308" /></div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center' }}>
                    {top3[0].display_name} {top3[0].is_customer && <ProBadge />}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginTop: 12 }}>Pulse Score</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#eab308', marginTop: 2, fontFamily: mono }}>{top3[0].hof_score}</div>
                </div>
              </Link>
            )}

            {/* Rank 2 & 3 Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Rank 2 */}
              {top3[1] && (
                <Link href={`/photographer/${top3[1].username}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: tileBg, borderRadius: 12, border: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 16, position: 'relative' }}>
                    <div style={{ width: '100%', height: 90, background: bgRule, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}>
                      <img src={top3[1].cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, background: bgRule, color: fgColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, border: '1px solid var(--rule)', zIndex: 2 }}>2</div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--bg)', background: tileBg, overflow: 'hidden', marginTop: -28, position: 'relative', zIndex: 1 }}>
                      <img src={top3[1].avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + top3[1].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', padding: '0 8px', textAlign: 'center' }}>
                      {top3[1].display_name} {top3[1].is_customer && <ProBadge />}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginTop: 8 }}>Pulse Score</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: fgColor, marginTop: 2, fontFamily: mono }}>{top3[1].hof_score}</div>
                  </div>
                </Link>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <Link href={`/photographer/${top3[2].username}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: tileBg, borderRadius: 12, border: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 16, position: 'relative' }}>
                    <div style={{ width: '100%', height: 90, background: bgRule, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}>
                      <img src={top3[2].cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, background: '#cd7f32', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, border: '1px solid var(--rule)', zIndex: 2 }}>3</div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--bg)', background: tileBg, overflow: 'hidden', marginTop: -28, position: 'relative', zIndex: 1 }}>
                      <img src={top3[2].avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + top3[2].username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', padding: '0 8px', textAlign: 'center' }}>
                      {top3[2].display_name} {top3[2].is_customer && <ProBadge />}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginTop: 8 }}>Pulse Score</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: fgColor, marginTop: 2, fontFamily: mono }}>{top3[2].hof_score}</div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* RUNNER UPS (4-10) */}
      {pack.length > 0 && (
        <div style={{ padding: '0 16px 32px' }}>
          <div style={{ borderTop: '1px solid var(--rule)' }}>
            {pack.map((e, i) => (
              <Link key={e.photographer_id} href={`/photographer/${e.username}`} style={{
                display: 'grid', gridTemplateColumns: '26px 42px 1fr auto', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--rule)', color: 'inherit', textDecoration: 'none',
              }}>
                <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, textAlign: 'right', color: 'var(--fg-soft)', lineHeight: 1 }}>{String(i + 4).padStart(2, '0')}</span>
                <div style={{ width: 42, height: 42, background: 'var(--rule)', overflow: 'hidden', borderRadius: '50%' }}>
                  <img src={e.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + e.username} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {e.display_name} {e.is_customer && <ProBadge />}
                  </div>
                  <div style={{ fontFamily: thai, fontSize: 11, color: 'var(--fg-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 4 }}>@{e.username}</div>
                </div>
                <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 800, lineHeight: 1, color: '#eab308' }}>{e.hof_score}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* HALL OF FAME WALL */}
      <section style={{ padding: '32px 16px 48px', background: 'var(--cream)' }}>
        <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: fgColor, marginBottom: 6 }}>HALL OF FAME WALL</div>
        <p style={{ fontFamily: thai, fontSize: 13, color: 'var(--fg-soft)', marginBottom: 20 }}>Honoring the champions of each season.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {realSeasons.map((season, i) => {
            let topPhoto;
            let topName;
            let topPulse;
            if (season.status === 'live' && top3[0]) {
              topPhoto = top3[0].cover_url;
              topName = top3[0].display_name;
              topPulse = top3[0].hof_score;
            } else if (season.winners) {
              const w = season.winners['Landscape'] || Object.values(season.winners)[0];
              if (w) {
                const p = resolvePhoto(w.photoId);
                topPhoto = p?.src;
                topName = p?.by;
                topPulse = p?.pulse;
              }
            }

            return (
              <div key={season.id} style={{ position: 'relative', width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', background: tileBg, border: '1px solid var(--rule)' }}>
                <img src={topPhoto || coverPhoto.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%)' }} />
                
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>{season.name}</span>
                  {season.status === 'live' ? (
                    <span style={{ background: '#22c55e', color: '#fff', fontSize: 9, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>Live</span>
                  ) : (
                    <span style={{ background: '#eab308', color: '#fff', fontSize: 9, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>Winner</span>
                  )}
                </div>

                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#eab308', marginBottom: 6 }}>
                    <Crown size={14} color="#eab308" /> <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{topName || 'Winner'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>{season.range || 'N/A'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: mono }}>Pulse {topPulse?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            );
          })}

          {/* Empty state / Upload CTA */}
          {realSeasons.length <= 2 && (
            <div style={{ width: '100%', borderRadius: 12, background: tileBg, border: '1px solid var(--rule)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: bgRule, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Crown size={24} color="#eab308" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>Could your name<br />be next?</h3>
              <Link href="/upload" style={{ background: inkBg, color: inkFg, padding: '12px 24px', borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none', width: '100%' }}>
                Upload your photo
              </Link>
            </div>
          )}
        </div>
        
        {realSeasons.length === 1 && (
           <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--fg-soft)', fontFamily: thai }}>
             ฤดูกาลที่ 1 กำลังแข่งขันอยู่ 🏆 ตำนานคนแรกอาจเป็นคุณ
           </div>
        )}
      </section>

      <div style={{ height: 48, background: 'var(--cream)' }} />
      <MobileMarquee text="◆ Season 1 is live ◆ Be the first legend ◆" />
      <MobileFooter />
    </div>
  );
}
