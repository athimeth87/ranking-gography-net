'use client';
import { useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const CURATED_MAX = 12;

export interface PhotoCardCurateButtonProps {
  photoId: string;
  isCurated: boolean;
  onChanged: (id: string, isCurated: boolean) => void;
  alwaysVisible?: boolean;
}

// Owner-only action: pin/unpin a photo to the Curated Set (max 12, app-enforced).
export function PhotoCardCurateButton({ photoId, isCurated, onChanged, alwaysVisible = false }: PhotoCardCurateButtonProps) {
  const { authUser } = useApp();
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy || !authUser?.id) return;
    setBusy(true);
    const supabase = getSupabaseBrowserClient();

    if (!isCurated) {
      const { count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', authUser.id)
        .eq('is_curated', true);
      if ((count ?? 0) >= CURATED_MAX) {
        setBusy(false);
        toast.error(`ชุดคัดเต็มแล้ว (${CURATED_MAX} ชิ้น)`, {
          description: 'เอาบางภาพออกจากชุดคัดก่อน แล้วค่อยปักภาพใหม่',
        });
        return;
      }
    }

    const { error } = await supabase.from('photos').update({ is_curated: !isCurated }).eq('id', photoId);
    setBusy(false);
    if (error) {
      toast.error('อัปเดตชุดคัดไม่สำเร็จ', { description: error.message });
      return;
    }
    toast.success(isCurated ? 'เอาออกจากชุดคัดแล้ว' : 'ปักเข้าชุดคัดแล้ว');
    onChanged(photoId, !isCurated);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={busy}
      aria-label={isCurated ? 'Remove from curated set' : 'Add to curated set'}
      className={`absolute top-3 left-3 z-20 w-9 h-9 flex items-center justify-center backdrop-blur-sm transition-all disabled:opacity-50 ${
        isCurated ? 'bg-white text-black hover:bg-white/80' : 'bg-black/40 hover:bg-black/60 text-white'
      } ${alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
    >
      {isCurated ? <PinOff width={15} height={15} /> : <Pin width={15} height={15} />}
    </button>
  );
}
