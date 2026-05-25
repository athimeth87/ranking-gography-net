// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function MobileLogin() {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const e = params.get('error');
    if (e) setError(e);
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError('Supabase not configured.');
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (signInError) {
        setError(signInError.message);
        setBusy(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed');
      setBusy(false);
    }
  };

  return (
    <div className="gpa-mobile" style={{
      minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
      padding: '64px 24px 32px',
    }}>
      {/* Logo disc */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: dark ? '#fff' : '#000',
          color: dark ? '#000' : '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 32,
        }}>G</div>
      </div>

      <div style={{
        fontFamily: "'Playfair Display', serif", fontWeight: 700,
        fontSize: 32, letterSpacing: '-0.02em', textAlign: 'center',
      }}>GOGRAPHY</div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        textAlign: 'center', opacity: 0.6, marginTop: 6,
      }}>Ranking · 2026</div>

      <h1 style={{
        margin: '40px 0 14px',
        fontFamily: "'Playfair Display', serif", fontWeight: 400,
        fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.01em',
        textAlign: 'center',
      }}>Welcome <em style={{ fontWeight: 700, fontStyle: 'italic' }}>back</em></h1>
      <p style={{
        fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
        fontSize: 17, lineHeight: 1.55, textAlign: 'center',
        color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
        margin: '0 0 40px', maxWidth: '28ch', alignSelf: 'center',
      }}>
        &ldquo;Where photographs <strong>breathe</strong> —<br />
        and travellers come <strong>home</strong>&rdquo;
      </p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          minHeight: 52, padding: '0 18px',
          fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
          letterSpacing: '0.02em',
          background: dark ? '#fff' : '#000',
          color: dark ? '#000' : '#fff',
          border: 0, cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.79 2.73v2.27h2.9c1.7-1.57 2.69-3.88 2.69-6.64z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.27c-.81.54-1.83.87-3.05.87-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.99 8.99 0 009 0 9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        <span>{busy ? 'Redirecting…' : 'Continue with Google'}</span>
      </button>

      {error && (
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.04em', marginTop: 16, textAlign: 'center',
          color: '#d97757', lineHeight: 1.6,
        }}>{error}</p>
      )}

      <p style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
        letterSpacing: '0.06em', marginTop: 32, textAlign: 'center',
        color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
        lineHeight: 1.7,
      }}>
        By signing in you agree to our<br />
        <a href="#" style={{ color: 'inherit' }}>Terms</a> and <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
      </p>
    </div>
  );
}
