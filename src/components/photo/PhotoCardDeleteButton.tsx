'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/providers/AppProvider';
import { deletePhoto } from '@/lib/data/photos-db';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export interface PhotoCardDeleteButtonProps {
  photoId: string;
  storageUrl?: string | null;
  onDeleted: (id: string) => void;
}

export function PhotoCardDeleteButton({ photoId, storageUrl, onDeleted }: PhotoCardDeleteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const openConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setBusy(true);
    const res = await deletePhoto(photoId, storageUrl ?? null, authUser);
    setBusy(false);
    setConfirmOpen(false);
    if (res.kind === 'unauth') {
      router.push(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }
    if (res.kind === 'error') {
      toast.error('ลบรูปไม่สำเร็จ', { description: res.message });
      return;
    }
    toast.success('ลบรูปแล้ว');
    onDeleted(photoId);
  };

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Delete photo"
        className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 width={15} height={15} />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="ลบรูปนี้?"
        body="การลบจะนำรูป ไลก์ คอมเมนต์ และรายการโปรดออกอย่างถาวร กู้คืนไม่ได้"
        confirmLabel="ลบรูป"
        cancelLabel="ยกเลิก"
        destructive
        busy={busy}
        onConfirm={onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
