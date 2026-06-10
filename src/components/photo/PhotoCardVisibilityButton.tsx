'use client';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PhotoVisibility } from '@/lib/types';

const ACTIONS: { v: PhotoVisibility; label: string }[] = [
  { v: 'public', label: 'ส่งเข้าประกวด' },
  { v: 'portfolio', label: 'ปล่อยลงพอร์ต' },
  { v: 'private', label: 'เก็บเข้าลิ้นชัก' },
];

export interface PhotoCardVisibilityButtonProps {
  photoId: string;
  visibility: PhotoVisibility;
  onChanged: (id: string, visibility: PhotoVisibility) => void;
}

// Owner-only action: move a photo between competition / portfolio / drawer.
export function PhotoCardVisibilityButton({ photoId, visibility, onChanged }: PhotoCardVisibilityButtonProps) {
  const { authUser } = useApp();
  const [busy, setBusy] = useState(false);

  const setVisibility = async (v: PhotoVisibility) => {
    if (busy || v === visibility || !authUser?.id) return;
    setBusy(true);
    const supabase = getSupabaseBrowserClient();

    if (v === 'public') {
      // Competition quota: 1 public upload per day per account
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('photographer_id', authUser.id)
        .eq('visibility', 'public')
        .gte('uploaded_at', startOfDay.toISOString());
      if ((count || 0) >= 1) {
        setBusy(false);
        toast.error('โควต้าเข้าประกวดวันนี้ครบแล้ว (1 ภาพ/วัน)', {
          description: 'ส่งภาพนี้เข้าประกวดได้อีกครั้งพรุ่งนี้ (รีเซ็ตเวลา 00:00 น.)',
        });
        return;
      }
    }

    const { error } = await supabase.from('photos').update({ visibility: v }).eq('id', photoId);
    setBusy(false);
    if (error) {
      toast.error('เปลี่ยนสถานะภาพไม่สำเร็จ', { description: error.message });
      return;
    }
    toast.success(
      v === 'public' ? 'ส่งเข้าประกวดแล้ว' : v === 'portfolio' ? 'ปล่อยลงพอร์ตแล้ว' : 'เก็บเข้าลิ้นชักแล้ว'
    );
    onChanged(photoId, v);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Change photo visibility"
        className="absolute top-3 right-14 z-20 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 data-popup-open:opacity-100"
      >
        <Eye width={15} height={15} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-[160px]" onClick={(e) => e.stopPropagation()}>
        {ACTIONS.filter((a) => a.v !== visibility).map((a) => (
          <DropdownMenuItem
            key={a.v}
            disabled={busy}
            className="th cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setVisibility(a.v); }}
          >
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
