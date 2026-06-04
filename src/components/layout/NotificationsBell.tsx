'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { formatNotificationBody } from '@/lib/data/notifications';

import { useTranslations } from 'next-intl';

export function TranslatedTimeAgo({ iso }: { iso: string }) {
  const t = useTranslations('Notifications');
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return <>{s}{t('seconds_ago')}</>;
  const m = Math.floor(s / 60);
  if (m < 60) return <>{m}{t('minutes_ago')}</>;
  const h = Math.floor(m / 60);
  if (h < 24) return <>{h}{t('hours_ago')}</>;
  const d = Math.floor(h / 24);
  return <>{d}{t('days_ago')}</>;
}

export function TranslatedNotificationBody({ body }: { body: string }) {
  const t = useTranslations('Notifications');
  if (!body) return null;
  if (body.endsWith('liked your photo')) {
    const user = body.replace(' liked your photo', '');
    return <><span className="font-semibold">{user}</span> {t('liked_your_photo')}</>;
  }
  if (body.endsWith('favorited your photo')) {
    const user = body.replace(' favorited your photo', '');
    return <><span className="font-semibold">{user}</span> {t('favorited_your_photo')}</>;
  }
  if (body.endsWith('commented on your photo')) {
    const user = body.replace(' commented on your photo', '');
    return <><span className="font-semibold">{user}</span> {t('commented_on_your_photo')}</>;
  }
  if (body.endsWith('replied to your comment')) {
    const user = body.replace(' replied to your comment', '');
    return <><span className="font-semibold">{user}</span> {t('replied_to_your_comment')}</>;
  }
  if (body.endsWith('started following you')) {
    const user = body.replace(' started following you', '');
    return <><span className="font-semibold">{user}</span> {t('started_following_you')}</>;
  }

  // Fallbacks
  if (body === 'Someone liked your photo') return <>{t('someone_liked')}</>;
  if (body === 'Someone favorited your photo') return <>{t('someone_favorited')}</>;
  if (body === 'Someone commented on your photo') return <>{t('someone_commented')}</>;
  if (body === 'Someone replied to your comment') return <>{t('someone_replied')}</>;
  if (body === 'Someone started following you') return <>{t('someone_followed')}</>;

  return <>{body}</>;
}

export function NotificationsBell() {
  const router = useRouter();
  const t = useTranslations('Notifications');
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        className="nav-link nav-bell relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
          <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-fg text-bg text-[10px] mono leading-[16px] text-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed md:absolute left-0 right-0 md:left-auto md:right-0 top-[61px] md:top-[calc(100%+8px)] w-full md:w-[320px] h-[calc(100vh-61px)] md:h-auto bg-bg border-b border-rule md:border shadow-none z-50 flex flex-col md:block">
          <div className="flex justify-between items-center px-4 py-3 border-b border-rule">
            <span className="caps text-[11px] opacity-65">{t('title')}</span>
            <button
              className="text-[11px] uppercase tracking-[0.12em] opacity-65 hover:opacity-100 disabled:opacity-30"
              onClick={() => markAllRead()}
              disabled={unreadCount === 0}
            >
              {t('mark_all_read')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-none md:max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center opacity-50 text-[13px]">{t('no_notifications')}</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.related_url) router.push(n.related_url);
                  }}
                  className={`block w-full text-left px-4 py-3 border-b border-rule hover:bg-tile flex gap-3 items-start ${n.is_read ? 'opacity-60' : ''}`}
                >
                  {n.users?.avatar_url ? (
                    <img src={n.users.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-800" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-[13px] leading-[1.4]"><TranslatedNotificationBody body={formatNotificationBody(n)} /></div>
                    <div className="mono text-[10px] opacity-50 mt-1"><TranslatedTimeAgo iso={n.created_at} /></div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
