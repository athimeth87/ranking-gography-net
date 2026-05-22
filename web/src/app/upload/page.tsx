'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VoyageurMark } from '@/components/icons';
import { Footer } from '@/components/layout/Footer';
import { useApp } from '@/providers/AppProvider';
import type { Category } from '@/lib/types';

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
  file: DraftFile | null;
}

interface DropZoneProps {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  dragOver: boolean;
  setDragOver: React.Dispatch<React.SetStateAction<boolean>>;
}

function DropZone({ draft, setDraft, dragOver, setDragOver }: DropZoneProps) {
  const handleFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setDraft((d) => ({ ...d, file: { name: f.name, size: f.size, url } }));
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
        <div className="aspect-[4/3] overflow-hidden bg-tile">
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
      className="aspect-[4/3] grid place-items-center cursor-pointer text-center p-10 transition-colors duration-150"
      style={{
        border: `2px dashed ${dragOver ? 'var(--fg)' : 'var(--rule)'}`, // runtime: dragOver state
        background: dragOver ? 'var(--cream)' : 'transparent', // runtime: dragOver state
      }}
    >
      <div>
        <div className="text-[64px] font-light tracking-[-0.04em] leading-none mb-4 mono">↑</div>
        <div className="th text-[18px] font-normal">Drop a photo here</div>
        <p className="th text-[13px] text-fg-soft mt-3 leading-[1.6]">
          หรือคลิกเพื่อเลือกจากเครื่อง — JPEG, PNG, WebP สูงสุด 25 MB
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
  const { userState } = useApp();
  const router = useRouter();

  const [uploadedToday, setUploadedToday] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    title: '',
    cat: 'Landscape',
    forCustomerAwards: userState === 'customer',
    caption: '',
    file: null,
  });
  const [dragOver, setDragOver] = useState(false);
  const [countdown, setCountdown] = useState('');

  const limitReached = uploadedToday >= 1;

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

  const handleSubmit = () => {
    if (limitReached || !draft.file) return;
    setUploadedToday(1);
  };

  const profilePath =
    '/photographer/' + (userState === 'customer' ? 'pim.travels' : 'kanthorn');

  return (
    <div className="page-fade">
      <section className="pt-12 pb-8">
        <div className="wrap">
          <div className="flex justify-between items-baseline pb-7 border-b border-rule">
            <div>
              <div className="caps opacity-55 mb-[14px]">Upload</div>
              <h1 className="th text-[clamp(40px,4.6vw,56px)] font-normal tracking-[-0.025em] m-0 leading-none">
                Submit a photo
              </h1>
            </div>

            {/* Daily limit counter */}
            <div className="text-right">
              <div className="caps opacity-55 mb-2">Today&apos;s upload</div>
              <div className="flex items-baseline gap-[6px] justify-end">
                {/* runtime: uploadedToday from state */}
                <span className="mono text-[48px] font-medium tracking-[-0.02em] leading-none">
                  {uploadedToday}
                </span>
                <span className="mono text-[24px] opacity-35">/1</span>
              </div>
              <div className="mono text-[11px] opacity-55 mt-2">
                {/* runtime: countdown from timer */}
                RESETS IN {countdown} (BANGKOK)
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

                {/* Daily rule notice */}
                <div className="mt-6 py-[18px] px-6 bg-cream border border-rule flex justify-between items-center">
                  <div>
                    <div className="th text-[13px] font-medium">วันละ 1 ภาพต่อบัญชี</div>
                    <div className="th text-[12px] text-fg-soft mt-1">
                      Limit รวมทุกหมวด · reset เวลา 00:00 ตามเวลาประเทศไทย · โหวตภาพอื่นได้ไม่จำกัด
                    </div>
                  </div>
                  {/* runtime: countdown from timer */}
                  <div className="mono text-[11px] opacity-55">{countdown}</div>
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
                          <div className="th text-[11px] text-fg-soft leading-[1.5]">
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
                            <VoyageurMark size={7} /> Voyageurs
                          </div>
                          <div className="text-[15px] font-medium">หมวดลูกค้า</div>
                          <div className="th text-[11px] opacity-70 leading-[1.5]">
                            แข่งเฉพาะ Voyageur · ลุ้น 50,000 THB
                          </div>
                        </button>
                      </div>
                      <div className="mono mt-[10px] text-[10.5px] opacity-55">
                        คุณเลือกได้เพราะคุณคือ Voyageur — ภาพเดียวเลือกได้เพียงหมวดเดียว
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
                        About Voyageurs →
                      </Link>
                    </div>
                  )}

                  <Field2 label="คำบรรยายภาพ">
                    <textarea
                      className="input"
                      rows={4}
                      placeholder="เล่าเรื่องของภาพ — สถานที่ เวลา หรือบริบทเล็กๆ"
                      value={draft.caption}
                      onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                    />
                  </Field2>

                  {/* EXIF preview */}
                  <div>
                    <div className="caps opacity-55 mb-3">EXIF · auto-detected</div>
                    <table className="w-full mono text-[12px] border-collapse">
                      <tbody>
                        {(
                          [
                            ['Camera', draft.file ? 'Sony A7R V' : '—'],
                            ['Lens', draft.file ? '24-70mm f/2.8 GM II' : '—'],
                            ['ISO · F · S', draft.file ? '100 · f/8.0 · 1/250' : '—'],
                          ] as [string, string][]
                        ).map(([k, v]) => (
                          <tr key={k} className="border-b border-rule">
                            <td className="py-2 opacity-55 w-[40%]">{k.toUpperCase()}</td>
                            <td className="py-2">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className={`btn ${!draft.file || !draft.title ? 'btn-ghost' : 'btn-solid'} mt-3 justify-center`}
                    disabled={!draft.file || !draft.title}
                    onClick={handleSubmit}
                    style={{ opacity: !draft.file || !draft.title ? 0.35 : 1 }} // runtime: form validity state
                  >
                    {!draft.file ? 'เลือกภาพก่อน' : !draft.title ? 'ใส่ชื่อภาพ' : 'Submit a photo'}
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
