// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { MobileFooter } from './MobileShared';
import { MeSettings } from '../account/MeSettings';

const SECTIONS = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'photos',    label: 'Photos' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'stats',     label: 'Stats' },
  { id: 'settings',  label: 'Settings' },
] as const;

type SectionKey = typeof SECTIONS[number]['id'];

export function MobileMe({ 
  section: initialSection = 'dashboard',
  profile,
  myPhotos = [],
  isVoyageur = false,
  favoritesCount = 0
}: any) {
  const router = useRouter();
  const { theme, authUser, signOut } = useApp();
  const dark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<SectionKey>(
    (SECTIONS.find(s => s.id === initialSection)?.id || 'dashboard') as SectionKey
  );

  const persona = {
    username: profile?.username || '',
    name: profile?.display_name || 'User',
    loc: profile?.location || '',
    avatar: profile?.avatar_url || '',
    cover: profile?.cover_url || profile?.avatar_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop',
  };

  const totalLikes = myPhotos.reduce((s: any, p: any) => s + (p.likes || 0), 0);
  const totalFav = myPhotos.reduce((s: any, p: any) => s + (p.favorites || 0), 0);
  const totalPulse = Math.round(myPhotos.reduce((s: any, p: any) => s + (p.pulse || 0), 0));

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* Cover banner */}
      {persona.cover && (
        <div style={{ position: 'relative', width: '100%', height: 160, background: 'var(--tile)' }}>
          <img src={persona.cover} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)',
          }} />
        </div>
      )}

      {/* Header */}
      <section style={{ padding: '0 16px 0', display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: persona.cover ? -32 : 24, position: 'relative', zIndex: 10 }}>
        {persona.avatar ? (
          <img src={persona.avatar} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${dark ? '#0a0a0a' : '#fff'}` }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${dark ? '#0a0a0a' : '#fff'}` }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        )}
        <div style={{ paddingBottom: 4 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.18em', color: 'var(--fg-soft)', textTransform: 'uppercase',
          }}>Welcome back</div>
          <h1 style={{
            margin: '6px 0 0',
            fontFamily: "'Playfair Display', serif", fontWeight: 400,
            fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px'
          }}>{persona.name || authUser?.email?.split('@')[0]}</h1>
        </div>
      </section>

      {/* Section tabs */}
      <div style={{ 
        marginTop: 24, 
        padding: '0 16px', 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 8 
      }}>
        {SECTIONS.map(s => {
          const active = activeTab === s.id;
          return (
            <button key={s.id} onClick={() => {
              setActiveTab(s.id as SectionKey);
              window.history.pushState(null, '', s.id === 'dashboard' ? '/me' : `/me/${s.id}`);
            }} style={{
              height: 36, padding: '0 16px', borderRadius: 4,
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

      {activeTab === 'dashboard' && (
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

      {activeTab === 'photos' && (
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

      {activeTab === 'favorites' && (
        <section style={{ padding: '24px 16px 0' }}>
          <div style={{ textAlign: 'center', color: 'var(--fg-soft)', padding: '40px 0' }}>
            <p>You have {favoritesCount} favorites.</p>
            <p className="text-xs mt-2">Mobile favorites view coming soon</p>
          </div>
        </section>
      )}

      {activeTab === 'stats' && (
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
              ['Rank Master', myPhotos.filter(p => p.picks?.includes('editor')).length],
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

      {activeTab === 'settings' && (
        <section style={{ padding: '24px 16px 0' }}>
          <MeSettings 
            persona={{
              id: profile?.id || '',
              username: profile?.username || '',
              name: profile?.display_name || '',
              avatar: profile?.avatar_url || '',
              loc: profile?.location || 'Not set',
              bio: profile?.bio || '',
              website: profile?.portfolio_url || '',
              isCustomer: profile?.is_customer
            } as any} 
            isVoyageur={isVoyageur} 
          />
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
