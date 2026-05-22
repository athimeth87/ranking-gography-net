'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import type { Category } from '@/lib/types';

// ---------------------------------------------------------------------------
// Apply as Photographer — portfolio submission form (3-step wizard + success)
// ---------------------------------------------------------------------------

interface ApplyForm {
  name: string;
  username: string;
  email: string;
  portfolio: string;
  instagram: string;
  website: string;
  category: Category;
  experience: string;
  statement: string;
  sampleUrls: [string, string, string];
}

interface FieldXProps {
  label: string;
  sub?: string;
  children: React.ReactNode;
}

function FieldX({ label, sub, children }: FieldXProps) {
  return (
    <label className="block mb-6">
      <div className="flex justify-between items-baseline mb-[10px]">
        <span className="caps opacity-65">{label}</span>
        {sub && <span className="mono text-[10.5px] opacity-45">{sub}</span>}
      </div>
      {children}
    </label>
  );
}

export default function ApplyPhotographerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplyForm>({
    name: '',
    username: '',
    email: '',
    portfolio: '',
    instagram: '',
    website: '',
    category: 'Landscape',
    experience: '3+',
    statement: '',
    sampleUrls: ['', '', ''],
  });

  const set = <K extends keyof ApplyForm>(k: K, v: ApplyForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Step 4 = success screen
  if (step === 4) {
    return (
      <div className="page-fade py-[120px]">
        <div className="wrap-narrow text-center">
          <div className="caps opacity-55 mb-6">✓ Submitted</div>
          <h1 className="display-hero th text-[clamp(48px,5vw,72px)] m-0">
            Your application<br />is with our team
          </h1>
          <p className="th mt-6 text-[16px] text-fg-soft leading-[1.7]">
            ทีม Editorial จะตรวจสอบ portfolio ของคุณภายใน 7 วันทำการ — เมื่ออนุมัติแล้ว คุณจะได้รับอีเมลพร้อมสิทธิ์อัพโหลดภาพ
          </p>
          <div className="flex justify-center gap-4 mt-10">
            <button className="btn" onClick={() => router.push('/explore')}>Browse photos</button>
            <button className="btn btn-solid" onClick={() => router.push('/')}>Back to home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const steps = [
    { n: 1, l: 'About you' },
    { n: 2, l: 'Portfolio' },
    { n: 3, l: 'Statement' },
  ];

  return (
    <div className="page-fade">
      {/* Hero */}
      <section className="pt-16 pb-8">
        <div className="wrap">
          <div className="caps opacity-55 mb-[14px]">Apply as photographer</div>
          <div
            className="grid items-end grid-cols-[1.4fr_1fr] gap-20"
          >
            <h1 className="display-hero th text-[clamp(48px,6vw,88px)] m-0">
              Submit your portfolio<br />for upload access
            </h1>
            <p className="th text-[15px] leading-[1.65] text-fg-soft m-0">
              เราเปิดรับช่างภาพมือสมัครเล่นและอาชีพ — ทีม Editorial จะตรวจสอบ portfolio ของคุณก่อนอนุมัติสิทธิ์อัพโหลด (ภายใน 7 วัน)
            </p>
          </div>
        </div>
      </section>

      {/* Progress indicator */}
      <section className="py-8 border-t border-rule border-b border-rule">
        <div className="wrap">
          <div className="flex gap-0 items-center">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => step > s.n && setStep(s.n)}
                  className="flex items-center gap-3"
                  style={{
                    cursor: step > s.n ? 'pointer' : 'default', // runtime: step navigation
                    opacity: step === s.n ? 1 : 0.55, // runtime: current step
                  }}
                >
                  <span
                    className="mono w-7 h-7 border border-fg grid place-items-center text-[11px] font-medium"
                    style={{
                      background: step >= s.n ? 'var(--fg)' : 'transparent', // runtime: completed step
                      color: step >= s.n ? 'var(--bg)' : 'var(--fg)', // runtime: completed step
                    }}
                  >
                    {step > s.n ? '✓' : String(s.n).padStart(2, '0')}
                  </span>
                  <span
                    className="caps"
                    style={{ fontWeight: step === s.n ? 500 : 400 }} // runtime: active step
                  >
                    {s.l}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px bg-rule mx-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form steps */}
      <section className="pt-16 pb-24">
        <div className="wrap-narrow">
          {/* Step 1: About you */}
          {step === 1 && (
            <div>
              <h2 className="th text-[32px] font-normal tracking-[-0.02em] m-0 mb-8">About you</h2>
              <FieldX label="ชื่อจริง">
                <input
                  className="input"
                  placeholder="เช่น Kanthorn Aroonrat"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </FieldX>
              <FieldX label="Username ที่ต้องการ" sub="ตัวอักษร a-z, 0-9, จุด — ตั้งครั้งเดียวเปลี่ยนได้ทีหลัง">
                <input
                  className="input"
                  placeholder="kanthorn"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                />
              </FieldX>
              <FieldX label="Gmail" sub="ใช้สำหรับ login + ติดต่อกลับ">
                <input
                  className="input"
                  type="email"
                  placeholder="your.name@gmail.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </FieldX>
              <FieldX label="หมวดที่คุณเชี่ยวชาญ">
                <div className="grid grid-cols-3 gap-2">
                  {(['Landscape', 'Portrait', 'BW'] as Category[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => set('category', c)}
                      className="py-[14px] px-2 text-[12px] tracking-[.12em] uppercase cursor-pointer font-medium transition-colors"
                      style={{
                        border: `1px solid ${form.category === c ? 'var(--fg)' : 'var(--rule)'}`, // runtime: selected
                        background: form.category === c ? 'var(--fg)' : 'transparent', // runtime: selected
                        color: form.category === c ? 'var(--bg)' : 'var(--fg)', // runtime: selected
                      }}
                    >
                      {c === 'BW' ? 'B&W' : c}
                    </button>
                  ))}
                </div>
              </FieldX>
              <FieldX label="ประสบการณ์ถ่ายภาพ">
                <select
                  className="input"
                  value={form.experience}
                  onChange={(e) => set('experience', e.target.value)}
                >
                  <option value="0-1">น้อยกว่า 1 ปี (มือใหม่)</option>
                  <option value="1-3">1–3 ปี</option>
                  <option value="3+">3+ ปี</option>
                  <option value="10+">10+ ปี (มืออาชีพ)</option>
                </select>
              </FieldX>
              <div className="flex justify-end mt-8">
                <button
                  className="btn btn-solid"
                  disabled={!form.name || !form.username || !form.email}
                  onClick={() => setStep(2)}
                  style={{ opacity: form.name && form.username && form.email ? 1 : 0.4 }} // runtime: form validity
                >
                  ถัดไป — Portfolio
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Portfolio */}
          {step === 2 && (
            <div>
              <h2 className="th text-[32px] font-normal tracking-[-0.02em] m-0 mb-2">Portfolio</h2>
              <p className="th mt-0 mb-8 text-fg-soft text-[14px]">
                ลิงก์อย่างน้อย 1 ลิงก์ เพื่อให้ทีมตรวจสอบผลงาน
              </p>
              <FieldX label="Portfolio link (เช่น 500px, Behance, Adobe Portfolio)" sub="แนะนำ">
                <input
                  className="input"
                  placeholder="https://..."
                  value={form.portfolio}
                  onChange={(e) => set('portfolio', e.target.value)}
                />
              </FieldX>
              <FieldX label="Instagram">
                <input
                  className="input"
                  placeholder="@username"
                  value={form.instagram}
                  onChange={(e) => set('instagram', e.target.value)}
                />
              </FieldX>
              <FieldX label="Website (ถ้ามี)">
                <input
                  className="input"
                  placeholder="https://..."
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                />
              </FieldX>

              <div className="mt-8 py-6 px-7 bg-cream border border-rule">
                <div className="caps opacity-55 mb-3">OR upload sample photos</div>
                <p className="th text-[13px] text-fg-soft mb-4">
                  ถ้าไม่มี portfolio online ส่ง 3 ภาพตัวอย่างของคุณ — JPEG/PNG/WebP ≤ 25MB ต่อภาพ
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([0, 1, 2] as const).map((i) => (
                    <div
                      key={i}
                      className="aspect-square border border-dashed border-rule grid place-items-center cursor-pointer text-center p-3"
                    >
                      <div>
                        <div className="text-[24px] mono font-light opacity-55">+</div>
                        <div className="caps mt-[6px] opacity-55 text-[9.5px]">Sample {i + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
                  ← ย้อนกลับ
                </button>
                <button
                  className="btn btn-solid"
                  disabled={!form.portfolio && !form.instagram}
                  onClick={() => setStep(3)}
                  style={{ opacity: form.portfolio || form.instagram ? 1 : 0.4 }} // runtime: form validity
                >
                  ถัดไป — Statement
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Statement */}
          {step === 3 && (
            <div>
              <h2 className="th text-[32px] font-normal tracking-[-0.02em] m-0 mb-2">Statement</h2>
              <p className="th mt-0 mb-8 text-fg-soft text-[14px]">
                เล่าให้ทีมรู้ว่าทำไมคุณอยากเป็นส่วนหนึ่งของเวที
              </p>
              <FieldX label="คุณถ่ายภาพอะไร? อะไรคือสิ่งที่คุณกำลังตามล่า?" sub="200–500 ตัวอักษร">
                <textarea
                  className="input"
                  rows={8}
                  placeholder="เช่น ผมถ่ายภาพภูเขาทางเหนือมา 5 ปี เริ่มจากความหลงใหลในหมอกตอนเช้าที่ดอยอินทนนท์..."
                  value={form.statement}
                  onChange={(e) => set('statement', e.target.value)}
                />
                {/* runtime: character count from form.statement */}
                <div className="mono text-[10px] opacity-55 mt-2 text-right">
                  {form.statement.length} / 500
                </div>
              </FieldX>

              <div className="mt-8 py-5 px-6 bg-cream border border-rule">
                <div className="caps opacity-55 mb-3">What happens next</div>
                <ol className="m-0 pl-5 text-[13px] leading-[1.8] text-fg-soft th">
                  <li>ทีม Editorial ตรวจสอบ portfolio (3-7 วัน)</li>
                  <li>หากผ่าน คุณจะได้รับอีเมลพร้อม activation link</li>
                  <li>หลังจากนั้นอัพโหลดภาพแรกได้ทันที (วันละ 1 ภาพ)</li>
                </ol>
              </div>

              <div className="flex justify-between mt-8">
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>
                  ← ย้อนกลับ
                </button>
                <button
                  className="btn btn-solid"
                  disabled={form.statement.length < 50}
                  onClick={() => setStep(4)}
                  style={{ opacity: form.statement.length >= 50 ? 1 : 0.4 }} // runtime: form validity
                >
                  ส่งใบสมัคร
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
