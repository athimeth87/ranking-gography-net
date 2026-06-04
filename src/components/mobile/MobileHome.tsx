// @ts-nocheck
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PHOTOS, PHOTOGRAPHERS, pulseScore, voyageurUsernames } from '@/lib/data';
import { useTranslations } from 'next-intl';
import { useApp } from '@/providers/AppProvider';
import {
  MobileNav, MobileFooter, MobileMarquee, MobileSectionHeader,
  FeedTabs, BottomNav, FeedCard,
} from './MobileShared';
import { MasonryTile } from './MobileExplore';

export function MobileHome({ 
  realPhotos = [], 
  realPhotographers = [] 
}: { 
  realPhotos?: any[]; 
  realPhotographers?: any[];
}) {
  const router = useRouter();
  const { theme } = useApp();
  const t = useTranslations('MobileHome');
  const dark = theme === 'dark';
  const [tab, setTab] = useState('foryou');

  // Local follow set (TikTok-style) — persisted in localStorage
  const [following, setFollowing] = useState(() => new Set());
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('gpa-following') || '[]');
      if (Array.isArray(raw)) setFollowing(new Set(raw));
    } catch {}
  }, []);
  const toggleFollow = (username) => setFollowing(prev => {
    const next = new Set(prev);
    if (next.has(username)) next.delete(username); else next.add(username);
    try { localStorage.setItem('gpa-following', JSON.stringify([...next])); } catch {}
    return next;
  });

  const pList = realPhotos.length > 0 ? realPhotos : PHOTOS;
  const photogList = realPhotographers.length > 0 ? realPhotographers : PHOTOGRAPHERS;

  // For You — deterministic blend of pulse + recency + variety (TikTok-style FYP)
  const forYouFeed = useMemo(() => {
    const byDate = pList.slice().sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
    const recencyRank = new Map(byDate.map((p, i) => [p.id, byDate.length > 1 ? i / (byDate.length - 1) : 0]));
    const maxPulse = Math.max(1, ...pList.map(p => p.pulse || pulseScore(p)));
    const jitter = (s = '') => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
    const score = (p) =>
      (p.pulse || pulseScore(p)) / maxPulse * 0.5
      + (1 - (recencyRank.get(p.id) ?? 1)) * 0.35
      + jitter(p.id || p.title || '') * 0.15;
    return pList.slice().sort((a, b) => score(b) - score(a)).slice(0, 18);
  }, [pList]);

  // Following — photos only from creators you follow
  const followingFeed = useMemo(() => {
    if (following.size === 0) return [];
    return pList.filter(p => following.has(p.by))
      .slice()
      .sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
  }, [pList, following]);

  // Suggested creators for the empty Following state
  const suggestions = useMemo(() =>
    photogList
      .map(p => ({ ...p, totalPulse: Math.round(pList.filter(ph => ph.by === p.username).reduce((s, ph) => s + (ph.pulse || pulseScore(ph)), 0)) }))
      .filter(p => !following.has(p.username))
      .sort((a, b) => b.totalPulse - a.totalPulse)
      .slice(0, 8),
  [photogList, pList, following]);

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

      {/* FEED — For You / Following */}
      <section style={{ padding: '8px 6px 0' }}>
        {tab === 'following' && followingFeed.length === 0 ? (
          <div style={{ padding: '36px 16px 8px' }}>
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <div style={{ fontSize: 23, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 6 }}>Build your Following feed</div>
              <p style={{ fontSize: 14, color: 'var(--fg-soft)', margin: 0 }}>เลือกช่างภาพที่อยากติดตาม</p>
            </div>
            <div>
              {suggestions.map(s => (
                <div key={s.username} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: '1px solid var(--rule)',
                }}>
                  <div
                    onClick={() => router.push(`/photographer/${s.username}`)}
                    style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', background: 'var(--tile)', cursor: 'pointer' }}
                  >
                    {s.avatar && <img src={s.avatar} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
                  </div>
                  <div onClick={() => router.push(`/photographer/${s.username}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}{(s.isAmbassador || s.isCustomer) && <span style={{ marginLeft: 6, color: '#b08e54' }}>◆</span>}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginTop: 2 }}>
                      {s.loc || 'Photographer'} · Pulse {s.totalPulse}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFollow(s.username)}
                    style={{
                      flexShrink: 0, minHeight: 36, padding: '0 18px', cursor: 'pointer',
                      background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', border: 0,
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}
                  >Follow</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ columnCount: 2, columnGap: 8 }}>
            {(tab === 'following' ? followingFeed : forYouFeed).map(p => (
              <MasonryTile key={p.id} photo={p} />
            ))}
          </div>
        )}
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
          {t('season_banner')}
        </div>
      </section>

      {/* Quick stats — 2x2 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid var(--rule)',
      }}>
        {[
          [String(pList.length).padStart(2, '0'), t('stats_frames')],
          [String(photogList.length).padStart(2, '0'), t('stats_photographers')],
          ['04', t('stats_seasons')],
          ['37', t('stats_days_left')],
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
        <MobileSectionHeader num={`01 / ${t('how_it_works_num')}`} title={t('how_it_works_title')} />
        <div style={{ marginTop: 20 }}>
          {[
            { n: '01', t: t('step1_title'), b: t('step1_desc') },
            { n: '02', t: t('step2_title'), b: t('step2_desc') },
            { n: '03', t: t('step3_title'), b: t('step3_desc') },
          ].map((s, i, a) => (
            <div key={s.n} style={{
              padding: '20px 0',
              borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                letterSpacing: '0.16em', color: 'var(--fg-soft)',
              }}>{t('step')} {s.n}</div>
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
          <MobileSectionHeader num={`02 / ${t('voyageurs_num')}`} title={t('voyageurs_title')} link={t('all')} href="/photographers/voyageurs" />
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
                }}>{t('pulse')}</span>
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
          }}>{t('become_voyageur')}</Link>
        </div>
      </section>

      {/* LEADERBOARD — 2-col photo masonry */}
      <section style={{ padding: '40px 6px 16px' }}>
        <div style={{ padding: '0 10px' }}>
          <MobileSectionHeader num={`03 / ${t('leaderboard_num')}`} title={t('leaderboard_title')} link={t('see_all')} href="/explore" />
        </div>
        <div style={{
          columnCount: 2, columnGap: 8, marginTop: 16,
        }}>
          {photoLeaderboard.map(p => (
            <MasonryTile key={p.id} photo={p} />
          ))}
        </div>
      </section>

      <div style={{ marginTop: 40 }}>
        <MobileMarquee text="★ Season 04 ★ 37 days left ★ Submit your frame ★" />
      </div>
      <MobileFooter />
    </div>
  );
}
