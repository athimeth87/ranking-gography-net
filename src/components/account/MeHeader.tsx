'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VoyageurMark } from '@/components/icons';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Photographer } from '@/lib/types';

interface SectionItem {
  id: string;
  label: string;
  path: string;
  count?: number;
}

interface MeHeaderProps {
  persona: Photographer;
  isVoyageur: boolean;
  isPhotographer: boolean;
  sections: SectionItem[];
  activeSection: string;
  onAvatarUpdated?: (url: string) => void;
}

export function MeHeader({
  persona,
  isVoyageur,
  isPhotographer,
  sections,
  activeSection,
  onAvatarUpdated,
}: MeHeaderProps) {
  const router = useRouter();
  const { authUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const avatarSrc = localAvatar ?? persona.avatar;

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.id) {
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatars/${authUser.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { upsert: true });
      if (uploadError) {
        alert('อัปโหลดไม่สำเร็จ: ' + uploadError.message);
        return;
      }

      const { data: pub } = supabase.storage.from('photos').getPublicUrl(fileName);
      const publicUrl = pub.publicUrl;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id);
      if (updateError) {
        alert('บันทึกไม่สำเร็จ: ' + updateError.message);
        return;
      }

      setLocalAvatar(publicUrl);
      onAvatarUpdated?.(publicUrl);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <header>
      {/* Identity strip — single row on all viewports */}
      <div className="flex items-center gap-4 md:gap-5 pb-6 md:pb-8 border-b border-rule">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={uploading}
          className="relative w-[56px] h-[56px] md:w-[64px] md:h-[64px] rounded-full bg-tile overflow-hidden shrink-0 group cursor-pointer disabled:cursor-wait p-0 border-0"
          title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-white text-[9px] tracking-[.14em] uppercase font-medium bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden
          >
            {uploading ? '…' : 'Change'}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[17px] md:text-[20px] font-medium tracking-[-0.01em] truncate">
              {persona.name}
            </div>
            {isVoyageur && (
              <span className="inline-flex items-center gap-[5px] px-[7px] py-[3px] bg-[#b08e54] text-white text-[9px] md:text-[9.5px] tracking-[.14em] uppercase font-medium">
                <VoyageurMark size={7} /> Traveller
              </span>
            )}
            {isPhotographer && (
              <span className="inline-flex items-center gap-[5px] px-[7px] py-[3px] bg-fg text-bg text-[9px] md:text-[9.5px] tracking-[.14em] uppercase font-medium">
                ★ Photographer
              </span>
            )}
          </div>
          <div className="caps opacity-55 mt-[4px] md:mt-[6px] truncate">@{persona.username}</div>
        </div>

        <div className="shrink-0">
          {(isPhotographer || isVoyageur) ? (
            <button
              onClick={() => router.push('/upload')}
              className="btn btn-solid btn-sm whitespace-nowrap"
              aria-label="Upload photo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:hidden">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              <span className="hidden md:inline">Upload photo</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/apply-photographer')}
              className="btn btn-sm btn-ghost whitespace-nowrap"
            >
              <span className="md:hidden">Apply</span>
              <span className="hidden md:inline">Apply as photographer</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal tabs */}
      <nav className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 mt-6 mb-10 border-b border-rule">
        {sections.map((s) => {
          const active = s.id === activeSection;
          return (
            <button
              key={s.id}
              onClick={() => router.push(s.path)}
              className="relative flex items-baseline gap-[6px] whitespace-nowrap pb-3 cursor-pointer transition-opacity"
              style={{
                opacity: active ? 1 : 0.55,
                fontWeight: active ? 500 : 400,
              }}
            >
              <span className="text-[14px] tracking-[-0.005em]">{s.label}</span>
              {s.count != null && (
                <span className="mono text-[10px] opacity-65">{s.count}</span>
              )}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-fg" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
