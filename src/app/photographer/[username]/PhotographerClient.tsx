'use client';
import { notFound, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Photo, Photographer } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { VoyageurMark, CrownIcon } from '@/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageCover } from '@/components/layout/PageCover';
import { useFollowState } from '@/hooks/useFollowState';

// ===== Photographer profile — /photographer/[username] =====
// Cover-less typography-first profile; tabs: Photos / Galleries / Favorites / About

function mapPublicPhoto(p: any, username: string) {
  const likes = p.likes_count || 0;
  const favorites = p.favorites_count || 0;
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
    comments: p.comments_count || 0,
    favorites,
    hours: 1,
    picks: [],
    date: p.uploaded_at,
    pulse: likes + favorites * 2,
    rank: 0,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ProfileStatProps {
  label: string;
  val: string | number;
}

function ProfileStat({ label, val }: ProfileStatProps) {
  return (
    <div>
      <div className="text-[28px] font-medium tracking-[-0.015em]">{val}</div>
      <div className="text-[10px] tracking-[.16em] uppercase opacity-55 mt-1">{label}</div>
    </div>
  );
}

interface ProfileEmptyProps {
  msg: string;
}

function ProfileEmpty({ msg }: ProfileEmptyProps) {
  return (
    <div className="py-[120px] text-center text-fg-soft th">{msg}</div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function PhotographerClient({ username }: { username: string }) {
  const params = { username };
  const router = useRouter();
  const pathname = usePathname();
  const [photographer, setPhotographer] = useState<any>(null);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [myGalleries, setMyGalleries] = useState<any[]>([]);
  const [myFavorites, setMyFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch user
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('username', params.username)
        .single();
        
      if (!userData) {
        setIsLoading(false);
        return;
      }
      
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

      // Fetch photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('photographer_id', userData.id)
        .order('uploaded_at', { ascending: false });
        
      if (photosData) {
        setMyPhotos(photosData.map(p => mapPublicPhoto(p, userData.username)));
      }

      // Fetch galleries
      const { data: galleriesData } = await supabase
        .from('galleries')
        .select('id, name, gallery_photos ( photos ( storage_url ) )')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (galleriesData) {
        setMyGalleries(galleriesData.map(g => {
          const photos = g.gallery_photos || [];
          // @ts-ignore
          const coverUrl = photos[0]?.photos?.storage_url || '';
          return { id: g.id, title: g.name, count: photos.length, cover: coverUrl };
        }));
      }

      // Fetch favorites
      const { data: favsData } = await supabase
        .from('favorites')
        .select('photos ( id, title, storage_url, category, likes_count, favorites_count, comments_count, uploaded_at, width, height, description, users:users!photos_photographer_id_fkey(username) )')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (favsData) {
        setMyFavorites(favsData.map(f => {
          // @ts-ignore
          const p = f.photos;
          if (!p) return null;
          // @ts-ignore
          const username = p.users?.username || 'Unknown';
          return mapPublicPhoto(p, username);
        }).filter(Boolean));
      }
      
      setIsLoading(false);
    };
    
    fetchProfile();
  }, [params.username]);

  // Realtime: patch likes_count / favorites_count / comments_count on this
  // photographer's photos, then recompute pulse client-side so the like
  // counter and Pulse stat update without a refetch.
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
          const next = payload.new as {
            id: string;
            likes_count?: number;
            favorites_count?: number;
            comments_count?: number;
          };
          setMyPhotos((curr) =>
            curr.map((p) => {
              if (p.id !== next.id) return p;
              const likes = typeof next.likes_count === 'number' ? next.likes_count : p.likes;
              const favorites = typeof next.favorites_count === 'number' ? next.favorites_count : p.favorites;
              const comments = typeof next.comments_count === 'number' ? next.comments_count : p.comments;
              return { ...p, likes, favorites, comments, pulse: likes + favorites * 2 };
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

  if (isLoading) return <div className="page-fade py-32 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">Loading Profile...</div>;
  if (!photographer) return notFound();

  const avgPulse = myPhotos.length
    ? (myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0) / myPhotos.length).toFixed(0)
    : '—';
  const editorPickCount = myPhotos.filter((p: Photo) => p.picks.includes('editor')).length;

  const eyebrowParts = [
    photographer.isAmbassador ? 'Ambassador' : null,
    photographer.isCustomer ? 'Voyageur' : 'Photographer',
    `@${photographer.username}`,
  ].filter(Boolean).join(' · ');

  // About tab — unique categories from this photographer's photos
  const myCategories = Array.from(new Set(myPhotos.map((p: Photo) => p.cat)));

  return (
    <div className="page-fade">
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
      {/* Identity header — typography-first, no cover image */}
      <section className="pt-8 md:pt-[64px] pb-6 md:pb-[48px] border-b border-rule">
        <div className="wrap">
          {/* Top eyebrow row */}
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
              <button className="btn btn-sm">Message</button>
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

          {/* Big name + avatar composition */}
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
              <img
                src={photographer.avatar} // runtime: photographer.avatar from data
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Bio */}
          <p className="th mt-7 text-[17px] leading-[1.55] max-w-[720px] text-fg-soft mb-0">
            {photographer.bio}
          </p>
        </div>
      </section>

      {/* Stat strip + tabs */}
      <section>
        <div className="wrap">
          {/* Stat strip */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 py-6 md:py-8 border-b border-rule mono">
            <ProfileStat label="Photos" val={myPhotos.length} />
            <ProfileStat label="Followers" val={follow.followersCount.toLocaleString()} />
            <ProfileStat label="Following" val={(photographer.following ?? 0).toLocaleString()} />
            <ProfileStat label="Pulse avg" val={avgPulse} />
            <ProfileStat label="Rank Master" val={editorPickCount} />
          </div>

          {/* Tabs — shadcn Tabs with underline look */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-rule gap-0 h-auto">
              <TabsTrigger value="photos" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                Photos <span className="opacity-55 ml-[6px]">{myPhotos.length}</span>
              </TabsTrigger>
              <TabsTrigger value="galleries" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                Galleries <span className="opacity-55 ml-[6px]">{myGalleries.length}</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                Favorites <span className="opacity-55 ml-[6px]">{myFavorites.length}</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="px-0 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                About
              </TabsTrigger>
            </TabsList>

            {/* Tab content */}
            <div className="py-[48px] pb-[80px]">

              {/* Photos tab */}
              <TabsContent value="photos">
                {myPhotos.length > 0
                  ? <PhotoGrid photos={myPhotos} cols={3} showLike />
                  : <ProfileEmpty msg="ยังไม่มีภาพในโปรไฟล์นี้" />
                }
              </TabsContent>

              {/* Galleries tab */}
              <TabsContent value="galleries">
                {myGalleries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {myGalleries.map((g, i) => (
                      <div key={i} className="cursor-pointer">
                        <div className="aspect-[4/3] bg-tile overflow-hidden">
                          {g.cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={g.cover}
                              alt={g.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="mt-4 flex justify-between items-baseline">
                          <div className="text-[18px] font-medium tracking-[-0.01em]">{g.title}</div>
                          <span className="mono text-[11px] opacity-55">{g.count} photos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ProfileEmpty msg="ยังไม่มีแกลเลอรี่ในโปรไฟล์นี้" />
                )}
              </TabsContent>

              {/* Favorites tab */}
              <TabsContent value="favorites">
                <div>
                  <p className="th text-[14px] text-fg-soft mt-0 mb-8 max-w-[600px]">
                    ภาพที่ {photographer.name.split(' ')[0]} เลือกบันทึกไว้ — ตั้งเป็น public โดยช่างภาพ
                  </p>
                  {myFavorites.length > 0 ? (
                    <PhotoGrid photos={myFavorites} cols={3} showLike />
                  ) : (
                    <ProfileEmpty msg="ยังไม่มีภาพที่บันทึกไว้" />
                  )}
                </div>
              </TabsContent>

              {/* About tab */}
              <TabsContent value="about">
                <div>
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
                            <span className="mono font-medium">3</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-rule">
                            <span>Current rank (Landscape)</span>
                            <span className="mono font-medium">#7</span>
                          </div>
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
                      <p className="th text-[15px] leading-[1.75] text-fg-soft mt-4">
                        ในฤดูกาลที่ผ่านมาเริ่มหันมาทำงานในรูปแบบยาว — สนใจกระบวนการของแสง การรอ และการสะสมภาพในที่เดียวเป็นเวลาหลายปี
                      </p>
                    </div>
                    <div>
                      <div className="caps opacity-55 mb-4">Gear</div>
                      <ul className="list-none p-0 m-0 mono">
                        {photographer.cameras.map((c: string) => (
                          <li key={c} className="py-3 border-b border-rule text-[13px]">{c}</li>
                        ))}
                      </ul>
                      <div className="caps opacity-55 mb-4 mt-8">Categories</div>
                      <ul className="list-none p-0 m-0 mono">
                        {myCategories.map((c: string) => (
                          <li key={c} className="py-3 border-b border-rule text-[13px]">{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
