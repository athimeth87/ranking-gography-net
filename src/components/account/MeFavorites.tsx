'use client';
import { Switch } from '@/components/ui/switch';
import { PhotoGrid } from '@/components/photo/PhotoGrid';

interface MeFavoritesProps {
  favs: any[];
  isPublic: boolean;
  onToggleVisibility: (v: boolean) => void;
}

export function MeFavorites({ favs, isPublic, onToggleVisibility }: MeFavoritesProps) {
  return (
    <div>
      <div className="caps opacity-55 mb-[14px]">Saved by you</div>
      <div className="flex justify-between items-baseline pb-6 border-b border-rule">
        <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">
          Favorites
        </h1>
        <label className="flex items-center gap-[10px] cursor-pointer">
          <Switch
            checked={isPublic}
            onCheckedChange={onToggleVisibility}
          />
          <span className="caps text-[11px]" style={{ opacity: isPublic ? 1 : 0.55 }}>
            {/* runtime: opacity depends on isPublic toggle value */}
            Show on public profile
          </span>
        </label>
      </div>
      <p className="th mt-4 text-[14px] text-fg-soft max-w-[600px] leading-[1.7]">
        ภาพที่คุณบันทึกไว้ — โดยปกติเป็นส่วนตัว สามารถเปิดให้สาธารณะเห็นได้บน profile ของคุณ
      </p>
      <div className="mt-8">
        {favs.length > 0 ? (
          <PhotoGrid photos={favs} cols={3} uniform />
        ) : (
          <div className="text-center py-20 border border-rule">
            <p className="th text-[14px] text-fg-soft mb-4">ยังไม่มีภาพที่ถูกใจ</p>
          </div>
        )}
      </div>
    </div>
  );
}
