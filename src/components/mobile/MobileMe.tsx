// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { useTranslations } from 'next-intl';
import { MobileFooter } from './MobileShared';
import { MeSettings } from '../account/MeSettings';
import { MeNotifications } from '../account/MeNotifications';
import { ActivityHeatmap } from '../account/ActivityHeatmap';
import { FollowListModal, type FollowTab } from '../account/FollowListModal';
import { PhotoCardDeleteButton } from '../photo/PhotoCardDeleteButton';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getPresignedUploadUrl } from '@/app/actions/r2-upload';
import { convertToWebP } from '@/lib/imageConvert';
import { getCashbackPercentage } from '@/lib/ranking-system';

type SectionKey = 'dashboard' | 'photos' | 'favorites' | 'stats' | 'notifications' | 'settings';

export function MobileMe({
  section: initialSection = 'dashboard',
  profile,
  myPhotos = [],
  favs = [],
  favDates = [],
  isVoyageur = false,
  favoritesCount = 0,
  daysLeft = null,
  voyageurRank = null,
  topCategory = null,
}: any) {
  const router = useRouter();
  const { theme, authUser, signOut } = useApp();
  const dark = theme === 'dark';
  const t = useTranslations('MePage');
  const SECTIONS = [
    { id: 'dashboard', label: t('nav_overview') },
    { id: 'photos',    label: t('nav_photos') },
    { id: 'favorites', label: t('nav_favorites') },
    { id: 'stats',     label: t('nav_stats') },
    { id: 'notifications', label: t('nav_notifications') || 'Notifications' },
    { id: 'settings',  label: t('nav_settings') },
  ];
  const [activeTab, setActiveTab] = useState<SectionKey>(
    (SECTIONS.find(s => s.id === initialSection)?.id || 'dashboard') as SectionKey
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [localCover, setLocalCover] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [followModalTab, setFollowModalTab] = useState<FollowTab | null>(null);
  const [photos, setPhotos] = useState(myPhotos);
  const removePhoto = (id: string) => setPhotos((prev: any) => prev.filter((p: any) => p.id !== id));

  const goTab = (id: SectionKey) => {
    setActiveTab(id);
    window.history.pushState(null, '', id === 'dashboard' ? '/me' : `/me/${id}`);
  };

  const handleShare = async () => {
    const username = profile?.username;
    const url = username
      ? `${typeof location !== 'undefined' ? location.origin : ''}\/photographer\/${username}`
      : (typeof location !== 'undefined' ? location.href : '');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && url) {
        await navigator.clipboard.writeText(url);
      } else if (url) {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1900);
    } catch {}
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.id) {
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB');
      e.target.value = '';
      return;
    }

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    setUploading(true);

    try {
      const webpFile = await convertToWebP(file);
      const supabase = getSupabaseBrowserClient();
      const fileName = `${type}s/${authUser.id}-${Date.now()}.webp`;

      const { success, url, publicUrl, error: uploadError } = await getPresignedUploadUrl(fileName, 'image/webp');
      if (!success || !url || !publicUrl) throw new Error(uploadError || 'Failed to get upload URL');

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: webpFile,
        headers: { 'Content-Type': 'image/webp' },
      });
      if (!uploadRes.ok) throw new Error('Upload failed: ' + uploadRes.statusText);

      const column = type === 'avatar' ? 'avatar_url' : 'cover_url';
      const { error: updateError } = await supabase
        .from('users')
        .update({ [column]: publicUrl })
        .eq('id', authUser.id);
      if (updateError) throw updateError;

      if (type === 'avatar') {
        setLocalAvatar(publicUrl);
        // Call global profile update if provided (optional)
        if (typeof profile?.updateProfile === 'function') profile.updateProfile({ avatar_url: publicUrl });
      } else {
        setLocalCover(publicUrl);
        if (typeof profile?.updateProfile === 'function') profile.updateProfile({ cover_url: publicUrl });
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const persona = {
    username: profile?.username || '',
    name: profile?.display_name || 'User',
    loc: profile?.location || '',
    avatar: localAvatar || profile?.avatar_url || '',
    cover: localCover || profile?.cover_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop',
  };

  const totalLikes = photos.reduce((s: any, p: any) => s + (p.likes || 0), 0);
  const totalFav = photos.reduce((s: any, p: any) => s + (p.favorites || 0), 0);
  const totalPulse = Math.round(photos.reduce((s: any, p: any) => s + (p.pulse || 0), 0));
  const followers = profile?.followers_count || 0;
  const following = profile?.following_count || 0;
  const topPhotos = [...photos].sort((a: any, b: any) => (b.pulse || 0) - (a.pulse || 0)).slice(0, 6);

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* Full-bleed profile header */}
      <section style={{ padding: 0 }}>
        <div style={{
          position: 'relative', overflow: 'hidden', background: '#000',
        }}>
          {persona.cover && (
            <img src={persona.cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(125% 85% at 50% 0%, rgba(38,38,38,0.5) 0%, rgba(0,0,0,0.82) 58%, rgba(0,0,0,0.95) 100%)' }} />

          {/* edit cover */}
          <label className="ios-press" style={{
            position: 'absolute', top: 12, right: 12, zIndex: 3, width: 32, height: 32, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', cursor: 'pointer',
          }} aria-label={t('change_cover')}>
            {uploadingCover
              ? <span style={{ fontSize: 11 }}>···</span>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>}
            <input type="file" accept="image/*" className="hidden" disabled={uploadingCover} onChange={(e) => handleImageUpload(e, 'cover')} />
          </label>

          {/* content */}
          <div style={{ position: 'relative', zIndex: 2, padding: '40px 22px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* avatar */}
            <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
              <span style={{ display: 'inline-block', padding: isVoyageur ? 2.5 : 0, borderRadius: '50%', background: isVoyageur ? 'linear-gradient(135deg,#e7c989,#b08e54)' : 'transparent' }}>
                {persona.avatar ? (
                  <img src={persona.avatar} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.9)', display: 'block' }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                )}
              </span>
              <span style={{ position: 'absolute', right: 0, bottom: 2, width: 26, height: 26, borderRadius: '50%', background: '#fff', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              </span>
              <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={(e) => handleImageUpload(e, 'avatar')} />
              {uploadingAvatar && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10 }}>···</div>
              )}
            </label>

            {/* name */}
            <h1 style={{ margin: '15px 0 0', color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(21px, 6vw, 26px)', letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {persona.name || authUser?.email?.split('@')[0]}
            </h1>

            {/* role / subtitle */}
            <div style={{ marginTop: 6, fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.58)' }}>
              {isVoyageur && <span style={{ color: '#d8b878', fontWeight: 500 }}>Voyageur</span>}
              {isVoyageur && (persona.username || persona.loc) ? <span style={{ opacity: 0.45 }}>{'  ·  '}</span> : null}
              {persona.username ? `@${persona.username}` : (persona.loc || authUser?.email || '')}
            </div>

            {/* bio */}
            {profile?.bio && (
              <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)', maxWidth: '38ch', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{profile.bio}</p>
            )}

            {/* inline stats — Photos · Followers · Following · Pulse */}
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'center', columnGap: 18, rowGap: 9 }}>
              {[
                [compact(photos.length), t('photos'), () => goTab('photos')],
                [compact(followers), t('followers'), () => setFollowModalTab('followers')],
                [compact(following), t('following_label'), () => setFollowModalTab('following')],
                [compact(totalPulse), t('pulse'), () => goTab('stats')],
              ].map(([n, l, onClick]) => (
                <button key={l} onClick={onClick || undefined} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, padding: 0, cursor: onClick ? 'pointer' : 'default', background: 'transparent', border: 0, color: '#fff' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{n}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section style={{ padding: '14px 14px 0', display: 'flex', gap: 9 }}>
        <button className="ios-press" onClick={() => goTab('settings')} style={{ flex: 1, minHeight: 44, cursor: 'pointer', borderRadius: 12, background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', border: 0, fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, letterSpacing: '0.01em' }}>{t('edit_profile')}</button>
        <button className="ios-press" onClick={handleShare} style={{ flex: 1, minHeight: 44, cursor: 'pointer', borderRadius: 12, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: dark ? '#fff' : '#000', border: 0, fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, letterSpacing: '0.01em' }}>{t('share')}</button>
      </section>

      {/* Sticky icon tab bar */}
      <div style={{ position: 'sticky', top: 52, zIndex: 30, marginTop: 20, background: dark ? 'rgba(10,10,10,0.86)' : 'rgba(255,255,255,0.86)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', display: 'flex' }}>
        {SECTIONS.map(s => {
          const active = activeTab === s.id;
          return (
            <button key={s.id} onClick={() => goTab(s.id as SectionKey)} aria-label={s.label} style={{ position: 'relative', flex: 1, padding: '12px 0', cursor: 'pointer', background: 'transparent', border: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: active ? (dark ? '#fff' : '#000') : 'var(--fg-faint)' }}>
              <TabIcon name={s.id} />
              {active && <span style={{ position: 'absolute', left: '30%', right: '30%', bottom: -1, height: 2, background: dark ? '#fff' : '#000' }} />}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && (
        <>

          {/* Traveller banner */}
          {isVoyageur && (
            <section style={{ padding: '26px 16px 0' }}>
              <div style={{
                position: 'relative', padding: '20px 18px', overflow: 'hidden',
                background: dark ? '#13110b' : '#faf6ee',
                border: '1px solid rgba(176,142,84,0.45)',
                borderRadius: 18, boxShadow: '0 10px 28px rgba(176,142,84,0.16)',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#b08e54' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(176,142,84,0.2)' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                    letterSpacing: '0.16em', textTransform: 'uppercase', color: '#b08e54',
                  }}>
                    <span style={{ width: 6, height: 6, background: '#b08e54', transform: 'rotate(45deg)' }} />
                    {t('voyageurs_awards')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 500, letterSpacing: '-0.025em', color: '#b08e54', lineHeight: 1 }}>
                      {getCashbackPercentage(voyageurRank)}%
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {t('cashback')}
                    </span>
                  </div>
                </div>
                <div style={{
                  marginTop: 12, fontFamily: "'Inter', sans-serif", fontWeight: 300,
                  fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.25,
                }}>
                  {voyageurRank != null
                    ? <>คุณอยู่อันดับ <strong style={{ fontWeight: 600 }}>#{voyageurRank}</strong> ในหมวด {topCategory ?? 'Landscape'}</>
                    : <>ส่งรูปเพื่อเริ่มต้นในหมวด {topCategory ?? 'Landscape'}</>
                  }
                </div>
                <p style={{
                  fontFamily: "'Noto Sans Thai', sans-serif",
                  fontSize: 13, color: 'var(--fg-soft)', lineHeight: 1.6, marginTop: 8,
                }}>{daysLeft != null ? `เหลือเวลา ${daysLeft} วัน` : 'กำลังโหลด…'}</p>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section style={{ padding: '34px 16px 0' }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--fg-soft)', marginBottom: 12,
            }}>{t('quick_actions')}</div>
            <div className="ios-card">
              {[
                { ic: 'upload', tt: t('submit_new_photo'), sub: t('one_upload_per_day'), onClick: () => alert('Submit · Coming soon') },
                { ic: 'compass', tt: t('vote_favorite'), sub: t('discover_new'), onClick: () => router.push('/explore') },
                { ic: 'trophy', tt: t('view_hall_of_fame'), sub: t('all_photos_season'), onClick: () => router.push('/hall-of-fame') },
              ].map((row, i, a) => (
                <button key={row.tt} onClick={row.onClick} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                  padding: '15px 16px', textAlign: 'left',
                  background: 'transparent', border: 0,
                  borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
                  cursor: 'pointer', color: 'inherit', fontFamily: "'Inter', sans-serif",
                }}>
                  <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QuickIcon name={row.ic} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>{row.tt}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-soft)', marginTop: 2 }}>{row.sub}</span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 16, opacity: 0.4 }}>→</span>
                </button>
              ))}
            </div>
          </section>

          {/* Recent photos — IG grid */}
          {photos.length > 0 && (
            <section style={{ padding: '34px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, padding: '0 16px' }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-soft)',
                }}>{t('your_photos_this_season')}</div>
                <button onClick={() => goTab('photos')} style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer',
                  borderBottom: '1px solid var(--rule)', paddingBottom: 2,
                }}>{t('see_all')} →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                {photos.slice(0, 6).map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/photo/${p.id}`)}
                    className="group ios-press" style={{ position: 'relative', aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <PhotoCardDeleteButton photoId={p.id} storageUrl={p.src} onDeleted={removePhoto} alwaysVisible />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === 'photos' && (
        <section style={{ padding: '24px 0 0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--fg-soft)', marginBottom: 14, padding: '0 16px',
          }}>{photos.length} {t('photos')}</div>
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 6 }}>No photos yet</div>
              <p style={{ fontSize: 13, color: 'var(--fg-soft)', margin: 0 }}>อัปโหลดภาพแรกของคุณเพื่อเริ่มสะสมคะแนน</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              {photos.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/photo/${p.id}`)}
                  className="group ios-press" style={{ position: 'relative', aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  <PhotoCardDeleteButton photoId={p.id} storageUrl={p.src} onDeleted={removePhoto} alwaysVisible />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'favorites' && (
        <section style={{ padding: '24px 0 0' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--fg-soft)', marginBottom: 14, padding: '0 16px',
          }}>{favs.length} {t('nav_favorites')}</div>
          {favs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{
                width: 60, height: 60, margin: '0 auto 18px', borderRadius: 18,
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.6C20 15.8 12 21 12 21z" />
                </svg>
              </div>
              <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 6 }}>No favorites yet</div>
              <p style={{ fontSize: 13, color: 'var(--fg-soft)', margin: '0 0 22px', lineHeight: 1.6 }}>กดหัวใจบนภาพที่ชอบ เพื่อเก็บไว้ดูที่นี่</p>
              <button className="ios-press" onClick={() => router.push('/explore')} style={{
                minHeight: 46, padding: '0 24px', cursor: 'pointer', borderRadius: 13,
                background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', border: 0,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>{t('discover_new')} →</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              {favs.map(p => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/photo/${p.id}`)}
                  className="ios-press" style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'stats' && (
        <section style={{ padding: '24px 16px 0' }}>
          {/* Desktop-style 4 stat cards */}
          <div className="ios-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[
              [String(photos.length), t('photos')],
              [followers.toLocaleString(), t('followers')],
              [totalLikes.toLocaleString(), t('likes_received')],
              [String(totalPulse), t('pulse')],
            ].map(([n, l], i) => (
              <div key={l} style={{
                padding: '20px 18px',
                borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 0,
                borderBottom: i < 2 ? '1px solid var(--rule)' : 0,
              }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 32, fontWeight: 500,
                  letterSpacing: '-0.02em', lineHeight: 1,
                }}>{n}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--fg-soft)', marginTop: 8,
                }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Voting activity heatmap */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--fg-soft)' }}>{t('voting_activity')}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: 'var(--fg-soft)' }}>{favDates.length}</span>
            </div>
            <div className="ios-card" style={{ padding: '18px 14px 14px', color: dark ? '#fff' : '#000' }}>
              <ActivityHeatmap dates={favDates} />
            </div>
          </div>

          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--fg-soft)', margin: '32px 0 12px',
          }}>{t('top_photos')}</div>
          {topPhotos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--fg-soft)', margin: 0 }}>—</p>
          ) : (
            <div className="ios-card">
              {topPhotos.map((p: any, i: number, a: any[]) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/photo/${p.id}`)}
                  className="ios-press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', cursor: 'pointer',
                    borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
                  }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--fg-faint)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'var(--tile)', flexShrink: 0 }}>
                    <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ marginTop: 7, height: 3, borderRadius: 2, overflow: 'hidden', background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, p.pulse || 0)}%`, background: 'currentColor' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, lineHeight: 1 }}>{Math.round(p.pulse || 0)}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-soft)', marginTop: 3 }}>{t('pulse')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'notifications' && (
        <section style={{ padding: '0' }}>
          <MeNotifications mobile />
        </section>
      )}

      {activeTab === 'settings' && (
        <section style={{ padding: '24px 16px 0' }}>
          <MeSettings
            persona={{
              id: profile?.id || '',
              username: profile?.username || '',
              name: profile?.display_name || '',
              avatar: profile?.avatar_url || '',
              loc: profile?.location || 'Not set',
              bio: profile?.bio || '',
              website: profile?.portfolio_url || '',
              socialTwitter: profile?.social_twitter || '',
              socialInstagram: profile?.social_instagram || '',
              socialFacebook: profile?.social_facebook || '',
              isCustomer: profile?.is_customer
            } as any}
            isVoyageur={isVoyageur}
          />
          {authUser && (
            <button className="ios-press" onClick={signOut} style={{
              width: '100%', marginTop: 32, minHeight: 46, padding: '0 18px', borderRadius: 13,
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              border: `1.5px solid ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'}`, background: 'transparent',
              color: dark ? '#fff' : '#000', cursor: 'pointer',
            }}>{t('sign_out')}</button>
          )}
        </section>
      )}

      <div style={{ height: 40 }} />
      <MobileFooter />
      {/* clearance for the floating bottom tab bar */}
      <div aria-hidden="true" style={{ height: 'calc(76px + env(safe-area-inset-bottom, 0px))', background: dark ? '#000' : 'var(--cream)' }} />

      {copied && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed', left: '50%', bottom: 'calc(94px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)',
          zIndex: 60, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 18px', borderRadius: 999, whiteSpace: 'nowrap',
          background: dark ? 'rgba(255,255,255,0.96)' : 'rgba(0,0,0,0.92)',
          color: dark ? '#000' : '#fff',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.01em',
          boxShadow: '0 10px 34px rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          animation: 'fade .2s ease both',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          {t('link_copied')}
        </div>
      )}

      {profile?.id && (
        <FollowListModal
          open={followModalTab !== null}
          onOpenChange={(o) => { if (!o) setFollowModalTab(null); }}
          userId={profile.id}
          username={profile.username}
          initialTab={followModalTab ?? 'followers'}
          followersCount={followers}
          followingCount={following}
        />
      )}
    </div>
  );
}

function compact(n: number): string {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 10_000) return Math.round(n / 1000) + 'K';
  if (n >= 1_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function TabIcon({ name }: { name: string }) {
  const c: any = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'dashboard') return (<svg {...c}><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5h5v5" /></svg>);
  if (name === 'photos') return (<svg {...c}><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><rect x="14" y="14" width="7" height="7" rx="1.2" /></svg>);
  if (name === 'favorites') return (<svg {...c}><path d="M12 21s-8-5.2-8-11.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.6C20 15.8 12 21 12 21z" /></svg>);
  if (name === 'stats') return (<svg {...c}><line x1="6" y1="20" x2="6" y2="11" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="14" /></svg>);
  if (name === 'notifications') return (<svg {...c}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
  return (<svg {...c}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
}

function QuickIcon({ name }: { name: string }) {
  const common: any = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'upload') return (<svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
  if (name === 'compass') return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>);
  return (<svg {...common}><path d="M8 4h8v3a4 4 0 1 1-8 0V4zM5 6h3M16 6h3M9 13v3h6v-3M8 20h8" /></svg>);
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '14px 0', borderTop: '1px solid var(--rule)',
    }}>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-soft)',
      }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
