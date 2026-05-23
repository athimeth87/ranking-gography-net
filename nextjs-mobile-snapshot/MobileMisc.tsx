'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PHOTOS, PHOTOGRAPHERS } from '@/lib/data';
import { useApp } from '@/components/AppProvider';
import { MobileNav, MobileFooter, MobileSectionHeader, BottomNav } from './MobileShared';

function MobileCover({ eyebrow, title, sub, photoSrc, height = 360 }: { eyebrow?: string; title: string; sub?: string; photoSrc?: string; height?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', color: '#fff', background: 'var(--tile)' }}>
      {photoSrc && <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.78) 100%)' }} />
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 24, zIndex: 2 }}>
        {eyebrow && (
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            opacity: 0.85, marginBottom: 14,
          }}>{eyebrow}</div>
        )}
        <div style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 'clamp(34px, 9vw, 56px)', lineHeight: 1.02,
          letterSpacing: '-0.02em', maxWidth: '16ch',
        }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.82, maxWidth: '32ch', marginTop: 12 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ─── SEARCH ───
export function MobileSearch() {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const photoResults = useMemo(() => q
    ? PHOTOS.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.cat.toLowerCase().includes(q.toLowerCase()) ||
        (p.caption || '').toLowerCase().includes(q.toLowerCase()) ||
        p.by.toLowerCase().includes(q.toLowerCase()))
    : [], [q]);
  const photographerResults = useMemo(() => q
    ? PHOTOGRAPHERS.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.username.toLowerCase().includes(q.toLowerCase()) ||
        p.loc.toLowerCase().includes(q.toLowerCase()))
    : [], [q]);

  const suggestions = ['Patagonia', 'Doi Inthanon', 'Portrait', 'Leica', 'fog', 'Wattana', 'Black & White'];

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff', color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />
      <section style={{ padding: '32px 16px 0' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', color: 'var(--fg-soft)', textTransform: 'uppercase',
        }}>— Search</div>
        <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: `2px solid ${dark ? '#fff' : '#000'}`, paddingBottom: 12, marginTop: 16 }}>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ค้นหาภาพ ช่างภาพ..."
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 0,
              color: 'inherit', fontFamily: "'Noto Sans Thai', sans-serif",
              fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em',
            }}
          />
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
            color: 'var(--fg-soft)', letterSpacing: '0.06em', whiteSpace: 'nowrap',
          }}>{q ? `${photoResults.length + photographerResults.length} hits` : 'type'}</span>
        </div>

        {!q && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--fg-soft)', marginBottom: 12,
            }}>Suggested</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setQ(s)} style={{
                  height: 36, padding: '0 14px',
                  border: '1px solid var(--rule-strong)', background: 'transparent',
                  color: 'inherit', fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {q && photographerResults.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--fg-soft)', marginBottom: 12,
            }}>Photographers · {photographerResults.length}</div>
            <div style={{ display: 'grid', gap: 0 }}>
              {photographerResults.map(p => (
                <Link key={p.username} href={`/photographer/${p.username}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderTop: '1px solid var(--rule)', color: 'inherit', textDecoration: 'none',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--tile)', overflow: 'hidden', flexShrink: 0 }}>
                    {p.avatar && <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--fg-soft)', marginTop: 2,
                    }}>{p.loc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {q && photoResults.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--fg-soft)', marginBottom: 12,
            }}>Photos · {photoResults.length}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {photoResults.map(p => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/photo/${p.id}`)}
                  style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <img src={p.src} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {q && photoResults.length === 0 && photographerResults.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 24 }}>
              ไม่พบผลลัพธ์สำหรับ "{q}"
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-soft)', marginTop: 12 }}>ลองค้นหาด้วยคำอื่น</p>
          </div>
        )}
      </section>

      <div style={{ height: 80 }} />
      <MobileFooter />
      <BottomNav />
    </div>
  );
}

// ─── AMBASSADORS ───
export function MobileAmbassadors() {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  const ambassadors = PHOTOGRAPHERS.filter(p => p.isAmbassador);
  const coverPhoto = PHOTOS.find(p => p.id === 'p002') || PHOTOS[0];

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff', color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />
      <MobileCover
        eyebrow="— Ambassadors"
        title="Ambassadors"
        sub="ช่างภาพรับเชิญที่ GOGRAPHY ไว้วางใจให้คัดเลือก Ambassador Pick — เพิ่ม Pulse Score +50 ต่อภาพ"
        photoSrc={coverPhoto.src}
      />

      <section style={{ padding: '32px 16px 0' }}>
        <MobileSectionHeader num={`${ambassadors.length}`} title="Editorial team" />
        <div style={{ marginTop: 20, display: 'grid', gap: 20 }}>
          {ambassadors.map(p => {
            const theirPhotos = PHOTOS.filter(ph => ph.by === p.username).slice(0, 3);
            return (
              <article
                key={p.username}
                onClick={() => router.push(`/photographer/${p.username}`)}
                style={{
                  border: '1px solid var(--rule)', padding: 14, cursor: 'pointer',
                  background: dark ? '#0a0a0a' : 'var(--bg)',
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--tile)', flexShrink: 0 }}>
                    {p.avatar && <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      opacity: 0.55, marginBottom: 4,
                    }}>★ Ambassador</div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{p.name}</div>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--fg-soft)', marginTop: 2,
                    }}>{p.loc}</div>
                  </div>
                </div>
                {p.bio && <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--fg-soft)', margin: '14px 0 0' }}>{p.bio}</p>}
                {theirPhotos.length > 0 && (
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {theirPhotos.map(ph => (
                      <div key={ph.id} style={{ aspectRatio: '1', background: 'var(--tile)', overflow: 'hidden' }}>
                        <img src={ph.src} alt={ph.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div style={{ height: 64 }} />
      <MobileFooter />
      <BottomNav />
    </div>
  );
}

// ─── APPLY PHOTOGRAPHER ───
export function MobileApplyPhotographer() {
  const { theme } = useApp();
  const dark = theme === 'dark';
  const coverPhoto = PHOTOS.find(p => p.id === 'p005') || PHOTOS[0];

  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff', color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />
      <MobileCover
        eyebrow="— Apply"
        title="Submit your portfolio"
        sub="เราเปิดรับช่างภาพมือสมัครเล่นและอาชีพ — ทีม Editorial จะตรวจสอบ portfolio ของคุณก่อนอนุมัติสิทธิ์อัพโหลด (ภายใน 7 วัน)"
        photoSrc={coverPhoto.src}
        height={400}
      />

      <section style={{ padding: '40px 16px 0' }}>
        <MobileSectionHeader num="01 / Process" title="Four steps to approval." />
        <div style={{ marginTop: 20 }}>
          {[
            { n: '01', t: 'Send 5–10 best frames',  b: 'แสดงสไตล์ของคุณชัดเจน — landscape / portrait / B&W' },
            { n: '02', t: 'Brief bio + Instagram',  b: 'พื้นที่ที่ถ่ายบ่อย และตัวอย่างผลงานก่อนหน้า' },
            { n: '03', t: 'Editorial review',         b: 'ทีมงานตรวจสอบภายใน 7 วันทำการ' },
            { n: '04', t: 'Upload access',            b: 'หากผ่าน คุณจะได้สิทธิ์อัพโหลดทันที 12 ภาพต่อฤดูกาล' },
          ].map((s, i, a) => (
            <div key={s.n} style={{
              padding: '20px 0',
              borderBottom: i < a.length - 1 ? '1px solid var(--rule)' : 0,
              display: 'grid', gridTemplateColumns: '52px 1fr', gap: 16,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 500 }}>{s.n}</div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif", fontWeight: 700,
                  fontSize: 20, letterSpacing: '-0.01em',
                }}>{s.t}</h3>
                <p style={{
                  fontFamily: "'Noto Sans Thai', sans-serif",
                  margin: '8px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--fg-soft)',
                }}>{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '40px 16px 56px' }}>
        <a
          href="mailto:apply@gography.net?subject=Portfolio%20submission"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', minHeight: 52, padding: '0 18px',
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff',
            textDecoration: 'none',
          }}
        >Email your portfolio</a>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          letterSpacing: '0.08em', color: 'var(--fg-soft)', textAlign: 'center', marginTop: 14,
        }}>apply@gography.net</p>
      </section>

      <MobileFooter />
      <BottomNav />
    </div>
  );
}

// ─── SHOWCASE (just a notice — desktop reference only) ───
export function MobileShowcase() {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff', color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />
      <section style={{ padding: '80px 24px', textAlign: 'center', flex: 1 }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--fg-soft)', marginBottom: 14,
        }}>— UI Showcase</div>
        <h1 style={{
          margin: '0 0 16px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.01em',
        }}>Developer reference</h1>
        <p style={{
          fontFamily: "'Noto Sans Thai', sans-serif",
          fontSize: 14, lineHeight: 1.65, color: 'var(--fg-soft)',
          maxWidth: '30ch', margin: '0 auto',
        }}>หน้านี้สำหรับ developer ดู component reference — แนะนำให้เปิดบน desktop</p>
        <button onClick={() => router.push('/')} style={{
          marginTop: 32, minHeight: 44, padding: '0 22px',
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          background: 'transparent', color: 'inherit',
          border: `1px solid ${dark ? '#fff' : '#000'}`, cursor: 'pointer',
        }}>Back to home</button>
      </section>
      <MobileFooter />
      <BottomNav />
    </div>
  );
}

// ─── UPLOAD (Coming Soon) ───
export function MobileUpload() {
  const router = useRouter();
  const { theme } = useApp();
  const dark = theme === 'dark';
  return (
    <div className="gpa-mobile" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: dark ? '#0a0a0a' : '#fff', color: dark ? '#fff' : '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <MobileNav />
      <section style={{ padding: '80px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--fg-soft)', marginBottom: 14,
        }}>— Submit</div>
        <h1 style={{
          margin: '0 0 16px',
          fontFamily: "'Playfair Display', serif", fontWeight: 700,
          fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>Coming soon</h1>
        <p style={{
          fontFamily: "'Noto Sans Thai', sans-serif",
          fontSize: 14, lineHeight: 1.65, color: 'var(--fg-soft)',
          maxWidth: '30ch', margin: '0 auto',
        }}>ระบบอัพโหลดกำลังพัฒนา — เปิดรับช่างภาพรายแรกภายในต้น Season 04</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
          <button onClick={() => router.push('/apply-photographer')} style={{
            minHeight: 44, padding: '0 22px',
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff',
            border: 0, cursor: 'pointer',
          }}>Apply to be a photographer</button>
          <button onClick={() => router.push('/explore')} style={{
            minHeight: 44, padding: '0 22px',
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            background: 'transparent', color: 'inherit',
            border: `1px solid ${dark ? '#fff' : '#000'}`, cursor: 'pointer',
          }}>Browse Explore</button>
        </div>
      </section>
      <MobileFooter />
      <BottomNav />
    </div>
  );
}
