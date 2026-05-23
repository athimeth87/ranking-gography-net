'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { PageCover } from '@/components/layout/PageCover';

// ===== Login page (/login) =====
// Google OAuth UI (mock) — no real auth

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
    <div className="page-fade">
      <PageCover
        photoId="p004"
        eyebrow="Sign in"
        title={<>Sign in to vote<br />and save photos</>}
        subtitle="ใช้ Gmail เพื่อยืนยันตัวตน — 1 บัญชี = 1 คะแนน ต่อภาพ"
        height="44vh"
        minHeight={360}
        maxHeight={460}
      />
      <div className="grid place-items-center py-[80px]">
      <div className="max-w-[380px] w-full text-center px-[40px]">
        {/* Logo */}
        <div className="logo justify-center mb-[48px]">
          <span className="mark">G</span>
          <span>GOGRAPHY</span>
          <small>Photo Awards</small>
        </div>

        <h1 className="th text-[36px] font-normal tracking-[-.02em] m-0 leading-[1.2]">
          Sign in to vote<br />and save photos
        </h1>

        <p className="th mt-[16px] text-[14px] text-[var(--fg-soft)] leading-[1.7]">
          ใช้ Gmail เพื่อยืนยันตัวตน — 1 บัญชี = 1 คะแนน ต่อภาพ
        </p>

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          className="btn btn-solid w-full justify-center mt-[32px] py-[16px] px-[22px]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" className="mr-[4px]">
            <path fill="currentColor" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.79 2.73v2.27h2.9c1.7-1.57 2.69-3.88 2.69-6.64z"/>
            <path fill="currentColor" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.27c-.81.54-1.83.87-3.05.87-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z"/>
            <path fill="currentColor" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
            <path fill="currentColor" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.99 8.99 0 009 0 9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          Continue with Gmail
        </button>

        <p className="mono mt-[32px] text-[11px] opacity-55 leading-[1.7]">
          BY SIGNING IN YOU AGREE TO OUR<br />
          <a href="#" className="border-b border-current">TERMS</a>{' '}AND{' '}
          <a href="#" className="border-b border-current">PRIVACY POLICY</a>
        </p>
      </div>
      </div>
    </div>
  );
}
