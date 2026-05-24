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
  const [tab, setTab] = useState('foryou');

  const pList = realPhotos.length > 0 ? realPhotos : PHOTOS;
  const photogList = realPhotographers.length > 0 ? realPhotographers : PHOTOGRAPHERS;

  const fresh = pList.slice().sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0)).slice(0, 4);

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

  const leaderboard = photogList
    .map(p => ({
      username: p.username,
      name: p.name,
      pulse: Math.round(pList.filter(ph => ph.by === p.username).reduce((s, ph) => s + (ph.pulse || pulseScore(ph)), 0)),
    }))
    .sort((a, b) => b.pulse - a.pulse)
    .slice(0, 5)
    .map((r, i) => ({ ...r, rank: i + 1, delta: ['+22', '+8', '+18', '+4', '−2'][i] }));

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />
      <FeedTabs active={tab} onChange={setTab} />

      {/* FEED — square photos */}
      <section style={{ paddingTop: 4 }}>
        {fresh.map(p => (
          <div key={p.id} style={{
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            paddingBottom: 4,
          }}>
            <FeedCard photo={p} />
          </div>
        ))}
      </section>

      {/* Season banner break */}
      <section style={{
        padding: '28px 16px',
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
        <h2 style={{
          margin: '12px 0 4px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>Ranked by pulse — not influence.</h2>
        <p style={{
          fontFamily: "'Noto Sans Thai', sans-serif",
          fontSize: 13, lineHeight: 1.6, color: 'var(--fg-soft)',
          margin: '8px auto 0', maxWidth: '32ch',
        }}>
          ภาพถ่ายเดินทางจากทั่วประเทศ จัดอันดับตามการมีส่วนร่วม
        </p>
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

      {/* LEADERBOARD */}
      <section style={{ padding: '40px 16px 0' }}>
        <MobileSectionHeader num="03 / Leaderboard" title="Pulse this week" />
        <table style={{
          width: '100%', borderCollapse: 'collapse', marginTop: 16,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          <tbody>
            {leaderboard.map(r => (
              <tr key={r.rank}
                onClick={() => router.push(`/photographer/${r.username}`)}
                style={{ borderBottom: '1px solid var(--rule)', cursor: 'pointer' }}>
                <td style={{ padding: '14px 0', width: 28, fontSize: 11, color: 'var(--fg-soft)' }}>
                  {String(r.rank).padStart(2, '0')}
                </td>
                <td style={{ padding: '14px 0', fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontSize: 13 }}>{r.pulse}</td>
                <td style={{ padding: '14px 0 14px 12px', textAlign: 'right', fontSize: 11, color: 'var(--fg-soft)', width: 44 }}>
                  {r.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={{ marginTop: 40 }}>
        <MobileMarquee text="★ Season 04 ★ 37 days left ★ Submit your frame ★" />
      </div>
      <MobileFooter />
    </div>
  );
}
