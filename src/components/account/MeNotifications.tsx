'use client';
import { useNotifications } from '@/hooks/useNotifications';
import { formatNotificationBody } from '@/lib/data/notifications';
import { TranslatedNotificationBody, TranslatedTimeAgo } from '@/components/layout/NotificationsBell';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function MeNotifications() {
  const router = useRouter();
  const t = useTranslations('Notifications');
  const { notifications, markRead, markAllRead } = useNotifications();

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
