'use client';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function MeFavorites() {
  const { authUser } = useApp();
  const [favs, setFavs] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }
    const fetchFavs = async () => {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch visibility preference
      const { data: userRow } = await supabase.from('users').select('favorites_visibility').eq('id', authUser.id).single();
      if (userRow) setIsPublic(userRow.favorites_visibility === 'public');

      // Fetch favorite photos
      const { data } = await supabase
        .from('favorites')
        .select(`
          photo_id,
          photos (*)
        `)
        .eq('user_id', authUser.id)
        .order('favorited_at', { ascending: false });
        
      if (data) {
        setFavs(data.map((row: any) => row.photos));
      }
      setLoading(false);
    };

    fetchFavs();
  }, [authUser]);

  const toggleVisibility = async (checked: boolean) => {
    setIsPublic(checked);
    if (authUser?.id) {
      const supabase = getSupabaseBrowserClient();
      await supabase.from('users').update({ favorites_visibility: checked ? 'public' : 'private' }).eq('id', authUser.id);
    }
  };

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
            onCheckedChange={toggleVisibility}
          />
          <span className="caps text-[11px]" style={{ opacity: isPublic ? 1 : 0.55 }}>
            {/* runtime: opacity depends on isPublic toggle value */}
            Show on public profile
          </span>
        </label>
      </div>
      <p className="th mt-4 text-[13px] text-fg-soft max-w-[600px] leading-[1.7]">
        ภาพที่คุณบันทึกไว้ — โดยปกติเป็นส่วนตัว สามารถเปิดให้สาธารณะเห็นได้บน profile ของคุณ
      </p>
      <div className="mt-8">
        {loading ? (
          <div className="text-center py-10 opacity-50 caps">Loading favorites...</div>
        ) : favs.length > 0 ? (
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
