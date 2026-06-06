'use client';
import { notFound, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Photo } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { VoyageurMark, CrownIcon } from '@/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageCover } from '@/components/layout/PageCover';
import { useFollowState } from '@/hooks/useFollowState';
import { useApp } from '@/providers/AppProvider';
import { computePulse, type PickType } from '@/lib/pulse-engine';

// ===== Photographer public profile — /photographer/[username] =====

function mapPublicPhoto(p: any, username: string) {
  const likes = p.likes_count || 0;
  const favorites = p.favorites_count || 0;
  const comments = p.comments_count || 0;
  const pulse = computePulse({
    likes_count: likes,
    favorites_count: favorites,
    comments_count: comments,
    impressions_count: p.impressions_count || 0,
    uploaded_at: p.uploaded_at,
    pick_type: (p.pick_type as PickType) ?? 'none',
    has_title: !!p.title,
    has_category: !!p.category,
    has_descriptor: !!(p.location || p.camera || p.lens),
  });
  return {
    id: p.id,
    slug: p.id,
    src: p.storage_url,
    title: p.title,
    by: username,
    cat: p.category || 'General',
    w: p.width || 4,
    h: p.height || 3,
    caption: p.description || '',
    exif: { camera: 'Unknown', lens: 'Unknown', iso: 100, shutter: '1/100', aperture: 'f/8', focal: '50mm' },
    likes,
    likes24h: 0,
    comments,
    favorites,
    hours: 1,
    picks: [],
    date: p.uploaded_at,
    pulse,
    rank: 0,
  };
}

interface ProfileStatProps { label: string; val: string | number; }
function ProfileStat({ label, val }: ProfileStatProps) {
  return (
    <div>
      <div className="text-[28px] font-medium tracking-[-0.015em]">{val}</div>
      <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-1">{label}</div>
    </div>
  );
}

function ProfileEmpty({ msg }: { msg: string }) {
  return <div className="py-[120px] text-center text-fg-soft th">{msg}</div>;
}

const MOBILE_TABS = [
  { id: 'photos' as const,    label: 'Photos' },
  { id: 'favorites' as const, label: 'Saved' },
  { id: 'about' as const,     label: 'About' },
];

export function PhotographerClient({ username }: { username: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const c = dark ? '#fff' : '#000';

  const [photographer, setPhotographer] = useState<any>(null);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [myFavorites, setMyFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<'photos' | 'favorites' | 'about'>('photos');
  const [copied, setCopied] = useState(false);
  const [voyageurRank, setVoyageurRank] = useState<number | null>(null);
  const [topCategory, setTopCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabaseBrowserClient();

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (!userData) { setIsLoading(false); return; }

      setPhotographer({
        id: userData.id,
        username: userData.username,
        name: userData.display_name || userData.username,
        bio: userData.bio || 'No bio yet.',
        loc: userData.location || 'EARTH',
        avatar: userData.avatar_url,
        cover: userData.cover_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2938&auto=format&fit=crop',
        isCustomer: userData.is_customer,
        isAmbassador: userData.is_ambassador,
        followers: userData.followers_count ?? 0,
        following: userData.following_count ?? 0,
        joined: new Date(userData.created_at || Date.now()).getFullYear().toString(),
        cameras: ['Digital Camera'],
      });

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('photographer_id', userData.id)
        .order('uploaded_at', { ascending: false });

      if (photosData) {
        setMyPhotos(photosData.map(p => mapPublicPhoto(p, userData.username)));

        // Compute voyageur rank if this photographer is a customer
        if (userData.is_customer && photosData.length > 0) {
          const catCounts: Record<string, number> = {};
          const catBestLikes: Record<string, number> = {};
          for (const p of photosData) {
            if (!p.category) continue;
            catCounts[p.category] = (catCounts[p.category] || 0) + 1;
            catBestLikes[p.category] = Math.max(catBestLikes[p.category] || 0, p.likes_count || 0);
          }
          const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
          if (topCat) {
            setTopCategory(topCat);
            const bestLikes = catBestLikes[topCat] || 0;
            const { data: vUsers } = await supabase
              .from('users').select('id').eq('is_customer', true).neq('id', userData.id);
            const vIds = (vUsers || []).map((u: any) => u.id as string);
            if (vIds.length > 0) {
              const { count } = await supabase
                .from('photos').select('id', { count: 'exact', head: true })
                .eq('category', topCat).gt('likes_count', bestLikes).in('photographer_id', vIds);
              setVoyageurRank((count ?? 0) + 1);
            } else {
              setVoyageurRank(1);
            }
          }
        }
      }

      const { data: favsData } = await supabase
        .from('favorites')
        .select('photos ( id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, description, users:users!photos_photographer_id_fkey(username) )')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (favsData) {
        setMyFavorites(favsData.map(f => {
          const p = (f as any).photos;
          if (!p) return null;
          const pUsername = (p as any).users?.username || 'Unknown';
          return mapPublicPhoto(p, pUsername);
        }).filter(Boolean));
      }

      setIsLoading(false);
    };

    fetchProfile();
  }, [username]);

  // Realtime: patch engagement counts + recompute pulse without refetch
  useEffect(() => {
    if (!photographer?.id) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`photographer-photos-${photographer.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photos', filter: `photographer_id=eq.${photographer.id}` },
        (payload) => {
          const next = payload.new as { id: string; likes_count?: number; favorites_count?: number; comments_count?: number; };
          setMyPhotos((curr) =>
            curr.map((p) => {
              if (p.id !== next.id) return p;
              const likes = typeof next.likes_count === 'number' ? next.likes_count : p.likes;
              const favorites = typeof next.favorites_count === 'number' ? next.favorites_count : p.favorites;
              const comments = typeof next.comments_count === 'number' ? next.comments_count : p.comments;
              const pulse = computePulse({ likes_count: likes, favorites_count: favorites, comments_count: comments, impressions_count: 0, uploaded_at: p.date });
              return { ...p, likes, favorites, comments, pulse };
            }),
          );
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [photographer?.id]);

  const follow = useFollowState(photographer?.id ?? null);

  const onFollowClick = async () => {
    const res = await follow.toggle();
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    }
  };

  const handleShare = async () => {
    const url = typeof location !== 'undefined' ? location.href : '';
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({ title: photographer?.name ?? '', url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1900);
  };

  if (isLoading) return (
    <div className="page-fade py-32 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
      Loading Profile...
    </div>
  );
  if (!photographer) return notFound();

  const avgPulse = myPhotos.length
    ? (myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0) / myPhotos.length).toFixed(0)
    : '—';
  const editorPickCount = myPhotos.filter((p: Photo) => p.picks.includes('editor')).length;
  const myCategories = Array.from(new Set(myPhotos.map((p: Photo) => p.cat)));
  const eyebrowParts = [
    photographer.isAmbassador ? 'Ambassador' : null,
    photographer.isCustomer ? 'Voyageur' : 'Photographer',
    `@${photographer.username}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="page-fade">

      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden" style={{
        minHeight: '100vh',
        background: dark ? '#0a0a0a' : '#fff',
        color: c,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Sticky top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: dark ? 'rgba(10,10,10,0.96)' : 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 52, padding: '0 14px',
        }}>
          <button onClick={() => router.back()} aria-label="Back" style={{
            width: 36, height: 36, background: 'transparent', border: 0,
            cursor: 'pointer', color: c, padding: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
              @{photographer.username}
            </span>
            {photographer.isCustomer && (
              <span style={{ width: 5, height: 5, background: '#b08e54', transform: 'rotate(45deg)', display: 'inline-block' }} />
            )}
          </div>
          <button onClick={handleShare} aria-label="Share" style={{
            width: 36, height: 36, background: 'transparent', border: 0,
            cursor: 'pointer', color: c, padding: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>
        </header>

        {/* Cover image */}
        <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden', background: dark ? '#1a1916' : '#f0ede7' }}>
          {photographer.cover && (
            <img src={photographer.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />
          {photographer.isAmbassador && (
            <div style={{
              position: 'absolute', left: 14, bottom: 12, zIndex: 2,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#b08e54', color: '#fff',
              padding: '3px 8px',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
            }}>Ambassador</div>
          )}
          {photographer.isCustomer && !photographer.isAmbassador && (
            <div style={{
              position: 'absolute', left: 14, bottom: 12, zIndex: 2,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              color: '#b08e54', background: 'rgba(0,0,0,0.5)',
              padding: '3px 8px', backdropFilter: 'blur(4px)',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 5, height: 5, background: '#b08e54', transform: 'rotate(45deg)' }} />
              Voyageur
            </div>
          )}
        </div>

        {/* Avatar + stat row */}
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: dark ? '#1a1916' : '#e8e4dc',
            border: `3px solid ${dark ? '#0a0a0a' : '#fff'}`,
            overflow: 'hidden', flexShrink: 0, zIndex: 2,
            marginTop: -42,
          }}>
            {photographer.avatar && (
              <img src={photographer.avatar} alt={photographer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', paddingTop: 12, paddingBottom: 2 }}>
            {([
              [String(myPhotos.length), 'Photos'],
              [follow.followersCount.toLocaleString(), 'Followers'],
              [(photographer.following ?? 0).toLocaleString(), 'Following'],
            ] as const).map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{n}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  color: 'var(--fg-soft)', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginTop: 2,
                }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Name + bio + location */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {photographer.name}
          </div>
          {photographer.bio && (
            <p style={{
              fontFamily: "'Noto Sans Thai', sans-serif",
              fontSize: 13, lineHeight: 1.6, margin: '5px 0 6px',
              color: 'var(--fg-soft)', maxWidth: '38ch',
            }}>{photographer.bio}</p>
          )}
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.06em', color: 'var(--fg-soft)', textTransform: 'uppercase',
          }}>
            {photographer.loc} · Joined {photographer.joined}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
          {follow.isSelf ? (
            <button onClick={() => router.push('/me')} style={mobileBtnSolid(dark)}>Edit Profile</button>
          ) : (
            <button
              onClick={onFollowClick}
              disabled={follow.loading}
              style={mobileBtnSolid(dark)}
            >
              {follow.following ? 'Following' : 'Follow'}
            </button>
          )}
          <button onClick={handleShare} style={mobileBtnGhost(dark)}>
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Pulse strip — signature metric, real data */}
        {myPhotos.length > 0 && (
          <div style={{
            margin: '14px 16px 0',
            padding: '11px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            background: dark ? '#1a1916' : '#f9f7f4',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l4-8 3 6 3-3" />
              </svg>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                Pulse {Math.round(myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0)).toLocaleString()}
              </span>
            </div>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-soft)',
            }}>
              Avg {avgPulse}
            </span>
          </div>
        )}

        {/* Mobile tab bar */}
        <div style={{ marginTop: 16, borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {MOBILE_TABS.map(({ id, label }) => {
              const active = mobileTab === id;
              return (
                <button key={id} onClick={() => setMobileTab(id)} style={{
                  padding: '13px 0', background: 'transparent', cursor: 'pointer', border: 0,
                  borderBottom: `2px solid ${active ? c : 'transparent'}`,
                  color: active ? c : 'var(--fg-soft)',
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{label}</button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        {mobileTab === 'photos' && (
          myPhotos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {myPhotos.map(p => (
                <div key={p.id} onClick={() => router.push(`/photo/${p.id}`)} style={{
                  aspectRatio: '1 / 1', background: dark ? '#1a1916' : '#f0ede7',
                  cursor: 'pointer', overflow: 'hidden',
                }}>
                  <img src={p.src} alt={p.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '80px 16px', textAlign: 'center', fontFamily: "'Noto Sans Thai', sans-serif", color: 'var(--fg-soft)' }}>
              ยังไม่มีภาพในโปรไฟล์นี้
            </div>
          )
        )}

        {mobileTab === 'favorites' && (
          myFavorites.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {myFavorites.map(p => (
                <div key={(p as any).id} onClick={() => router.push(`/photo/${(p as any).id}`)} style={{
                  aspectRatio: '1 / 1', background: dark ? '#1a1916' : '#f0ede7',
                  cursor: 'pointer', overflow: 'hidden',
                }}>
                  <img src={(p as any).src} alt={(p as any).title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '80px 16px', textAlign: 'center', fontFamily: "'Noto Sans Thai', sans-serif", color: 'var(--fg-soft)' }}>
              ยังไม่มีภาพที่บันทึกไว้
            </div>
          )
        )}

        {mobileTab === 'about' && (
          <div style={{ padding: '20px 16px 40px' }}>
            {/* Voyageur card */}
            {photographer.isCustomer && (
              <div style={{
                marginBottom: 24,
                background: dark ? '#1a1916' : '#f9f7f4',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                padding: 16,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b08e54',
                }}>
                  <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
                  Voyageur · Spring 2026
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 2.2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, paddingBottom: 6, marginBottom: 6 }}>
                    <span style={{ color: 'var(--fg-soft)' }}>Photos submitted</span>
                    <span style={{ fontWeight: 600 }}>{myPhotos.length}</span>
                  </div>
                  {voyageurRank != null && topCategory && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, paddingBottom: 6, marginBottom: 6 }}>
                      <span style={{ color: 'var(--fg-soft)' }}>Rank ({topCategory})</span>
                      <span style={{ fontWeight: 600 }}>#{voyageurRank}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg-soft)' }}>Cashback tier</span>
                    <span style={{ fontWeight: 600, color: '#b08e54' }}>5% ✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bio */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginBottom: 8 }}>About</div>
              <p style={{ fontFamily: "'Noto Sans Thai', sans-serif", fontSize: 14, lineHeight: 1.7, margin: 0, color: 'var(--fg-soft)' }}>{photographer.bio}</p>
            </div>

            {/* Categories */}
            {myCategories.length > 0 && (
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginBottom: 10 }}>Categories</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {myCategories.map((cat: string) => (
                    <span key={cat} style={{
                      padding: '4px 10px',
                      border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 40 }} />
        <Footer />
      </div>

      {/* ===================== DESKTOP LAYOUT ===================== */}
      <div className="hidden md:block">
        <PageCover
          src={photographer.cover}
          eyebrow={eyebrowParts}
          title={photographer.name}
          subtitle={photographer.bio}
          credit={`${photographer.loc} · ${myPhotos.length} photos · ${follow.followersCount.toLocaleString()} followers`}
          height="50vh"
          minHeight={380}
          maxHeight={560}
        />

        {/* Identity header */}
        <section className="pt-8 md:pt-[64px] pb-6 md:pb-[48px] border-b border-rule">
          <div className="wrap">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 md:mb-[48px]">
              <div className="flex items-center gap-[10px]">
                {photographer.isAmbassador && (
                  <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] bg-[#b08e54] text-white text-[10.5px] tracking-[.16em] uppercase font-medium">
                    <CrownIcon /> Ambassador
                  </span>
                )}
                {photographer.isCustomer && (
                  <span className="inline-flex items-center gap-[6px] px-[11px] py-[5px] bg-fg text-bg text-[10.5px] tracking-[.16em] uppercase font-medium">
                    <VoyageurMark size={7} /> Voyageur
                  </span>
                )}
                <span className="mono text-[11px] tracking-[.18em] uppercase opacity-55">@{photographer.username}</span>
              </div>
              <div className="flex gap-[10px]">
                <button onClick={handleShare} className="btn btn-sm">
                  {copied ? 'Copied!' : 'Share'}
                </button>
                {follow.isSelf ? (
                  <button className="btn btn-sm" disabled>You</button>
                ) : (
                  <button
                    className={`btn btn-sm ${follow.following ? '' : 'btn-solid'}`}
                    onClick={onFollowClick}
                    disabled={follow.loading}
                  >
                    {follow.following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:gap-[48px] items-end grid-cols-[1fr_auto]">
              <div>
                <h1 className="th font-light m-0 leading-[.92] text-[clamp(40px,9vw,128px)] tracking-[-0.035em]">
                  {photographer.name}
                </h1>
                <div className="mt-6 flex gap-[28px] items-center caps">
                  <span className="opacity-65">{photographer.loc}</span>
                  <span className="opacity-35">·</span>
                  <span className="opacity-65">Joined {photographer.joined}</span>
                  <span className="opacity-35">·</span>
                  <span className="opacity-65">{photographer.cameras[0]}</span>
                </div>
              </div>
              <div className="w-[96px] h-[96px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden bg-tile shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photographer.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>

            <p className="th mt-7 text-[17px] leading-[1.55] max-w-[720px] text-fg-soft mb-0">
              {photographer.bio}
            </p>
          </div>
        </section>

        {/* Stat strip + tabs */}
        <section>
          <div className="wrap">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 py-6 md:py-8 border-b border-rule mono">
              <ProfileStat label="Photos" val={myPhotos.length} />
              <ProfileStat label="Followers" val={follow.followersCount.toLocaleString()} />
              <ProfileStat label="Following" val={(photographer.following ?? 0).toLocaleString()} />
              <ProfileStat label="Pulse avg" val={avgPulse} />
              <ProfileStat label="Rank Master" val={editorPickCount} />
            </div>

            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-rule gap-0 h-auto">
                <TabsTrigger value="photos" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                  Photos <span className="opacity-55 ml-[6px]">{myPhotos.length}</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                  Favorites <span className="opacity-55 ml-[6px]">{myFavorites.length}</span>
                </TabsTrigger>
                <TabsTrigger value="about" className="px-0 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                  About
                </TabsTrigger>
              </TabsList>

              <div className="py-[48px] pb-[80px]">
                <TabsContent value="photos">
                  {myPhotos.length > 0
                    ? <PhotoGrid photos={myPhotos} cols={3} showLike />
                    : <ProfileEmpty msg="ยังไม่มีภาพในโปรไฟล์นี้" />
                  }
                </TabsContent>

                <TabsContent value="favorites">
                  <p className="th text-[14px] text-fg-soft mt-0 mb-8 max-w-[600px]">
                    ภาพที่ {photographer.name.split(' ')[0]} เลือกบันทึกไว้ — ตั้งเป็น public โดยช่างภาพ
                  </p>
                  {myFavorites.length > 0 ? (
                    <PhotoGrid photos={myFavorites} cols={3} showLike />
                  ) : (
                    <ProfileEmpty msg="ยังไม่มีภาพที่บันทึกไว้" />
                  )}
                </TabsContent>

                <TabsContent value="about">
                  {photographer.isCustomer && (
                    <div className="p-6 md:p-[32px_36px] bg-cream border border-rule mb-8 md:mb-[48px] grid gap-8 md:gap-[48px] items-center grid-cols-1 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <div className="caps opacity-55 mb-3 flex items-center gap-2">
                          <VoyageurMark size={9} /> Voyageur
                        </div>
                        <h3 className="th text-[26px] font-normal tracking-[-0.015em] m-0 leading-[1.25]">
                          ลูกค้าทริป GOGRAPHY — มีสิทธิ์ลุ้นรางวัล Voyageurs Awards
                        </h3>
                        <div className="mono mt-5 text-[12px] leading-[1.9]">
                          <div className="opacity-55 mb-2">TRIPS COMPLETED</div>
                          {(photographer.customerTrips ?? []).map((t: string) => (
                            <div key={t}>· {t}</div>
                          ))}
                        </div>
                      </div>
                      <div className="border-l border-rule pl-8">
                        <div className="caps opacity-55 mb-3">Voyageurs · Spring 2026</div>
                        <div className="th text-[13px] leading-[1.7]">
                          <div className="flex justify-between py-2 border-b border-rule">
                            <span>Photos submitted</span>
                            <span className="mono font-medium">{myPhotos.length}</span>
                          </div>
                          {voyageurRank != null && topCategory && (
                            <div className="flex justify-between py-2 border-b border-rule">
                              <span>Current rank ({topCategory})</span>
                              <span className="mono font-medium">#{voyageurRank}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2">
                            <span>Cashback tier</span>
                            <span className="mono font-medium">5% ✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[80px] pt-4">
                    <div>
                      <h3 className="th text-[24px] font-normal tracking-[-0.015em] m-0 mb-5">
                        เกี่ยวกับ {photographer.name}
                      </h3>
                      <p className="th text-[15px] leading-[1.75] text-fg-soft">{photographer.bio}</p>
                    </div>
                    <div>
                      <div className="caps opacity-55 mb-4">Gear</div>
                      <ul className="list-none p-0 m-0 mono">
                        {photographer.cameras.map((cam: string) => (
                          <li key={cam} className="py-3 border-b border-rule text-[13px]">{cam}</li>
                        ))}
                      </ul>
                      <div className="caps opacity-55 mb-4 mt-8">Categories</div>
                      <ul className="list-none p-0 m-0 mono">
                        {myCategories.map((cat: string) => (
                          <li key={cat} className="py-3 border-b border-rule text-[13px]">{cat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

function mobileBtnSolid(dark: boolean) {
  return {
    flex: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 44, padding: '0 16px',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
    letterSpacing: '0.03em', textTransform: 'uppercase' as const,
    border: `1px solid ${dark ? '#fff' : '#000'}`,
    background: dark ? '#fff' : '#000',
    color: dark ? '#000' : '#fff',
    cursor: 'pointer',
    borderRadius: 8,
  };
}

function mobileBtnGhost(dark: boolean) {
  return {
    flex: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 44, padding: '0 16px',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
    letterSpacing: '0.03em', textTransform: 'uppercase' as const,
    border: `1px solid ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'}`,
    background: 'transparent',
    color: dark ? '#fff' : '#000',
    cursor: 'pointer',
    borderRadius: 8,
  };
}
