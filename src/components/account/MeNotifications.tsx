'use client';
import { useNotifications } from '@/hooks/useNotifications';
import { formatNotificationBody } from '@/lib/data/notifications';
import { TranslatedNotificationBody, TranslatedTimeAgo } from '@/components/layout/NotificationsBell';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function MeNotifications({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const t = useTranslations('Notifications');
  const { notifications, markRead, markAllRead } = useNotifications();

  if (mobile) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px 12px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-soft)' }}>
            {t('title')}
          </span>
          {notifications.length > 0 && (
            <button onClick={() => markAllRead()} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-soft)', background: 'transparent', border: 0, cursor: 'pointer', borderBottom: '1px solid var(--rule)', paddingBottom: 2 }}>
              {t('mark_all_read')}
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--fg-soft)', fontFamily: "'Noto Sans Thai', sans-serif", fontSize: 14 }}>{t('no_notifications')}</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); if (n.related_url) router.push(n.related_url); }}
                style={{ width: '100%', textAlign: 'left', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', opacity: n.is_read ? 0.55 : 1, color: 'inherit' }}
              >
                {n.users?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.users.avatar_url} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--tile)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.5, fontFamily: "'Noto Sans Thai', sans-serif" }}><TranslatedNotificationBody body={formatNotificationBody(n)} /></div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, opacity: 0.45, marginTop: 5, letterSpacing: '0.05em' }}><TranslatedTimeAgo iso={n.created_at} /></div>
                </div>
                {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--fg)', flexShrink: 0, marginTop: 6 }} />}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-baseline mb-[14px]">
        <div>
          <div className="caps opacity-55">Account</div>
          <h1 className="th text-[36px] md:text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">{t('title')}</h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllRead()}
            className="caps text-[12px] opacity-65 hover:opacity-100 border-b border-rule pb-[2px] cursor-pointer"
          >
            {t('mark_all_read')}
          </button>
        )}
      </div>

      <div className="border border-rule bg-cream">
        {notifications.length === 0 ? (
          <div className="px-6 py-[120px] text-center text-fg-soft th">{t('no_notifications')}</div>
        ) : (
          <div className="divide-y divide-rule">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.related_url) router.push(n.related_url);
                }}
                className={`w-full text-left px-6 py-5 hover:bg-tile flex gap-4 items-start cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : ''}`}
              >
                {n.users?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.users.avatar_url} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shrink-0 border border-neutral-800" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neutral-900 border border-neutral-800 shrink-0" />
                )}
                <div className="flex-1 mt-1">
                  <div className="text-[14px] md:text-[15px] leading-[1.5] th"><TranslatedNotificationBody body={formatNotificationBody(n)} /></div>
                  <div className="mono text-[11px] opacity-50 mt-[6px] tracking-[0.05em]"><TranslatedTimeAgo iso={n.created_at} /></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
