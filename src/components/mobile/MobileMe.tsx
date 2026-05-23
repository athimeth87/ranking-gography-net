// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, pulseScore, voyageurUsernames } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileNav, MobileFooter, BottomNav } from './MobileShared';

const SECTIONS = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'photos',    label: 'Photos' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'stats',     label: 'Stats' },
  { id: 'settings',  label: 'Settings' },
] as const;

type SectionKey = typeof SECTIONS[number]['id'];

export function MobileMe({ section: initialSection = 'dashboard' }: { section?: string }) {
  const router = useRouter();
  const { theme, authUser, signOut } = useApp();
  const dark = theme === 'dark';
  const section = (SECTIONS.find(s => s.id === initialSection)?.id || 'dashboard') as SectionKey;

  // Treat first photographer as the "me" persona when signed in (mock until profile linking)
  const persona = PHOTOGRAPHERS[0];
  const myPhotos = PHOTOS.filter(p => p.by === persona.username);
  const isVoyageur = voyageurUsernames.has(persona.username);
  const totalLikes = myPhotos.reduce((s, p) => s + (p.likes || 0), 0);
  const totalFav = myPhotos.reduce((s, p) => s + (p.favorites || 0), 0);
  const totalPulse = Math.round(myPhotos.reduce((s, p) => s + pulseScore(p), 0));

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />

      {/* Header */}
      <section style={{ padding: '24px 16px 0' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', color: 'var(--fg-soft)', textTransform: 'uppercase',
        }}>Welcome back</div>
        <h1 style={{
          margin: '6px 0 0',
          fontFamily: "'Playfair Display', serif", fontWeight: 400,
          fontSize: 40, lineHeight: 1, letterSpacing: '-0.025em',
        }}>{authUser?.email?.split('@')[0] || persona.name.split(' ')[0]}</h1>
        {authUser?.email && (
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.1em', color: 'var(--fg-soft)', marginTop: 4,
          }}>{authUser.email}</div>
        )}
      </section>

      {/* Section tabs */}
      <div className="mobile-h-scroll" style={{ marginTop: 24 }}>
        {SECTIONS.map(s => {
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => router.push(s.id === 'dashboard' ? '/me' : `/me/${s.id}`)} style={{
              height: 36, padding: '0 14px',
              border: `1px solid ${active ? (dark ? '#fff' : '#000') : 'var(--rule-strong)'}`,
              background: active ? (dark ? '#fff' : '#000') : 'transparent',
              color: active ? (dark ? '#000' : '#fff') : (dark ? '#fff' : '#000'),
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', flex: '0 0 auto', whiteSpace: 'nowrap',
            }}>{s.label}</button>
          );
        })}
      </div>

      {section === 'dashboard' && (
        <>
          {/* Stats 2x2 */}
          <section style={{ padding: '24px 16px 0' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              border: '1px solid var(--rule-strong)',
            }}>
              {[
                [String(myPhotos.length), 'Photos'],
                [totalLikes.toLocaleString(), 'Likes'],
                [totalFav.toLocaleString(), 'Favorites'],
                [String(totalPulse), 'Pulse'],
              ].map(([n, l], i) => (
                <div key={l} style={{
                  padding: '16px 14px',
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

          {/* Voyageur banner */}
          {isVoyageur && (
            <section style={{ padding: '24px 16px 0' }}>
              <div style={{
                padding: 18,
                background: dark ? '#131310' : 'var(--cream)',
                border: '1px solid var(--rule)',
              }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b08e54',
                }}>
                  <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
                  Voyageur · Spring 2026
                </div>
                <div style={{
                  marginTop: 10,
                  fontFamily: "'Playfair Display', serif", fontWeight: 400,
                  fontSize: 20, letterSpacing: '-0.01em', lineHeight: 1.2,
                }}>คุณอยู่อันดับ <strong style={{ fontWeight: 600 }}>#7</strong> ในหมวด Landscape</div>
                <p style={{
                  fontFamily: "'Noto Sans Thai', sans-serif",
                  fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.6, marginTop: 8,
                }}>ส่งภาพอีก 5 ภาพในฤดูกาลนี้เพื่อขึ้น Top 5 · เหลือเวลา 42 วัน</p>
                <div style={{
                  marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  paddingTop: 14, borderTop: '1px solid var(--rule)',
                }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-soft)',
                  }}>Cashback tier</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, fontWeight: 500,
                    color: '#b08e54',
                  }}>5%</span>
                </div>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section style={{ padding: '32px 16px 0' }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--fg-soft)', marginBottom: 12,
            }}>Quick actions</div>
            <div style={{ display: 'grid', gap: 0, border: '1px solid var(--rule-strong)' }}>
              {[
                ['ส่งภาพใหม่',     'อัพได้วันละ 1 ภาพ',     () => alert('Submit · Coming soon')],
                ['โหวต & favorite', 'ค้นพบภาพใหม่',           () => router.push('/explore')],
                ['ดู Hall of Fame', 'ภาพแห่งฤดูกาลทั้งหมด',  () => router.push('/hall-of-fame')],
              ].map(([t, sub, onClick], i, a) => (
                <button key={t as string} onClick={onClick as any} style={{
                  padding: '16px 18px', textAlign: 'left',
                  background: 'transparent', border: 0,
                  borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
                  cursor: 'pointer', color: 'inherit',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-soft)', marginTop: 2 }}>{sub}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Recent photos */}
          {myPhotos.length > 0 && (
            <section style={{ padding: '32px 16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-soft)',
                }}>Your photos this season</div>
                <button onClick={() => router.push('/me/photos')} style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer',
                  borderBottom: '1px solid var(--rule)', paddingBottom: 2,
                }}>See all →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {myPhotos.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/photo/${p.id}`)}
                    style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {section === 'photos' && (
        <section style={{ padding: '24px 16px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {myPhotos.map(p => (
              <div
                key={p.id}
                onClick={() => router.push(`/photo/${p.id}`)}
                style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
              >
                <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'favorites' && (
        <section style={{ padding: '24px 16px 0' }}>
          <FavoritesList />
        </section>
      )}

      {section === 'stats' && (
        <section style={{ padding: '24px 16px 0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--fg-soft)', marginBottom: 12,
          }}>Engagement breakdown</div>
          <dl style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
            {[
              ['Photos posted', myPhotos.length],
              ['Total likes', totalLikes.toLocaleString()],
              ['Total favorites', totalFav.toLocaleString()],
              ['Total pulse', totalPulse],
              ['Avg pulse/photo', myPhotos.length ? Math.round(totalPulse / myPhotos.length) : 0],
              ["Editor's picks", myPhotos.filter(p => p.picks?.includes('editor')).length],
            ].map(([k, v]) => (
              <div key={k as string} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 0', borderTop: '1px solid var(--rule)',
              }}>
                <dt style={{ color: 'var(--fg-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</dt>
                <dd style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {section === 'settings' && (
        <section style={{ padding: '24px 16px 0' }}>
          <SettingsRow label="Email" value={authUser?.email || 'not signed in'} />
          <SettingsRow label="Display name" value={persona.name} />
          <SettingsRow label="Location" value={persona.loc} />
          <SettingsRow label="Voyageur status" value={isVoyageur ? 'Active' : '—'} />
          {authUser && (
            <button onClick={signOut} style={{
              width: '100%', marginTop: 32, minHeight: 44, padding: '0 18px',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              border: `1px solid ${dark ? '#fff' : '#000'}`, background: 'transparent',
              color: dark ? '#fff' : '#000', cursor: 'pointer',
            }}>Sign out</button>
          )}
        </section>
      )}

      <div style={{ height: 64 }} />
      <MobileFooter />
      <BottomNav active="profile" />
    </div>
  );
}

function FavoritesList() {
  const router = useRouter();
  // For now, show the same liked-set from localStorage (no DB filter).
  let likedIds: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const map = JSON.parse(localStorage.getItem('gpa-liked') || '{}');
      likedIds = Object.entries(map).filter(([, v]) => v).map(([k]) => k);
    } catch {}
  }
  const liked = PHOTOS.filter(p => likedIds.includes(p.id));
  if (liked.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-soft)' }}>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>ยังไม่มีภาพที่ถูกใจ</p>
        <button onClick={() => router.push('/explore')} style={{
          marginTop: 16, minHeight: 44, padding: '0 18px',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          border: '1px solid currentColor', background: 'transparent', color: 'inherit', cursor: 'pointer',
        }}>Open Explore</button>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {liked.map(p => (
        <div
          key={p.id}
          onClick={() => router.push(`/photo/${p.id}`)}
          style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
        >
          <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '14px 0', borderTop: '1px solid var(--rule)',
    }}>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-soft)',
      }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
