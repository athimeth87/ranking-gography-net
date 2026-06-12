'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VoyageurMark } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { useApp } from '@/providers/AppProvider';
import { PageCover } from '@/components/layout/PageCover';
import type { Category, PhotoVisibility } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MAX_UPLOAD_BYTES, formatBytes, convertToWebP } from '@/lib/imageConvert';
import { getPresignedUploadUrl } from '@/app/actions/r2-upload';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Upload page — single photo upload form with daily limit
// Demonstrates the "1 photo per day per account" rule visually
// ---------------------------------------------------------------------------

interface DraftFile {
  name: string;
  size: number;
  url: string;
}

interface Draft {
  title: string;
  cat: Category;
  forCustomerAwards: boolean;
  caption: string;
  location: string;
  camera: string;
  lens: string;
  file: DraftFile | null;
  actualFile: File | null;
  width?: number;
  height?: number;
  visibility: PhotoVisibility;
}

// Competition quota: 1 public (เข้าประกวด) upload per day per account
const PUBLIC_DAILY_QUOTA = 1;

interface DropZoneProps {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  dragOver: boolean;
  setDragOver: React.Dispatch<React.SetStateAction<boolean>>;
}

function DropZone({ draft, setDraft, dragOver, setDragOver }: DropZoneProps) {
  const handleFile = async (f: File) => {
    if (f.size > MAX_UPLOAD_BYTES) {
      alert(`ไฟล์ใหญ่เกินไป (${formatBytes(f.size)}) — สูงสุด 5 MB`);
      return;
    }
    try {
      const result = await convertToWebP(f, { quality: 0.85 });
      const webpUrl = URL.createObjectURL(result.file);

      setDraft((d) => ({
        ...d,
        file: { name: result.file.name, size: result.file.size, url: webpUrl },
        actualFile: result.file,
        width: result.width,
        height: result.height
      }));
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการแปลงรูปภาพ: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const triggerPick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handleFile(f);
    };
    input.click();
  };

  if (draft.file) {
    return (
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={draft.file.url} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex gap-4 items-baseline">
            <span className="mono text-[12px]">{draft.file.name}</span>
            <span className="mono text-[11px] opacity-55">
              {(draft.file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <button
            onClick={() => setDraft((d) => ({ ...d, file: null }))}
            className="caps cursor-pointer border-b border-rule"
          >
            Replace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={triggerPick}
      className="aspect-square grid place-items-center cursor-pointer text-center p-10 transition-colors duration-150"
      style={{
        border: `2px dashed ${dragOver ? 'var(--fg)' : 'var(--rule)'}`, // runtime: dragOver state
        background: dragOver ? 'var(--cream)' : 'transparent', // runtime: dragOver state
      }}
    >
      <div>
        <div className="text-[64px] font-light tracking-[-0.04em] leading-none mb-4 mono">↑</div>
        <div className="th text-[18px] font-normal">Drop a photo here</div>
        <p className="th text-[14px] text-fg-soft mt-3 leading-[1.6]">
          หรือคลิกเพื่อเลือกจากเครื่อง — JPEG/PNG/WebP สูงสุด 5 MB · แปลงเป็น WebP อัตโนมัติ
        </p>
      </div>
    </div>
  );
}

interface LimitReachedStateProps {
  countdown: string;
  onView: () => void;
}

function LimitReachedState({ countdown, onView }: LimitReachedStateProps) {
  return (
    <div className="py-20 px-10 text-center max-w-[640px] mx-auto border border-rule">
      <div className="caps opacity-55 mb-6">✓ Uploaded today</div>
      <h2 className="th text-[40px] font-normal tracking-[-0.025em] m-0 leading-[1.15]">
        Today&apos;s upload is in
      </h2>
      <p className="th mt-5 text-[15px] text-fg-soft leading-[1.7]">
        ตามกติกา 1 บัญชีอัพภาพได้วันละ 1 ภาพ — ทำให้คนอื่นมีพื้นที่และรักษาคุณภาพในเวที
      </p>
      <div className="mono mt-8 py-5 px-6 bg-cream inline-block">
        <div className="text-[11px] opacity-55 tracking-[.16em]">NEXT UPLOAD WINDOW IN</div>
        {/* runtime: countdown value from timer state */}
        <div className="text-[36px] font-medium mt-[6px] tracking-[-0.02em]">{countdown}</div>
      </div>
      <div className="flex justify-center gap-3 mt-8">
        <button className="btn" onClick={onView}>ดูโปรไฟล์ของคุณ</button>
        <button className="btn">โหวตภาพอื่น</button>
      </div>
      <p className="mono mt-8 text-[11px] opacity-55">คุณยังโหวตและบันทึก favorites ได้ไม่จำกัด</p>
    </div>
  );
}

interface Field2Props {
  label: string;
  children: React.ReactNode;
}

function Field2({ label, children }: Field2Props) {
  return (
    <label className="block">
      <div className="caps opacity-55 mb-2">{label}</div>
      {children}
    </label>
  );
}

export default function UploadPage() {
  const { userState, authUser } = useApp();
  const router = useRouter();

  const [uploadedToday, setUploadedToday] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    title: '',
    cat: 'Landscape',
    forCustomerAwards: userState === 'customer',
    caption: '',
    location: '',
    camera: '',
    lens: '',
    file: null,
    actualFile: null,
    visibility: 'public',
  });
  const [dragOver, setDragOver] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showRightsAck, setShowRightsAck] = useState(false);
  const [rightsAcked, setRightsAcked] = useState(false);

  // First-upload photo-rights acknowledgement (persisted in localStorage)
  useEffect(() => {
    try {
      if (localStorage.getItem('gpa-photo-rights-ack')) setRightsAcked(true);
      else setShowRightsAck(true);
    } catch {
      setRightsAcked(true);
    }
  }, []);

  const handleRightsAck = (checked: boolean) => {
    setRightsAcked(checked);
    if (checked) {
      try { localStorage.setItem('gpa-photo-rights-ack', '1'); } catch {}
    }
  };

  const limitReached = false; // uploads themselves are never blocked — only the public option

  // Today's competition (visibility = 'public') uploads — drives the quota
  useEffect(() => {
    if (!authUser?.id) return;
    const fetchTodayPublicCount = async () => {
      const supabase = getSupabaseBrowserClient();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('photographer_id', authUser.id)
        .eq('visibility', 'public')
        .gte('uploaded_at', startOfDay.toISOString());
      setUploadedToday(count || 0);
    };
    fetchTodayPublicCount();
  }, [authUser]);

  const publicQuotaUsed = uploadedToday >= PUBLIC_DAILY_QUOTA;
  const publicQuotaLeft = Math.max(0, PUBLIC_DAILY_QUOTA - uploadedToday);

  // If today's competition quota is used, fall back to portfolio
  useEffect(() => {
    if (publicQuotaUsed) {
      setDraft((d) => (d.visibility === 'public' ? { ...d, visibility: 'portfolio' } : d));
    }
  }, [publicQuotaUsed]);

  // Countdown to midnight (Bangkok)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextMid = new Date(now);
      nextMid.setHours(24, 0, 0, 0);
      const ms = nextMid.getTime() - now.getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async () => {
    if (limitReached || !draft.file || !draft.actualFile || !authUser?.id || !rightsAcked) return;
    // Only competition entries consume the daily quota
    if (draft.visibility === 'public' && publicQuotaUsed) return;
    setIsUploading(true);

    const supabase = getSupabaseBrowserClient();

    // draft.actualFile is already converted to WebP in handleFile()
    const fileName = `${authUser.id}/${Date.now()}.webp`;

    const { success, url, publicUrl, error: uploadError } = await getPresignedUploadUrl(fileName, 'image/webp');
    
    if (!success || !url || !publicUrl) {
      alert('Failed to get upload URL: ' + uploadError);
      setIsUploading(false);
      return;
    }

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: draft.actualFile,
      headers: {
        'Content-Type': 'image/webp',
      },
    });

    if (!uploadRes.ok) {
      alert('Upload failed: ' + uploadRes.statusText);
      setIsUploading(false);
      return;
    }

    const slug = `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const { error: dbError } = await supabase.from('photos').insert({
      photographer_id: authUser.id,
      title: draft.title,
      slug: slug,
      description: draft.caption,
      category: draft.cat.toLowerCase(),
      location: draft.location.trim() || 'EARTH',
      camera: draft.camera,
      lens: draft.lens,
      storage_url: publicUrl,
      width: draft.width || 4,
      height: draft.height || 3,
      likes_count: 0,
      favorites_count: 0,
      visibility: draft.visibility
    });

    if (dbError) {
      alert('Database error: ' + dbError.message);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    if (draft.visibility === 'public') setUploadedToday((c) => c + 1);
    // Reset draft so the user can upload another photo right away
    setDraft({
      title: '',
      cat: 'Landscape',
      forCustomerAwards: userState === 'customer',
      caption: '',
      location: '',
      camera: '',
      lens: '',
      file: null,
      actualFile: null,
      visibility: draft.visibility === 'public' ? 'portfolio' : draft.visibility,
    });
    toast.success('อัปโหลดสำเร็จแล้ว!', {
      description:
        draft.visibility === 'public'
          ? 'ภาพของคุณเข้าประกวด Season แล้ว'
          : draft.visibility === 'portfolio'
          ? 'ภาพถูกเพิ่มลงพอร์ตของคุณแล้ว'
          : 'ภาพถูกเก็บในลิ้นชัก — เห็นเฉพาะคุณ',
    });
    router.push(profilePath);
  };

  const profilePath =
    '/photographer/' + (userState === 'customer' ? 'pim.travels' : 'kanthorn');

  return (
    <div className="page-fade">
      <PageCover
        eyebrow="Upload"
        title="Submit a photo"
        subtitle="อัพโหลดได้ไม่จำกัด — JPEG/PNG/WebP สูงสุด 5 MB · แปลงเป็น .webp อัตโนมัติ"
      />
      <section className="pt-12 pb-8">
        <div className="wrap">
          <div className="flex justify-between items-baseline pb-7 border-b border-rule">
            <div>
              <div className="caps opacity-55 mb-[14px]">Upload</div>
              <h1 className="th text-[clamp(40px,4.6vw,56px)] font-normal tracking-[-0.025em] m-0 leading-none">
                Submit a photo
              </h1>
            </div>

            {/* Unlimited uploads notice */}
            <div className="text-right">
              <div className="caps opacity-55 mb-2">Daily upload</div>
              <div className="flex items-baseline gap-[6px] justify-end">
                <span className="mono text-[32px] font-medium tracking-[-0.02em] leading-none">
                  ∞
                </span>
                <span className="mono text-[14px] opacity-55 ml-2">UNLIMITED</span>
              </div>
              <div className="mono text-[11px] opacity-55 mt-2">
                NO DAILY CAP
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-10 pb-20">
        <div className="wrap">
          {limitReached ? (
            <LimitReachedState countdown={countdown} onView={() => router.push(profilePath)} />
          ) : (
            <div
              className="grid gap-16 grid-cols-[1.4fr_1fr]"
            >
              {/* Left: drop zone + preview */}
              <div>
                <DropZone
                  draft={draft}
                  setDraft={setDraft}
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                />

                {/* Unlimited uploads notice */}
                <div className="mt-6 py-[18px] px-6 bg-cream border border-rule flex justify-between items-center">
                  <div>
                    <div className="th text-[14px] font-medium">อัพโหลดได้ไม่จำกัด</div>
                    <div className="th text-[14px] text-fg-soft mt-1">
                      ไม่มี cap ต่อวัน · โหวตภาพอื่นได้ไม่จำกัด
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: metadata form */}
              <div>
                <div className="caps opacity-55 mb-6">Metadata</div>
                <div className="flex flex-col gap-5">
                  <Field2 label="ชื่อภาพ">
                    <input
                      className="input"
                      placeholder="เช่น Morning fog, Doi Inthanon"
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    />
                  </Field2>

                  <Field2 label="หมวด">
                    <div className="grid grid-cols-3 gap-2">
                      {(['Landscape', 'Portrait', 'BW'] as Category[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => setDraft((d) => ({ ...d, cat: c }))}
                          className="py-[14px] px-2 text-[12px] tracking-[.12em] uppercase cursor-pointer font-medium transition-colors"
                          style={{
                            border: `1px solid ${draft.cat === c ? 'var(--fg)' : 'var(--rule)'}`, // runtime: selected cat
                            background: draft.cat === c ? 'var(--fg)' : 'transparent', // runtime: selected cat
                            color: draft.cat === c ? 'var(--bg)' : 'var(--fg)', // runtime: selected cat
                          }}
                        >
                          {c === 'BW' ? 'B&W' : c}
                        </button>
                      ))}
                    </div>
                  </Field2>

                  {userState === 'customer' && (
                    <Field2 label="ส่งเข้าประเภทใด?">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDraft((d) => ({ ...d, forCustomerAwards: false }))}
                          className="py-5 px-4 text-left cursor-pointer flex flex-col gap-[6px] text-fg transition-colors"
                          style={{
                            border: `1px solid ${!draft.forCustomerAwards ? 'var(--fg)' : 'var(--rule)'}`, // runtime: selection
                            background: !draft.forCustomerAwards ? 'var(--cream)' : 'transparent', // runtime: selection
                          }}
                        >
                          <div className="caps text-[9px] opacity-55">General</div>
                          <div className="text-[15px] font-medium">หมวดทั่วไป</div>
                          <div className="th text-[14px] text-fg-soft leading-[1.5]">
                            แข่งกับทุกคน · เข้า Pulse Score
                          </div>
                        </button>
                        <button
                          onClick={() => setDraft((d) => ({ ...d, forCustomerAwards: true }))}
                          className="py-5 px-4 text-left cursor-pointer flex flex-col gap-[6px] transition-colors"
                          style={{
                            border: `1px solid ${draft.forCustomerAwards ? 'var(--fg)' : 'var(--rule)'}`, // runtime: selection
                            background: draft.forCustomerAwards ? 'var(--fg)' : 'transparent', // runtime: selection
                            color: draft.forCustomerAwards ? 'var(--bg)' : 'var(--fg)', // runtime: selection
                          }}
                        >
                          <div
                            className="caps text-[9px] flex items-center gap-[6px]"
                            style={{ opacity: draft.forCustomerAwards ? 0.7 : 0.55 }} // runtime: selection
                          >
                            <VoyageurMark size={7} /> Travellers
                          </div>
                          <div className="text-[15px] font-medium">หมวดลูกค้า</div>
                          <div className="th text-[14px] opacity-70 leading-[1.5]">
                            แข่งเฉพาะ Traveller · ลุ้น 50,000 THB
                          </div>
                        </button>
                      </div>
                      <div className="mono mt-[10px] text-[10.5px] opacity-55">
                        คุณเลือกได้เพราะคุณคือ Traveller — ภาพเดียวเลือกได้เพียงหมวดเดียว
                      </div>
                    </Field2>
                  )}

                  {userState !== 'customer' && (
                    <div className="py-[14px] px-4 bg-cream border border-rule text-[12px] leading-[1.6] flex justify-between items-center">
                      <span>My photos จะถูกส่งเข้า <strong>หมวดทั่วไป</strong></span>
                      <Link
                        href="/for-customers"
                        className="caps opacity-60 text-[10px] border-b border-rule pb-[2px]"
                      >
                        About Travellers →
                      </Link>
                    </div>
                  )}

                  <div role="radiogroup" aria-label="ส่งภาพแบบไหน">
                    <div className="caps opacity-55 mb-2">ส่งภาพแบบไหน</div>
                    <div className="flex flex-col gap-2">
                      {([
                        {
                          v: 'public' as PhotoVisibility,
                          title: 'เข้าประกวด Season',
                          sub: publicQuotaUsed
                            ? 'คุณใช้โควต้าเข้าประกวดของวันนี้แล้ว (รีเซ็ตเวลา 00:00 น.)'
                            : draft.visibility === 'public'
                            ? `นับคะแนน ขึ้น feed · โควต้าวันนี้เหลือ ${publicQuotaLeft}/${PUBLIC_DAILY_QUOTA}`
                            : 'นับคะแนน ขึ้น feed',
                          disabled: publicQuotaUsed,
                        },
                        {
                          v: 'portfolio' as PhotoVisibility,
                          title: 'โชว์ในพอร์ต',
                          sub: 'ไม่เข้าประกวด ไม่นับคะแนน ไม่ใช้โควต้า',
                          disabled: false,
                        },
                        {
                          v: 'private' as PhotoVisibility,
                          title: 'เก็บในลิ้นชัก',
                          sub: 'เห็นคนเดียว ปล่อยทีหลังได้',
                          disabled: false,
                        },
                      ]).map((o) => (
                        <label
                          key={o.v}
                          className="flex items-start gap-3 py-[14px] px-4 transition-colors"
                          style={{
                            border: `1px solid ${draft.visibility === o.v ? 'var(--fg)' : 'var(--rule)'}`, // runtime: selection
                            background: draft.visibility === o.v ? 'var(--cream)' : 'transparent', // runtime: selection
                            opacity: o.disabled ? 0.45 : 1, // runtime: quota state
                            cursor: o.disabled ? 'not-allowed' : 'pointer', // runtime: quota state
                          }}
                        >
                          <input
                            type="radio"
                            name="upload-visibility"
                            className="mt-[3px] accent-current cursor-pointer"
                            checked={draft.visibility === o.v}
                            disabled={o.disabled}
                            onChange={() => setDraft((d) => ({ ...d, visibility: o.v }))}
                          />
                          <span>
                            <span className="th text-[15px] font-medium block">{o.title}</span>
                            <span className="th text-[13px] text-fg-soft block mt-[2px] leading-[1.5]">{o.sub}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Field2 label="คำบรรยายภาพ">
                    <textarea
                      className="input"
                      rows={4}
                      placeholder="เล่าเรื่องของภาพ — สถานที่ เวลา หรือบริบทเล็กๆ"
                      value={draft.caption}
                      onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                    />
                  </Field2>

                  <Field2 label="สถานที่ (Location) (ไม่บังคับ)">
                    <input
                      className="input"
                      placeholder="เช่น Chiang Mai, Thailand"
                      value={draft.location}
                      onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                    />
                  </Field2>

                  <div className="grid grid-cols-2 gap-4">
                    <Field2 label="กล้อง (Camera)">
                      <input
                        className="input"
                        placeholder="เช่น Sony A7R V"
                        value={draft.camera}
                        onChange={(e) => setDraft((d) => ({ ...d, camera: e.target.value }))}
                      />
                    </Field2>
                    <Field2 label="เลนส์ (Lens)">
                      <input
                        className="input"
                        placeholder="เช่น 24-70mm f/2.8 GM"
                        value={draft.lens}
                        onChange={(e) => setDraft((d) => ({ ...d, lens: e.target.value }))}
                      />
                    </Field2>
                  </div>

                  {showRightsAck && (
                    <label className="flex items-start gap-3 py-[14px] px-4 bg-cream border border-rule cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-[3px] accent-current cursor-pointer"
                        checked={rightsAcked}
                        onChange={(e) => handleRightsAck(e.target.checked)}
                      />
                      <span className="th text-[13px] leading-[1.7]">
                        <span className="caps block opacity-55 mb-1">Photo Rights</span>
                        ภาพเป็นของคุณ 100% · เราแสดงเฉพาะในบริบทของ Ranking ·{' '}
                        <Link href="/photo-rights" target="_blank" className="border-b border-rule pb-[1px]">
                          อ่านฉบับเต็ม →
                        </Link>
                      </span>
                    </label>
                  )}

                  <button
                    className={`btn ${!draft.file || !draft.title || isUploading || !rightsAcked ? 'btn-ghost' : 'btn-solid'} mt-3 justify-center`}
                    disabled={!draft.file || !draft.title || isUploading || !rightsAcked}
                    onClick={handleSubmit}
                    style={{ opacity: !draft.file || !draft.title || isUploading || !rightsAcked ? 0.35 : 1 }} // runtime: form validity state
                  >
                    {!draft.file ? 'เลือกภาพก่อน' : !draft.title ? 'ใส่ชื่อภาพ' : !rightsAcked ? 'ยืนยันเรื่องลิขสิทธิ์ภาพก่อน' : isUploading ? 'Uploading...' : 'Submit a photo'}
                  </button>
                  <p className="mono text-[11px] opacity-55 text-center leading-[1.7]">
                    หลังจากส่งแล้ว ภาพจะปรากฏใน Explore ทันที — และคุณจะกลับมาอัพภาพถัดไปได้พรุ่งนี้
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
