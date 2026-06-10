'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import {
  getNextDrop,
  getDropStatus,
  isSubscribedToDrop,
  subscribeToDrop,
  unsubscribeFromDrop,
  type DropRow,
} from '@/lib/data/drops';
import { toast } from 'sonner';

// ===== Next Drop card — blurred unreleased preview + live countdown =====

function useDropCountdown(targetIso: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!targetIso) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetIso]);
  if (!targetIso || now === null) return null;
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    over: diff <= 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

function CountCell({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-serif tabular-nums leading-none text-[clamp(32px,4vw,42px)]">
        {String(n).padStart(2, '0')}
      </div>
      <div className="caps opacity-55 mt-2 text-[10px]">{label}</div>
    </div>
  );
}

interface NextDropCardProps {
  photographerId: string;
  onReleased?: () => void;
  previewDrop?: DropRow; // temp: design preview only
}

export function NextDropCard({ photographerId, onReleased, previewDrop }: NextDropCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser } = useApp();

  const [drop, setDrop] = useState<DropRow | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (previewDrop) { setDrop(previewDrop); return; }
    let cancelled = false;
    getNextDrop(photographerId).then((d) => { if (!cancelled) setDrop(d); });
    return () => { cancelled = true; };
  }, [photographerId, previewDrop]);

  useEffect(() => {
    if (!drop || !authUser?.id) { setSubscribed(false); return; }
    let cancelled = false;
    isSubscribedToDrop(drop.id, authUser.id).then((s) => { if (!cancelled) setSubscribed(s); });
    return () => { cancelled = true; };
  }, [drop, authUser?.id]);

  const countdown = useDropCountdown(drop?.scheduled_at ?? null);

  // Past scheduled_at the cron publishes within ~5 min — poll until released
  useEffect(() => {
    if (!drop || !countdown?.over) return;
    const poll = setInterval(async () => {
      const status = await getDropStatus(drop.id);
      if (status && status !== 'scheduled') {
        clearInterval(poll);
        setDrop(null);
        onReleased?.();
      }
    }, 20_000);
    return () => clearInterval(poll);
  }, [drop, countdown?.over, onReleased]);

  const onSubscribeClick = useCallback(async () => {
    if (!drop || busy) return;
    if (!authUser?.id) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }
    setBusy(true);
    if (subscribed) {
      const ok = await unsubscribeFromDrop(drop.id, authUser.id);
      if (ok) setSubscribed(false);
    } else {
      const ok = await subscribeToDrop(drop.id, authUser.id);
      if (ok) {
        setSubscribed(true);
        toast.success('จะแจ้งเตือนทันทีเมื่อภาพชุดนี้ถูกปล่อย');
      }
    }
    setBusy(false);
  }, [drop, busy, authUser?.id, subscribed, router, pathname]);

  if (!drop) return null;

  return (
    <section className="mb-10 md:mb-[64px]">
      {/* section header */}
      <div className="flex items-baseline justify-between mb-5">
        <div className="caps">
          <span className="opacity-35 mr-3">— 01</span>
          Next Drop
        </div>
        <div className="th text-[12px] tracking-[.08em] text-fg-soft hidden sm:block">
          ปล่อยของตามจังหวะของช่างภาพ
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border border-rule">
        {/* left — blurred preview */}
        <div className="relative overflow-hidden bg-black aspect-[4/3] md:aspect-auto md:min-h-[420px]">
          {drop.preview_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={drop.preview_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover blur-[26px] brightness-[.55] scale-[1.15]"
            />
          )}
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-white/90 text-[12px] font-medium uppercase tracking-[.6em] pl-[.6em]">
              Unreleased
            </span>
          </div>
        </div>

        {/* right — details + countdown */}
        <div className="p-7 md:p-[48px] flex flex-col justify-center">
          {drop.series_label && (
            <div className="text-gold text-[11px] uppercase tracking-widest font-medium mb-4">
              {drop.series_label}
            </div>
          )}
          <h3 className="font-serif italic font-normal m-0 leading-[1.1] text-[clamp(28px,3.5vw,44px)] tracking-[-0.01em]">
            {drop.title}
          </h3>
          {drop.description && (
            <p className="th text-[14px] leading-[1.7] text-fg-soft mt-4 mb-0 max-w-[44ch]">
              {drop.description}
            </p>
          )}

          <div className="grid grid-cols-4 gap-4 mt-8 max-w-[420px]">
            <CountCell n={countdown?.days ?? 0} label="Days" />
            <CountCell n={countdown?.hours ?? 0} label="Hours" />
            <CountCell n={countdown?.minutes ?? 0} label="Min" />
            <CountCell n={countdown?.seconds ?? 0} label="Sec" />
          </div>

          <div className="mt-9">
            {countdown?.over ? (
              <div className="th text-[13px] text-fg-soft">ถึงเวลาแล้ว — กำลังปล่อยภาพ…</div>
            ) : (
              <button
                onClick={onSubscribeClick}
                disabled={busy}
                className={`th inline-flex items-center gap-2 px-7 py-3 text-[13px] tracking-[.06em] bg-transparent cursor-pointer transition-colors border disabled:opacity-50 ${
                  subscribed
                    ? 'border-gold text-gold'
                    : 'border-fg text-fg hover:bg-gold hover:border-gold hover:text-black'
                }`}
              >
                {subscribed ? '✓ จะแจ้งเตือนเมื่อปล่อย' : 'แจ้งเตือนเมื่อปล่อย'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
