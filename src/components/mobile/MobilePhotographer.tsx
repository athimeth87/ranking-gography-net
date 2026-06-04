// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, pulseScore, voyageurUsernames } from '@/lib/data';
import { useApp } from '@/providers/AppProvider';
import { MobileFooter, BottomNav } from './MobileShared';

function ProfileTopBar({ username }: { username: string }) {
  const router = useRouter();
  const { theme, toggleSideMenu } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';
  const isVoyageur = voyageurUsernames.has(username);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: dark ? 'rgba(10,10,10,0.96)' : 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 52, padding: '0 14px',
    }}>
      <button onClick={() => router.back()} aria-label="Back" style={{
        width: 36, height: 36, background: 'transparent', border: 0, cursor: 'pointer',
        color: c, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          @{username}
        </span>
        {isVoyageur && (
          <span style={{
            width: 6, height: 6, background: '#b08e54',
            transform: 'rotate(45deg)', display: 'inline-block', marginLeft: 4,
          }} title="Traveller active" />
        )}
      </div>
      <button onClick={toggleSideMenu} aria-label="Menu" style={{
        width: 36, height: 36, background: 'transparent', border: 0, cursor: 'pointer',
        color: c, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="14" viewBox="0 0 22 14">
          <rect y="1"  width="22" height="1.6" fill={c} />
          <rect y="6"  width="22" height="1.6" fill={c} />
          <rect y="11" width="14" height="1.6" fill={c} />
        </svg>
      </button>
    </header>
  );
}

export function MobilePhotographer({ username }: { username: string }) {
  const router = useRouter();
  const { theme, authUser } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';
  const [tab, setTab] = useState<'grid' | 'curated' | 'seasons' | 'tagged'>('grid');

  const photographer = PHOTOGRAPHERS.find(p => p.username === username) || PHOTOGRAPHERS[0];
  const myPhotos = PHOTOS.filter(p => p.by === photographer.username);
  const isVoyageur = voyageurUsernames.has(photographer.username);
  const pulse = Math.round(myPhotos.reduce((s, p) => s + pulseScore(p), 0));
  const isOwn = authUser?.email && photographer.username === authUser.email.split('@')[0];

  const filtered = tab === 'curated'
    ? myPhotos.filter(p => p.picks?.includes('editor'))
    : myPhotos;
  const grid = filtered.length > 0
    ? filtered
    : myPhotos;

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <ProfileTopBar username={photographer.username} />

      {/* Cover banner */}
      <div style={{ position: 'relative', width: '100%', height: 160, background: 'var(--tile)' }}>
        {photographer.cover && (
          <img src={photographer.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 100%)',
        }} />
        {isVoyageur && (
          <div style={{
            position: 'absolute', left: 16, bottom: 12, zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#b08e54',
            background: 'rgba(0,0,0,0.5)',
            padding: '4px 8px',
            backdropFilter: 'blur(4px)',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
            Traveller · Season 01
          </div>
        )}
      </div>

      {/* Identity row: avatar overlapping + 3 stats */}
      <div style={{ padding: '0 16px 0', display: 'flex', alignItems: 'flex-end', gap: 22, marginTop: -42 }}>
        <div style={{
          width: 86, height: 86, borderRadius: '50%',
          background: 'var(--tile)',
          border: `3px solid ${dark ? '#0a0a0a' : '#fff'}`,
          overflow: 'hidden', flexShrink: 0,
        }}>
          {photographer.avatar && (
            <img src={photographer.avatar} alt={photographer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', paddingBottom: 6 }}>
          {[
            [String(myPhotos.length), 'frames'],
            [photographer.followers?.toLocaleString() || '0', 'followers'],
            [String(Math.floor((photographer.followers || 0) * 0.42)), 'following'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>{n}</div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                color: 'var(--fg-soft)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginTop: 2,
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {photographer.name}
          {isVoyageur && (
            <span style={{
              marginLeft: 6, verticalAlign: 'middle',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              color: '#b08e54',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500,
            }}>
              <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
              Traveller
            </span>
          )}
        </div>
        {photographer.bio && (
          <p style={{
            fontFamily: "'Noto Sans Thai', sans-serif",
            fontSize: 13, lineHeight: 1.55, margin: '6px 0 8px', maxWidth: '36ch',
          }}>{photographer.bio}</p>
        )}
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.04em', color: 'var(--fg-soft)' }}>
          gography.net/{photographer.username}<br />
          {photographer.loc}
        </div>
      </div>

      {/* Pulse dashboard banner */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          padding: '12px 14px',
          background: dark ? '#1a1916' : 'var(--tile)',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--rule)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l4-8 3 6 3-3" />
            </svg>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Pulse · {pulse}</div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                color: 'var(--fg-soft)', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginTop: 1,
              }}>
                ↑ 18% past 7 days
              </div>
            </div>
          </div>
          <svg width="64" height="20" viewBox="0 0 64 20" preserveAspectRatio="none">
            <polyline points="0,15 8,12 16,13 24,9 32,11 40,6 48,8 56,4 64,5"
              fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 8 }}>
        {isOwn ? (
          <Link href="/me" style={btnSolid(dark, true)}>Edit profile</Link>
        ) : (
          <button onClick={() => alert('Follow · Coming soon')} style={btnSolid(dark, true)}>Follow</button>
        )}
        <button onClick={() => {
          if (typeof navigator !== 'undefined' && (navigator as any).share) {
            (navigator as any).share({ title: photographer.name, url: window.location.href }).catch(() => {});
          }
        }} style={btnGhost(dark, true)}>Share</button>
        <button aria-label="Add" style={{ ...btnGhost(dark, false), width: 44, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21c1.2-3.5 3.8-5.5 7-5.5" />
            <path d="M19 11v6M16 14h6" />
          </svg>
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ height: 20 }} />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'var(--rule)'}`,
      }}>
        {([
          ['grid', <svg key="g" width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><rect x="0" y="0" width="6" height="6" /><rect x="7" y="0" width="6" height="6" /><rect x="14" y="0" width="6" height="6" /><rect x="0" y="7" width="6" height="6" /><rect x="7" y="7" width="6" height="6" /><rect x="14" y="7" width="6" height="6" /><rect x="0" y="14" width="6" height="6" /><rect x="7" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>],
          ['curated', <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8v3a4 4 0 1 1-8 0V4zM5 6h3M16 6h3M9 13v3h6v-3M8 20h8" /></svg>],
          ['seasons', <svg key="s" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>],
          ['tagged', <svg key="t" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="4" /><path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" /></svg>],
        ] as const).map(([id, icon]) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: '14px 0', background: 'transparent', cursor: 'pointer', border: 0,
              borderBottom: `2px solid ${on ? c : 'transparent'}`,
              color: on ? c : 'var(--fg-soft)',
              display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
            }}>{icon}</button>
          );
        })}
      </div>

      {/* 3-col edge-to-edge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {grid.map(p => {
          const curator = p.picks?.includes('editor');
          const photoVoyageur = voyageurUsernames.has(p.by);
          return (
            <div
              key={p.id}
              onClick={() => router.push(`/photo/${p.id}`)}
              style={{ position: 'relative', aspectRatio: '1 / 1', background: 'var(--tile)', cursor: 'pointer', overflow: 'hidden' }}
            >
              <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              {(curator || photoVoyageur) && (
                <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                  {curator && (
                    <div style={{
                      width: 18, height: 18, background: 'rgba(0,0,0,0.6)', color: '#fff',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 4h8v3a4 4 0 1 1-8 0V4zM9 13v3h6v-3" />
                      </svg>
                    </div>
                  )}
                  {photoVoyageur && (
                    <div style={{ width: 10, height: 10, background: '#b08e54', transform: 'rotate(45deg)', marginTop: 4 }} title="Traveller" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: 28 }} />
      <MobileFooter />
    </div>
  );
}

function btnSolid(dark: boolean, flex: boolean): React.CSSProperties {
  return {
    flex: flex ? 1 : undefined,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 44, padding: '0 18px',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
    letterSpacing: '0.04em', textTransform: 'uppercase',
    border: `1px solid ${dark ? '#fff' : '#000'}`,
    background: dark ? '#fff' : '#000',
    color: dark ? '#000' : '#fff',
    cursor: 'pointer', textDecoration: 'none',
  };
}

function btnGhost(dark: boolean, flex: boolean): React.CSSProperties {
  return {
    flex: flex ? 1 : undefined,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 44, padding: '0 18px',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
    letterSpacing: '0.04em', textTransform: 'uppercase',
    border: `1px solid ${dark ? '#fff' : '#000'}`,
    background: 'transparent',
    color: dark ? '#fff' : '#000',
    cursor: 'pointer',
  };
}
