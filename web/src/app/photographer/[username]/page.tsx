'use client';
import { notFound } from 'next/navigation';
import { getPhotographer, getPhotographers, getPhotos } from '@/lib/data';
import type { Photo, Photographer } from '@/lib/types';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Footer } from '@/components/layout/Footer';
import { VoyageurMark, CrownIcon } from '@/components/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ===== Photographer profile — /photographer/[username] =====
// Cover-less typography-first profile; tabs: Photos / Galleries / Favorites / About

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

export default function PhotographerProfilePage({ params }: { params: { username: string } }) {
  const photographer: Photographer | undefined = getPhotographer(params.username);
  if (!photographer) notFound();

  const allPhotos: Photo[] = getPhotos();
  const myPhotos: Photo[] = allPhotos.filter((p: Photo) => p.by === photographer.username);

  const avgPulse = myPhotos.length
    ? (myPhotos.reduce((s: number, p: Photo) => s + p.pulse, 0) / myPhotos.length).toFixed(0)
    : '—';
  const editorPickCount = myPhotos.filter((p: Photo) => p.picks.includes('editor')).length;

  // Galleries tab data — drawn from photographer's own photos + allPhotos
  const galleryItems = [
    { title: 'Mae Hong Son Loop', count: 18, cover: myPhotos[0]?.src },
    { title: 'Studio sessions', count: 12, cover: allPhotos.find((p: Photo) => p.cat === 'Portrait')?.src },
    { title: 'B/W only', count: 8, cover: allPhotos.find((p: Photo) => p.cat === 'BW')?.src },
  ];

  // Favorites tab — first 6 photos (public, mocked)
  const favoritePhotos = allPhotos.slice(0, 6);

  // About tab — unique categories from this photographer's photos
  const myCategories = Array.from(new Set(myPhotos.map((p: Photo) => p.cat)));

  return (
    <div className="page-fade">
      {/* Identity header — typography-first, no cover image */}
      <section className="pt-[64px] pb-[48px] border-b border-rule">
        <div className="wrap">
          {/* Top eyebrow row */}
          <div className="flex justify-between items-center mb-[48px]">
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
              <button className="btn btn-sm btn-solid">Follow</button>
            </div>
          </div>

          {/* Big name + avatar composition */}
          <div className="grid gap-[48px] items-end grid-cols-[1fr_auto]">
            <div>
              <h1 className="th font-light m-0 leading-[.92] text-[clamp(72px,8.4vw,128px)] tracking-[-0.035em]">
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
            <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-tile shrink-0">
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
          <div className="grid grid-cols-5 gap-8 py-8 border-b border-rule mono">
            <ProfileStat label="Photos" val={photographer.photos} />
            <ProfileStat label="Followers" val={photographer.followers.toLocaleString()} />
            <ProfileStat label="Following" val="142" />
            <ProfileStat label="Pulse avg" val={avgPulse} />
            <ProfileStat label="Editor picks" val={editorPickCount} />
          </div>

          {/* Tabs — shadcn Tabs with underline look */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-rule gap-0 h-auto">
              <TabsTrigger value="photos" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                Photos <span className="opacity-55 ml-[6px]">{myPhotos.length}</span>
              </TabsTrigger>
              <TabsTrigger value="galleries" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                Galleries <span className="opacity-55 ml-[6px]">3</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="px-0 mr-8 py-5 text-[13px] tracking-[.14em] uppercase font-medium">
                Favorites <span className="opacity-55 ml-[6px]">28</span>
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
                  ? <PhotoGrid photos={myPhotos} cols={3} />
                  : <ProfileEmpty msg="ยังไม่มีภาพในโปรไฟล์นี้" />
                }
              </TabsContent>

              {/* Galleries tab */}
              <TabsContent value="galleries">
                <div className="grid grid-cols-3 gap-8">
                  {galleryItems.map((g, i) => (
                    <div key={i} className="cursor-pointer">
                      <div className="aspect-[4/3] bg-tile overflow-hidden">
                        {g.cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.cover} // runtime: cover url from gallery item (derived from photographer's photos)
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
              </TabsContent>

              {/* Favorites tab */}
              <TabsContent value="favorites">
                <div>
                  <p className="th text-[14px] text-fg-soft mt-0 mb-8 max-w-[600px]">
                    ภาพที่ {photographer.name.split(' ')[0]} เลือกบันทึกไว้ — ตั้งเป็น public โดยช่างภาพ
                  </p>
                  <PhotoGrid photos={favoritePhotos} cols={3} />
                </div>
              </TabsContent>

              {/* About tab */}
              <TabsContent value="about">
                <div>
                  {photographer.isCustomer && (
                    <div className="p-[32px_36px] bg-cream border border-rule mb-[48px] grid gap-[48px] items-center grid-cols-[1.5fr_1fr]">
                      <div>
                        <div className="caps opacity-55 mb-3 flex items-center gap-2">
                          <VoyageurMark size={9} /> Voyageur
                        </div>
                        <h3 className="th text-[26px] font-normal tracking-[-0.015em] m-0 leading-[1.25]">
                          ลูกค้าทริป Gography — มีสิทธิ์ลุ้นรางวัล Voyageurs Awards
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

                  <div className="grid grid-cols-2 gap-[80px] pt-4">
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
