'use client';
import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SettingsBlock, Field3, Row2 } from './primitives';
import type { Photographer } from '@/lib/types';

interface SettingsForm {
  email_likes?: boolean;
  email_picks?: boolean;
  email_voyageur?: boolean;
  email_news?: boolean;
  fav_public?: boolean;
  in_directory?: boolean;
  allow_comments?: boolean;
}

interface ToggleRowProps {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, sub, value, onChange, disabled = false }: ToggleRowProps) {
  return (
    <div
      className="flex justify-between items-center py-4 border-b border-rule"
      style={{ opacity: disabled ? 0.4 : 1 }} // runtime: disabled state
    >
      <div>
        <div className="th text-[14px] font-medium">{label}</div>
        <div className="th text-[12px] text-fg-soft mt-1">{sub}</div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={(checked) => !disabled && onChange(checked)}
        disabled={disabled}
      />
    </div>
  );
}

interface MeSettingsProps {
  persona: Photographer;
  isVoyageur: boolean;
}

export function MeSettings({ persona, isVoyageur }: MeSettingsProps) {
  const [form, setForm] = useState<SettingsForm>(() => {
    try {
      return JSON.parse(localStorage.getItem('gpa-settings') || '{}') as SettingsForm;
    } catch {
      return {};
    }
  });

  const set = (k: keyof SettingsForm, v: boolean) => {
    const next: SettingsForm = { ...form, [k]: v };
    setForm(next);
    try {
      localStorage.setItem('gpa-settings', JSON.stringify(next));
    } catch {}
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const { authUser } = useApp();
  
  // Controlled inputs for Profile Form
  const [displayName, setDisplayName] = useState(persona.name || '');
  const [username, setUsername] = useState(persona.username || '');
  const [bio, setBio] = useState(persona.bio || '');
  // @ts-ignore: persona may not have website defined in type yet
  const [website, setWebsite] = useState(persona.website || '');

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setToastMsg('');
    const supabase = getSupabaseBrowserClient();
    
    if (supabase && authUser?.id) {
      const { error } = await supabase.from('users').update({
        display_name: displayName,
        username: username,
        bio: bio,
        portfolio_url: website
      }).eq('id', authUser.id);
      
      if (error) {
        setToastMsg('Error: ' + error.message);
      } else {
        setSaveSuccess(true);
        setToastMsg('Profile saved successfully! ✨');
      }
    } else {
      setToastMsg('Error: Unable to connect to database or not logged in.');
    }

    setIsSaving(false);
    setTimeout(() => {
      setToastMsg('');
      setSaveSuccess(false);
    }, 4000);
  };

  return (
    <div className="relative">
      {/* UI Toast */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[var(--fg)] text-[var(--bg)] px-6 py-3 rounded-full text-[13px] font-medium shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {toastMsg}
        </div>
      )}

      <div className="caps opacity-55 mb-[14px]">Account</div>
      <h1 className="th text-[36px] md:text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">Settings</h1>

      {/* Profile */}
      <SettingsBlock title="Profile">
        <div className="flex gap-6 items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-tile overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={persona.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <button className="btn btn-sm btn-ghost">Change photo</button>
        </div>
        <Row2>
          <Field3 label="Display name">
            <Input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </Field3>
          <Field3 label="Username">
            <Input className="input" value={username} onChange={e => setUsername(e.target.value)} />
          </Field3>
        </Row2>
        <Field3 label="Bio">
          <Textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} />
        </Field3>
        <Row2>
          <Field3 label="Website">
            <Input className="input" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
          </Field3>
        </Row2>
        <button 
          onClick={handleSaveProfile} 
          disabled={isSaving}
          className="btn btn-solid btn-sm mt-6"
        >
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save profile'}
        </button>
      </SettingsBlock>

      {/* Notifications */}
      <SettingsBlock title="Notifications">
        <ToggleRow
          label="Email — Likes & favorites"
          sub="ส่งทุก 24 ชม. (digest)"
          value={form.email_likes !== false}
          onChange={(v) => set('email_likes', v)}
        />
        <ToggleRow
          label="Email — Editor's Pick"
          sub="ส่งทันทีเมื่อภาพคุณถูกเลือก"
          value={form.email_picks !== false}
          onChange={(v) => set('email_picks', v)}
        />
        <ToggleRow
          label="Email — Voyageurs Awards updates"
          sub="เฉพาะ Voyageur"
          value={form.email_voyageur === true}
          onChange={(v) => set('email_voyageur', v)}
          disabled={!isVoyageur}
        />
        <ToggleRow
          label="Email — Newsletter"
          sub="เดือนละ 1 ครั้ง"
          value={form.email_news === true}
          onChange={(v) => set('email_news', v)}
        />
      </SettingsBlock>

      {/* Privacy */}
      <SettingsBlock title="Privacy">
        <ToggleRow
          label="Public favorites"
          sub="แสดงภาพที่บันทึกไว้บน profile public"
          value={form.fav_public === true}
          onChange={(v) => set('fav_public', v)}
        />
        <ToggleRow
          label="Show in directory"
          sub="ให้ปรากฏในหน้า /photographers"
          value={form.in_directory !== false}
          onChange={(v) => set('in_directory', v)}
        />
        <ToggleRow
          label="Allow comments"
          sub="ให้ผู้อื่นแสดงความเห็นบนภาพคุณ"
          value={form.allow_comments !== false}
          onChange={(v) => set('allow_comments', v)}
        />
      </SettingsBlock>

      {/* Display */}
      <SettingsBlock title="Display">
        <div className="p-[14px_16px] bg-cream border border-rule text-[12px] leading-[1.6] th">
          ตั้งค่า dark mode และ visual direction ได้ผ่าน <strong>Tweaks panel</strong> ที่มุมล่างขวา — ค่าจะ persist อัตโนมัติ
        </div>
      </SettingsBlock>

      {/* Danger zone */}
      <SettingsBlock title="Danger zone" danger>
        <div className="p-[18px_22px] border border-rule">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="th text-[15px] font-medium">ลบบัญชีทั้งหมด</div>
              <p className="th text-[12px] text-fg-soft mt-[6px] leading-[1.6] max-w-[480px]">
                ภาพทุกภาพ ความเห็น และ favorites จะถูกลบถาวร — ไม่สามารถกู้คืนได้
              </p>
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn btn-sm shrink-0 border-fg"
              >
                Delete account
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setConfirmDelete(false)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
                <button
                  className="btn btn-sm bg-[#a83232] text-white border-[#a83232]"
                >
                  Confirm delete
                </button>
              </div>
            )}
          </div>
        </div>
      </SettingsBlock>
    </div>
  );
}
