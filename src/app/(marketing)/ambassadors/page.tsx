// Ambassadors — list of trusted curators (invite-only)

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Footer } from '@/components/layout/Footer';
import { ProfileButton, PhotoThumb } from './_components';

export const revalidate = 60; // Cache for 60 seconds

export default async function Page() {
  const supabase = getSupabaseServerClient();
  const coverSrc = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop";
  
  // Fetch ambassadors
  const { data: users } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, location, ambassador_bio, portfolio_url')
    .eq('is_ambassador', true);
    
  const ambassadors = users || [];

  // Fetch recent picks and own photos for all ambassadors
  const ambassadorIds = ambassadors.map((a: any) => a.id);
  
  let picksMap: Record<string, any[]> = {};
  
  if (ambassadorIds.length > 0) {
    // Fetch picks
    const { data: picks } = await supabase
      .from('ambassador_picks')
      .select('ambassador_id, photos(*)')
      .in('ambassador_id', ambassadorIds)
      .order('picked_at', { ascending: false })
      .limit(40);
      
    // Fetch their own photos
    const { data: ownPhotos } = await supabase
      .from('photos')
      .select('*')
      .in('photographer_id', ambassadorIds)
      .order('uploaded_at', { ascending: false })
      .limit(40);
      
    ambassadors.forEach((a: any) => {
      // Get photos picked by this ambassador
      const aPicks = (picks || [])
        .filter((p: any) => p.ambassador_id === a.id && p.photos)
        .map((p: any) => p.photos);
        
      // Get their own photos
      const aOwn = (ownPhotos || []).filter((p: any) => p.photographer_id === a.id);
      
      // Combine, prioritize picks, then fallback to own photos
      const combined = [...aPicks, ...aOwn];
      
      // Filter out duplicates by id
      const unique = Array.from(new Map(combined.map((item: any) => [item.id, item])).values());
      
      picksMap[a.username] = unique.slice(0, 4);
    });
  }

  return (
    <div className="page-fade">
      {/* ── Cinematic Hero Header ── */}
      <section className="relative overflow-hidden bg-black h-[42vh] min-h-[340px] max-h-[520px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt="Ambassadors"
          className="w-full h-full object-cover opacity-60"
          loading="eager"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.32)_0%,rgba(0,0,0,.06)_38%,rgba(0,0,0,.74)_100%)]" />

        {/* content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="wrap pb-10 md:pb-16">
            {/* eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/75">Curators</span>
              <span className="h-px w-10 bg-white/30" />
              <span className="mono text-[10px] tracking-[.3em] uppercase text-white/55 tabular-nums">{ambassadors.length} members</span>
            </div>
            {/* title */}
            <h1 className="font-display text-white font-light text-[clamp(48px,9vw,104px)] leading-[.9] tracking-[-.04em] m-0">
              Ambassadors
            </h1>
            <p className="th text-white/75 text-[15px] leading-[1.6] mt-5 mb-0 max-w-[560px]">
              ช่างภาพรับเชิญที่ GOGRAPHY ไว้วางใจให้คัดเลือก Ambassador Pick — เพิ่ม Pulse Score +50 ต่อภาพ
            </p>
          </div>
        </div>
      </section>

      <section className="pt-[40px] pb-[96px] rule-top">
        <div className="wrap">
          {ambassadors.map((a: any, i: number) => {
            const theirPicks = picksMap[a.username] || [];
            return (
              <div
                key={a.username}
                className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr_1fr] gap-8 md:gap-10 lg:gap-12 py-10 md:py-14 border-b border-[var(--rule)] items-start"
              >
                <div className="flex md:block items-center gap-5">
                  <div
                    className="w-[88px] h-[88px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden bg-[var(--tile)] shrink-0 md:mb-[20px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.avatar_url || ''}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="mono text-[10px] md:text-[11px] tracking-[.16em] uppercase opacity-55 mb-2 md:mb-[24px] hidden md:block">
                      {String(i + 1).padStart(2, '0')} of {ambassadors.length}
                    </div>
                    <h3 className="text-[22px] md:text-[28px] font-normal tracking-[-0.02em] m-0 truncate">{a.display_name || a.username}</h3>
                    <div className="caps opacity-55 mt-[6px] md:mt-[8px] truncate">
                      {a.location || 'Not set'} · @{a.username}
                    </div>
                    <div className="hidden md:block">
                      <ProfileButton username={a.username} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="caps opacity-55 mb-[12px] md:mb-[16px]">Statement</div>
                  <p className="th text-[16px] md:text-[18px] leading-[1.6] m-0 tracking-[-0.005em]">
                    {a.ambassador_bio || 'ยังไม่มีคำอธิบายตัวตน'}
                  </p>
                  <p className="th text-[14px] md:text-[14px] leading-[1.7] text-[var(--fg-soft)] mt-[16px] md:mt-[20px]">
                    คัดเลือกภาพในแนว{' '}
                    <strong className="text-[var(--fg)] font-medium">
                      {a.username === 'wattana'
                        ? 'Black & White'
                        : a.username === 'kanthorn'
                          ? 'Landscape'
                          : 'Portrait'}
                    </strong>{' '}
                    — เน้นที่ composition และจังหวะของแสง
                  </p>
                  <div className="md:hidden mt-5">
                    <ProfileButton username={a.username} />
                  </div>
                </div>
                <div>
                  <div className="caps opacity-55 mb-[12px] md:mb-[16px]">Recent picks</div>
                  <div className="grid grid-cols-4 md:grid-cols-2 gap-[8px]">
                    {theirPicks.slice(0, 4).map((p: any) => (
                      <PhotoThumb key={p.id} id={p.id} src={p.storage_url} title={p.title} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pt-[80px] pb-[120px] bg-[var(--cream)] rule-top rule-bot">
        <div className="wrap-narrow text-center">
          <div className="caps opacity-55 mb-[24px]">Become an Ambassador</div>
          <h2
            className="th text-[40px] font-normal tracking-[-0.02em] m-0 leading-[1.15]"
          >
            Ambassador programme is invite-only by the GOGRAPHY team
          </h2>
          <p className="th text-[15px] text-[var(--fg-soft)] mt-[24px] leading-[1.7]">
            หากคุณมีผลงานต่อเนื่องและได้รับ Rank Master มากกว่า 3 ครั้ง
            คุณอาจได้รับคำเชิญในฤดูกาลถัดไป
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
