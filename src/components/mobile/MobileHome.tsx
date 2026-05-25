// @ts-nocheck
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PHOTOS, PHOTOGRAPHERS, pulseScore, voyageurUsernames } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import {
  MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader,
  FeedTabs, BottomNav, FeedCard,
} from './MobileShared';

export function MobileHome({ 
  realPhotos = [], 
  realPhotographers = [] 
}: { 
  realPhotos?: any[]; 
  realPhotographers?: any[];
}) {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const [tab, setTab] = useState('leaderboard');

  const pList = realPhotos.length > 0 ? realPhotos : PHOTOS;
  const photogList = realPhotographers.length > 0 ? realPhotographers : PHOTOGRAPHERS;

  const fresh = pList
    .slice()
    .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0))
    .slice(0, 12)
    .map(ph => {
      const photographer = photogList.find(p => p.username === ph.by);
      return {
        ...ph,
        photographerName: photographer?.name || ph.by,
        photographerAvatar: ph.avatarUrl || photographer?.avatar,
      };
    });

  const voyageurs = photogList
    .filter(p => p.isAmbassador || p.isCustomer)
    .slice(0, 4)
    .map(p => ({
      username: p.username,
      name: p.name,
      tier: p.isAmbassador ? 'Ambassador' : 'Voyageur',
      region: p.loc,
      cover: p.cover,
      pulse: Math.round(pList.filter(ph => ph.by === p.username).reduce((s, ph) => s + (ph.pulse || pulseScore(ph)), 0)),
    }));

  // Photo leaderboard — top photos by pulse, with photographer info for overlay
  const photoLeaderboard = pList
    .slice()
    .sort((a, b) => (b.pulse || pulseScore(b)) - (a.pulse || pulseScore(a)))
    .slice(0, 12)
    .map(ph => {
      const photographer = photogList.find(p => p.username === ph.by);
      return {
        ...ph,
        photographerName: photographer?.name || ph.by,
        photographerAvatar: ph.avatarUrl || photographer?.avatar,
        isAmbassador: photographer?.isAmbassador,
        isCustomer: photographer?.isCustomer,
      };
    });

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
      paddingBottom: 64,
    }}>
      <MobileNav />
      <FeedTabs active={tab} onChange={setTab} />

      {/* FEED — 2-col masonry with avatar/like overlay */}
      <section style={{ padding: '8px 6px 0' }}>
        <div style={{ columnCount: 2, columnGap: 8 }}>
          {fresh.map(p => {
            const aspect = p.w && p.h ? `${p.w} / ${p.h}` : '4 / 5';
            const likes = p.likes || 0;
            const likesLabel = likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes;
            return (
              <div
                key={p.id}
                onClick={() => router.push(`/photo/${p.slug || p.id}`)}
                style={{
                  position: 'relative', breakInside: 'avoid',
                  marginBottom: 8, cursor: 'pointer', overflow: 'hidden',
                  background: 'var(--tile)',
                }}
              >
                <div style={{ width: '100%', aspectRatio: aspect, overflow: 'hidden' }}>
                  <img
                    src={p.src}
                    alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
                <div style={{
                  position: 'absolute', inset: 'auto 0 0 0', height: 56,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.25), transparent)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', left: 10, bottom: 10,
                  display: 'flex', alignItems: 'center', gap: 7,
                  maxWidth: 'calc(100% - 70px)',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
                  }}>
                    {p.photographerAvatar && (
                      <img src={p.photographerAvatar} alt={p.by} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                      }} />
                    )}
                  </div>
                  <span style={{
                    color: '#fff', fontSize: 13, fontWeight: 500,
                    letterSpacing: '-0.005em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}>{p.by}</span>
                </div>
                <div style={{
                  position: 'absolute', right: 10, bottom: 10,
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: '#fff', fontSize: 13, fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{likesLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Season banner break — slim */}
      <section style={{
        padding: '12px 16px',
        background: dark ? '#131310' : 'var(--cream)',
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--rule)'}`,
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--rule)'}`,
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '0.18em', color: 'var(--fg-soft)', textTransform: 'uppercase',
        }}>
          Season 04 · 37 days left
        </div>
      </section>

      {/* Quick stats — 2x2 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid var(--rule)',
      }}>
        {[
          [String(pList.length).padStart(2, '0'), 'Frames'],
          [String(photogList.length).padStart(2, '0'), 'Photographers'],
          ['04', 'Seasons'],
          ['37', 'Days left'],
        ].map(([n, l], i) => (
          <div key={l} style={{
            padding: '20px 16px',
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

      {/* STEPS */}
      <section style={{ padding: '40px 16px 0' }}>
        <MobileSectionHeader num="01 / How it works" title="Three steps. One season." />
        <div style={{ marginTop: 20 }}>
          {[
            { n: '01', t: 'Submit your frame', b: 'Upload up to 12 photos per season. Tag location and category.' },
            { n: '02', t: 'Earn pulse',         b: 'Likes × 1, likes 24h × 3, curation bonus. Time-decayed.' },
            { n: '03', t: 'Win the season',     b: 'Highest pulse across all categories takes Season Winner.' },
          ].map((s, i, a) => (
            <div key={s.n} style={{
              padding: '20px 0',
              borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                letterSpacing: '0.16em', color: 'var(--fg-soft)',
              }}>STEP {s.n}</div>
              <h3 style={{
                margin: '8px 0 6px',
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: 22, letterSpacing: '-0.01em',
              }}>{s.t}</h3>
              <p style={{
                margin: 0, fontSize: 13, lineHeight: 1.55,
                color: 'var(--fg-soft)', maxWidth: '36ch',
              }}>{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VOYAGEURS — horizontal scroll */}
      <section style={{
        padding: '40px 0 0', marginTop: 40,
        background: dark ? '#131310' : 'var(--cream)',
      }}>
        <div style={{ padding: '32px 16px 0' }}>
          <MobileSectionHeader num="02 / Voyageurs" title="On the road this season" link="All" href="/photographers/voyageurs" />
        </div>
        <div style={{ 
          marginTop: 18, padding: '0 16px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 
        }}>
          {voyageurs.map((v) => (
            <article
              key={v.username}
              onClick={() => router.push(`/photographer/${v.username}`)}
              style={{
                width: '100%', background: dark ? '#0a0a0a' : 'var(--bg)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'var(--rule)'}`,
                padding: 12, cursor: 'pointer',
              }}
            >
              <div style={{ aspectRatio: '4 / 5', background: 'var(--tile)', overflow: 'hidden' }}>
                {v.cover && <img src={v.cover} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
              </div>
              <div style={{
                marginTop: 12,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#b08e54',
              }}>
                <span style={{ width: 5, height: 5, background: '#b08e54', transform: 'rotate(45deg)' }} />
                {v.tier}
              </div>
              <h3 style={{
                margin: '6px 0 2px',
                fontFamily: "'Playfair Display', serif", fontWeight: 700,
                fontSize: 15, letterSpacing: '-0.01em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>{v.name}</h3>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                letterSpacing: '0.1em', color: 'var(--fg-soft)', textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>{v.region}</div>
              <div style={{
                marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rule)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--fg-soft)',
                }}>Pulse</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{v.pulse}</span>
              </div>
            </article>
          ))}
        </div>
        <div style={{ padding: '0 16px 32px' }}>
          <Link href="/for-customers" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', minHeight: 44, padding: '0 18px',
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            border: `1px solid ${dark ? '#fff' : '#000'}`,
            background: 'transparent', color: dark ? '#fff' : '#000',
            textDecoration: 'none',
          }}>Become a Voyageur</Link>
        </div>
      </section>

      {/* LEADERBOARD — 2-col photo masonry */}
      <section style={{ padding: '40px 6px 16px' }}>
        <div style={{ padding: '0 10px' }}>
          <MobileSectionHeader num="03 / Leaderboard" title="Pulse this week" link="See all" href="/explore" />
        </div>
        <div style={{
          columnCount: 2, columnGap: 8, marginTop: 16,
        }}>
          {photoLeaderboard.map(p => {
            const aspect = p.w && p.h ? `${p.w} / ${p.h}` : '4 / 5';
            const likes = p.likes || 0;
            const likesLabel = likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes;
            return (
              <div
                key={p.id}
                onClick={() => router.push(`/photo/${p.slug || p.id}`)}
                style={{
                  position: 'relative', breakInside: 'avoid',
                  marginBottom: 8, cursor: 'pointer', overflow: 'hidden',
                  background: 'var(--tile)',
                }}
              >
                <div style={{ width: '100%', aspectRatio: aspect, overflow: 'hidden' }}>
                  <img
                    src={p.src}
                    alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
                {/* Bottom gradient for legibility */}
                <div style={{
                  position: 'absolute', inset: 'auto 0 0 0', height: 56,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.25), transparent)',
                  pointerEvents: 'none',
                }} />
                {/* Avatar + username — bottom-left */}
                <div style={{
                  position: 'absolute', left: 10, bottom: 10,
                  display: 'flex', alignItems: 'center', gap: 7,
                  maxWidth: 'calc(100% - 70px)',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    overflow: 'hidden', background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
                  }}>
                    {p.photographerAvatar && (
                      <img src={p.photographerAvatar} alt={p.by} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                      }} />
                    )}
                  </div>
                  <span style={{
                    color: '#fff', fontSize: 11, fontWeight: 500,
                    letterSpacing: '-0.005em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}>{p.by}</span>
                </div>
                {/* Heart + count — bottom-right */}
                <div style={{
                  position: 'absolute', right: 6, bottom: 6,
                  display: 'flex', alignItems: 'center', gap: 3,
                  color: '#fff', fontSize: 11, fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{likesLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ marginTop: 40 }}>
        <MobileMarquee text="★ Season 04 ★ 37 days left ★ Submit your frame ★" />
      </div>
      <MobileFooter />
    </div>
  );
}
