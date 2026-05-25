'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setBusy(true);
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase not configured');

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
      });
      if (signInError) throw signInError;
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed');
      setBusy(false);
    }
  }

  return (
    <div className="login-page page-fade">
      <div className="login-orb" aria-hidden />
      <div className="login-content">
        {/* Brand — logo image (includes wordmark) + tagline */}
        <div className="flex flex-col items-center gap-[14px] mb-[40px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.png"
            alt="Gography"
            className="w-[112px] h-[112px] object-contain"
          />
          <div className="mono text-[26px] md:text-[30px] tracking-[.42em] uppercase">
            Ranking
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={busy}
          className="login-btn"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
            <path fill="currentColor" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.79 2.73v2.27h2.9c1.7-1.57 2.69-3.88 2.69-6.64z"/>
            <path fill="currentColor" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.27c-.81.54-1.83.87-3.05.87-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z"/>
            <path fill="currentColor" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
            <path fill="currentColor" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.99 8.99 0 009 0 9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          <span>{busy ? 'Connecting…' : 'Sign in with Gmail'}</span>
        </button>

        {error && (
          <p className="mono text-[11px] mt-[14px] text-center opacity-75">
            {error}
          </p>
        )}

        <p className="mono mt-[28px] text-[10px] opacity-45 leading-[1.7] text-center tracking-[.14em]">
          BY SIGNING IN YOU AGREE TO OUR<br />
          <Link href="/terms" className="border-b border-current">TERMS</Link>{' '}AND{' '}
          <Link href="/privacy" className="border-b border-current">PRIVACY POLICY</Link>
        </p>
      </div>
    </div>
  );
}
