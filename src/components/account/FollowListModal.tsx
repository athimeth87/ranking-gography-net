'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Dialog, DialogPortal, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import { getFollowers, getFollowing, type FollowUser } from '@/lib/data/follows';
import { VoyageurMark, CrownIcon } from '@/components/icons';

export type FollowTab = 'followers' | 'following';

interface FollowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  initialTab: FollowTab;
  followersCount: number;
  followingCount: number;
}

export function FollowListModal({
  open, onOpenChange, userId, username, initialTab, followersCount, followingCount,
}: FollowListModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<FollowTab>(initialTab);
  const [lists, setLists] = useState<Record<FollowTab, FollowUser[] | null>>({ followers: null, following: null });

  // Fresh start each time the sheet opens
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setLists({ followers: null, following: null });
    }
  }, [open, initialTab]);

  // Load only the active tab's list, and only if it hasn't been fetched yet
  useEffect(() => {
    if (!open || !userId || lists[tab] !== null) return;
    let cancelled = false;
    const fetcher = tab === 'followers' ? getFollowers : getFollowing;
    fetcher(userId).then((list) => {
      if (!cancelled) setLists((prev) => ({ ...prev, [tab]: list }));
    });
    return () => { cancelled = true; };
  }, [open, userId, tab, lists]);

  const users = lists[tab] ?? [];
  const loading = open && lists[tab] === null;

  const go = (uname: string) => {
    onOpenChange(false);
    router.push(`/photographer/${uname}`);
  };

  const TABS: { id: FollowTab; label: string; count: number }[] = [
    { id: 'followers', label: 'Followers', count: followersCount },
    { id: 'following', label: 'Following', count: followingCount },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[120] bg-black/40 supports-backdrop-filter:backdrop-blur-[2px]" />
        <DialogPrimitive.Popup
          className="ios-card fixed z-[130] flex flex-col overflow-hidden outline-none
            inset-x-0 bottom-0 max-h-[88dvh] rounded-b-none
            sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[430px] sm:max-h-[80dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-b-[18px]
            duration-[440ms] ease-[cubic-bezier(.32,.72,0,1)]
            data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-[100%]
            sm:data-open:slide-in-from-bottom-2 sm:data-open:zoom-in-95
            data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-[100%]
            sm:data-closed:slide-out-to-bottom-2 sm:data-closed:zoom-out-95"
        >
          {/* Grab handle (mobile sheet) */}
          <div className="sm:hidden flex justify-center pt-[9px] pb-[3px] shrink-0">
            <span className="w-9 h-[5px] rounded-full bg-fg/15" />
          </div>

          {/* Nav bar */}
          <div className="relative flex items-center justify-center h-[46px] sm:h-[52px] px-12 border-b border-rule shrink-0">
            <DialogPrimitive.Title className="th text-[16px] font-semibold tracking-[-0.01em] truncate max-w-full">
              @{username}
            </DialogPrimitive.Title>
            <DialogClose
              aria-label="Close"
              className="ios-press absolute right-3 w-7 h-7 inline-flex items-center justify-center rounded-full bg-cream dark:bg-white/[0.08] text-fg-soft hover:text-fg cursor-pointer border-0 focus-visible:outline-none"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </DialogClose>
          </div>

          {/* iOS segmented control */}
          <div className="px-4 pt-[14px] pb-[10px] shrink-0">
            <div className="relative grid grid-cols-2 p-[3px] rounded-[11px] bg-cream dark:bg-white/[0.06]" role="tablist">
              <span
                aria-hidden
                className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-[8px] bg-bg dark:bg-white/[0.18] shadow-[0_1px_3px_rgba(0,0,0,.13),0_1px_1px_rgba(0,0,0,.05)] transition-transform duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)]"
                style={{ transform: tab === 'following' ? 'translateX(100%)' : 'translateX(0)' }}
              />
              {TABS.map(({ id, label, count }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(id)}
                    className={`relative z-[1] flex items-center justify-center gap-[6px] py-[7px] text-[13px] font-medium bg-transparent border-0 cursor-pointer transition-colors duration-200 focus-visible:outline-none ${
                      active ? 'text-fg' : 'text-fg-soft'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`mono text-[11px] tabular-nums ${active ? 'opacity-50' : 'opacity-40'}`}>
                      {count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-[240px] pb-[max(env(safe-area-inset-bottom),12px)]">
            <div
              key={tab}
              className={`animate-in fade-in-0 duration-[280ms] ease-[cubic-bezier(.32,.72,0,1)] ${
                tab === 'following' ? 'slide-in-from-right-2' : 'slide-in-from-left-2'
              } ${!loading && users.length > 0 ? 'divide-y divide-rule' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center py-[110px]">
                  <span className="w-6 h-6 rounded-full border-2 border-fg/15 border-t-fg/70 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-[80px]">
                  <div className="w-14 h-14 rounded-full bg-cream dark:bg-white/[0.06] flex items-center justify-center text-fg-faint">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p className="th text-[14px] text-fg mt-4 mb-1">
                    {tab === 'followers' ? 'ยังไม่มีผู้ติดตาม' : 'ยังไม่ได้ติดตามใคร'}
                  </p>
                  <p className="mono text-[10px] tracking-[.12em] uppercase text-fg-faint">
                    {tab === 'followers' ? 'No followers yet' : 'Not following anyone'}
                  </p>
                </div>
              ) : (
                users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => go(u.username)}
                    className="ios-press group w-full flex items-center gap-[14px] px-5 py-[10px] bg-transparent border-0 cursor-pointer text-left transition-colors active:bg-cream dark:active:bg-white/[0.05] focus-visible:outline-none focus-visible:bg-cream dark:focus-visible:bg-white/[0.05]"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-tile shrink-0">
                      {u.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-[6px]">
                        <span className="text-[14.5px] font-semibold tracking-[-0.01em] truncate">{u.name}</span>
                        {u.isAmbassador ? (
                          <span className="text-gold shrink-0 inline-flex"><CrownIcon /></span>
                        ) : u.isCustomer ? (
                          <span className="text-gold shrink-0 inline-flex"><VoyageurMark size={7} /></span>
                        ) : null}
                      </div>
                      <div className="mono text-[12px] text-fg-soft tracking-[.02em] truncate mt-[1px]">@{u.username}</div>
                    </div>
                    <svg
                      aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="text-fg-faint shrink-0"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
