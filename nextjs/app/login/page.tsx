'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS, AMBASSADORS, SEASONS, COMMENTS, pulseScore, findPhoto, findPhotographer, voyageurUsernames } from '@/lib/data';
import { PhotoCard, PhotoGrid } from '@/components/PhotoCard';
import { Footer } from '@/components/Footer';
import { VoyageurMark, CrownIcon, EditorIcon, RewardIcon, PickBadge } from '@/components/Icons';
import { PageCover } from '@/components/PageCover';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// ===== Ported from pages/search.jsx =====
// Search page — query input + filtered results

function PageSearch() {
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef();
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const photoResults = q ? PHOTOS.filter(p =>
    p.title.toLowerCase().includes(q.toLowerCase()) ||
    p.cat.toLowerCase().includes(q.toLowerCase()) ||
    p.caption.toLowerCase().includes(q.toLowerCase()) ||
    p.by.toLowerCase().includes(q.toLowerCase())
  ) : [];

  const photographerResults = q ? PHOTOGRAPHERS.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.username.toLowerCase().includes(q.toLowerCase()) ||
    p.loc.toLowerCase().includes(q.toLowerCase())
  ) : [];

  const suggestions = ['Patagonia', 'Doi Inthanon', 'Portrait', 'Leica', 'fog', 'Wattana', 'Black & White'];

  return (
    <div className="page-fade">
      <section style={{ padding: '64px 0' }}>
        <div className="wrap">
          <div className="caps" style={{ opacity: .55, marginBottom: 24 }}>Search</div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'baseline', borderBottom: '2px solid var(--fg)', paddingBottom: 16 }}>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ค้นหาภาพ ช่างภาพ หรือสถานที่"
              className="th"
              style={{
                flex: 1,
                background: 'transparent',
                border: 0, outline: 0,
                color: 'var(--fg)',
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 300,
                letterSpacing: '-.02em',
                fontFamily: 'var(--thai)',
              }}
            />
            <span className="mono" style={{ fontSize: 11, opacity: .55 }}>
              {q ? `${photoResults.length + photographerResults.length} results` : 'Type to search'}
            </span>
          </div>

          {!q && (
            <div style={{ marginTop: 48 }}>
              <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Suggested searches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => setQ(s)} className="btn btn-sm btn-ghost">{s}</button>
                ))}
              </div>

              <div style={{ marginTop: 64 }}>
                <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Trending photographers</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
                  {PHOTOGRAPHERS.slice(0, 4).map(p => (
                    <Link key={p.username} href={`/photographer/${p.username}`}>
                      <div style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                        <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                      <div className="caps" style={{ opacity: .55, marginTop: 4 }}>@{p.username}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {q && (
            <div style={{ marginTop: 48 }}>
              {photographerResults.length > 0 && (
                <div style={{ marginBottom: 64 }}>
                  <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Photographers · {photographerResults.length}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                    {photographerResults.map(p => (
                      <Link key={p.username} href={`/photographer/${p.username}`} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, border: '1px solid var(--rule)' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                          <div className="caps" style={{ opacity: .55, marginTop: 4 }}>{p.loc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {photoResults.length > 0 && (
                <div>
                  <div className="caps" style={{ opacity: .55, marginBottom: 20 }}>Photos · {photoResults.length}</div>
                  <PhotoGrid photos={photoResults} cols={3} />
                </div>
              )}
              {photoResults.length === 0 && photographerResults.length === 0 && (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                  <div className="th" style={{ fontSize: 32, fontWeight: 300 }}>ไม่พบผลลัพธ์สำหรับ "{q}"</div>
                  <p className="th" style={{ color: 'var(--fg-soft)', marginTop: 16 }}>ลองค้นหาด้วยคำอื่น หรือเลือกจากคำแนะนำด้านล่าง</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Login page — Google sign-in only (no input fields)
function PageLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Surface ?error=... from /auth/callback if OAuth bounced back failed.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const e = params.get('error');
    if (e) setError(e);
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL to .env.local');
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (signInError) {
        setError(signInError.message);
        setBusy(false);
      }
      // On success the browser is redirected by Supabase — no further code runs here.
    } catch (e) {
      setError(e?.message || 'Sign-in failed');
      setBusy(false);
    }
  };

  return (
    <div className="login-page page-fade">
      <div className="login-page-glow" aria-hidden="true" />
      <div className="login-card">
        <div className="login-logo-disc">
          <span className="login-logo-mark" />
        </div>
        <div className="login-brand">GOGRAPHY</div>
        <div className="login-tagline mono">Photo Awards · 2026</div>

        <h1 className="login-title th">
          Welcome <strong>back</strong>
        </h1>
        <p className="login-quote">
          <span className="login-quote-mark">&ldquo;</span>
          Where photographs <strong>breathe</strong> —<br />
          and travellers come <strong>home</strong>
          <span className="login-quote-mark closing">&rdquo;</span>
        </p>

        <button
          className="login-google"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          style={busy ? { opacity: 0.7, cursor: 'wait' } : undefined}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.79 2.73v2.27h2.9c1.7-1.57 2.69-3.88 2.69-6.64z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.27c-.81.54-1.83.87-3.05.87-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.99 8.99 0 009 0 9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          <span>{busy ? 'Redirecting…' : 'Continue with Google'}</span>
        </button>

        {error && (
          <p
            className="mono"
            style={{
              marginTop: 18,
              fontSize: 11,
              letterSpacing: '0.04em',
              color: 'rgba(255, 180, 140, 0.9)',
              maxWidth: 320,
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        )}

        <p className="login-legal mono">
          By signing in you agree to our{' '}
          <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}




// ===== Next.js page wrapper =====
export default function Page() { return <PageLogin />; }
