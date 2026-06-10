'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RealtimePhotoGrid } from '@/components/photo/RealtimePhotoGrid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useApp } from '@/providers/AppProvider';
import type { Photographer, Photo, Category, PhotoVisibility } from '@/lib/types';
import { MAX_UPLOAD_BYTES, formatBytes, convertToWebP } from '@/lib/imageConvert';
import { getPresignedUploadUrl } from '@/app/actions/r2-upload';
import { CreateDropDialog } from '@/components/account/CreateDropDialog';
import { toast } from 'sonner';

interface MePhotosProps {
  persona: Photographer;
  myPhotos: Photo[];
  isPhotographer: boolean;
  isVoyageur: boolean;
  onPhotoUploaded?: () => void;
  onPhotoDeleted?: (id: string) => void;
}

export function MePhotos({ myPhotos, isPhotographer, isVoyageur, onPhotoUploaded, onPhotoDeleted }: MePhotosProps) {
  const router = useRouter();
  const { authUser, userState } = useApp();
  const [tab, setTab] = useState<'all' | 'public' | 'hidden'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedTodayCount, setUploadedTodayCount] = useState(0);
  const [draft, setDraft] = useState<{
    file: File | null;
    previewUrl: string;
    title: string;
    cat: Category;
    caption: string;
    voyageurOnly: boolean;
    camera: string;
    lens: string;
    visibility: PhotoVisibility;
  }>({
    title: '',
    cat: 'Landscape',
    caption: '',
    voyageurOnly: false,
    file: null,
    previewUrl: '',
    camera: '',
    lens: '',
    visibility: 'public'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkUploadLimit = async () => {
    if (!authUser?.id) return;
    const supabase = getSupabaseBrowserClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', authUser.id)
      .eq('visibility', 'public')
      .gte('uploaded_at', startOfDay.toISOString());
    setUploadedTodayCount(count || 0);
  };

  useEffect(() => {
    checkUploadLimit();
  }, [authUser]);

  // Competition quota: 1 public (เข้าประกวด) upload per day per account
  const PUBLIC_DAILY_QUOTA = 1;
  const publicQuotaUsed = uploadedTodayCount >= PUBLIC_DAILY_QUOTA;
  const publicQuotaLeft = Math.max(0, PUBLIC_DAILY_QUOTA - uploadedTodayCount);

  // If today's competition quota is used, fall back to portfolio
  useEffect(() => {
    if (publicQuotaUsed) {
      setDraft((d) => (d.visibility === 'public' ? { ...d, visibility: 'portfolio' } : d));
    }
  }, [publicQuotaUsed]);

  const handleVisibilityChanged = () => {
    checkUploadLimit();
    onPhotoUploaded?.();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_UPLOAD_BYTES) {
      toast.error(`ไฟล์ใหญ่เกินไป (${formatBytes(f.size)}) — สูงสุด 5 MB`);
      return;
    }
    setDraft(d => ({ ...d, file: f, previewUrl: URL.createObjectURL(f) }));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.file || !draft.title || !authUser?.id) return;
    // Only competition entries consume the daily quota
    if (draft.visibility === 'public' && publicQuotaUsed) return;

    setIsUploading(true);
    const supabase = getSupabaseBrowserClient();

    // Convert to WebP before uploading
    let webpFile: File;
    let imgWidth = 4;
    let imgHeight = 3;
    try {
      const result = await convertToWebP(draft.file, { quality: 0.85 });
      webpFile = result.file;
      imgWidth = result.width;
      imgHeight = result.height;
    } catch (err) {
      toast.error('Image conversion failed: ' + (err instanceof Error ? err.message : 'unknown'));
      setIsUploading(false);
      return;
    }

    const fileName = `${authUser.id}/${Date.now()}.webp`;

    const { success, url, publicUrl, error: uploadError } = await getPresignedUploadUrl(fileName, 'image/webp');

    if (!success || !url || !publicUrl) {
      toast.error('Failed to get upload URL: ' + uploadError);
      setIsUploading(false);
      return;
    }

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: webpFile,
      headers: { 'Content-Type': 'image/webp' },
    });

    if (!uploadRes.ok) {
      toast.error('Upload failed: ' + uploadRes.statusText);
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
      voyageur_only: draft.voyageurOnly,
      camera: draft.camera,
      lens: draft.lens,
      storage_url: publicUrl,
      width: imgWidth,
      height: imgHeight,
      likes_count: 0,
      favorites_count: 0,
      visibility: draft.visibility
    });

    if (dbError) {
      toast.error('Database error: ' + dbError.message);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    setIsModalOpen(false);
    setDraft({ title: '', cat: 'Landscape', caption: '', voyageurOnly: false, file: null, previewUrl: '', camera: '', lens: '', visibility: 'public' });
    toast.success('อัปโหลดสำเร็จแล้ว!', {
      description:
        draft.visibility === 'public'
          ? 'ภาพของคุณเข้าประกวด Season แล้ว'
          : draft.visibility === 'portfolio'
          ? 'ภาพถูกเพิ่มลงพอร์ตของคุณแล้ว'
          : 'ภาพถูกเก็บในลิ้นชัก — เห็นเฉพาะคุณ',
    });
    checkUploadLimit();

    if (onPhotoUploaded) {
      onPhotoUploaded();
    }
  };

  // Demo: last photo is "hidden"
  const visible = myPhotos.slice(0, Math.max(myPhotos.length - 1, 0));
  const hidden = myPhotos.slice(-1);
  const display = tab === 'all' ? myPhotos : tab === 'public' ? visible : hidden;

  return (
    <div>
      <div className="caps opacity-55 mb-[14px]">My photos</div>
      <div className="flex justify-between items-baseline pb-6">
        <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">
          My photos
        </h1>
        <div className="flex gap-[10px]">
          {isPhotographer && (
            <button
              className="btn btn-sm th"
              onClick={() => setIsDropOpen(true)}
            >
              ตั้งเป็น Drop
            </button>
          )}
          <button
            className="btn btn-solid btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            Upload photo
          </button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'all' | 'public' | 'hidden')}
        className="mt-4"
      >
        <TabsList>
          <TabsTrigger value="all">
            All <span className="mono text-[11px] opacity-55 ml-2">{myPhotos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="public">
            Public <span className="mono text-[11px] opacity-55 ml-2">{visible.length}</span>
          </TabsTrigger>
          <TabsTrigger value="hidden">
            Hidden <span className="mono text-[11px] opacity-55 ml-2">{hidden.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="py-8">
            {display.length > 0 ? (
              <RealtimePhotoGrid photos={display} cols={3} uniform deletable onDeleted={onPhotoDeleted} showVisibility onVisibilityChanged={handleVisibilityChanged} />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="public">
          <div className="py-8">
            {visible.length > 0 ? (
              <RealtimePhotoGrid photos={visible} cols={3} uniform deletable onDeleted={onPhotoDeleted} showVisibility onVisibilityChanged={handleVisibilityChanged} />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="hidden">
          <div className="py-8">
            {hidden.length > 0 ? (
              <RealtimePhotoGrid photos={hidden} cols={3} uniform deletable onDeleted={onPhotoDeleted} showVisibility onVisibilityChanged={handleVisibilityChanged} />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {isPhotographer && authUser?.id && (
        <CreateDropDialog
          open={isDropOpen}
          onOpenChange={setIsDropOpen}
          photographerId={authUser.id}
          onCreated={onPhotoUploaded}
        />
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 bg-[#1a1a1a]/80 backdrop-blur-2xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-white !rounded-2xl outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border">
            <form onSubmit={handleUploadSubmit}>
              <DialogHeader className="mb-2 shrink-0">
                <DialogTitle className="font-serif text-2xl font-normal text-center text-white">Upload Photo</DialogTitle>
                <div className="text-center text-white/50 text-xs mt-1">Please select an image and enter details.</div>
              </DialogHeader>
              <div 
                className="py-4 flex flex-col gap-4 overflow-y-auto max-h-[55vh] pr-2 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div 
                  className="shrink-0 aspect-square w-[240px] mx-auto bg-white/5 border border-dashed border-white/20 rounded-xl grid place-items-center cursor-pointer overflow-hidden relative hover:bg-white/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {draft.previewUrl ? (
                    <img src={draft.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-white/50">
                      <div className="text-[24px] mb-1 mono text-white">↑</div>
                      <div className="th text-[14px]">คลิกเพื่อเลือกภาพ</div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                
                <div>
                  <div className="caps text-white/50 mb-1.5 text-[10px]">ชื่อภาพ</div>
                  <Input 
                    className="h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20"
                    placeholder="เช่น Morning fog" 
                    value={draft.title} 
                    onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} 
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="caps text-white/50 mb-1.5 text-[10px]">กล้อง (Camera)</div>
                    <Input 
                      className="h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20"
                      placeholder="เช่น Sony A7IV" 
                      value={draft.camera} 
                      onChange={(e) => setDraft(d => ({ ...d, camera: e.target.value }))} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="caps text-white/50 mb-1.5 text-[10px]">เลนส์ (Lens)</div>
                    <Input 
                      className="h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20"
                      placeholder="เช่น FE 35mm f/1.4" 
                      value={draft.lens} 
                      onChange={(e) => setDraft(d => ({ ...d, lens: e.target.value }))} 
                    />
                  </div>
                </div>
                
                <div>
                  <div className="caps text-white/50 mb-1.5 text-[10px]">หมวดหมู่</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Landscape', 'Portrait', 'BW'] as Category[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, cat: c }))}
                        className="py-2 px-2 text-[10px] tracking-[.12em] uppercase font-medium transition-all border rounded-lg"
                        style={{
                          borderColor: draft.cat === c ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)',
                          background: draft.cat === c ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: draft.cat === c ? '#fff' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {c === 'BW' ? 'B&W' : c}
                      </button>
                    ))}
                  </div>
                </div>

                <div role="radiogroup" aria-label="ส่งภาพแบบไหน">
                  <div className="caps text-white/50 mb-1.5 text-[10px]">ส่งภาพแบบไหน</div>
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
                        className={`flex items-start gap-2.5 border rounded-lg p-3 transition-all ${
                          draft.visibility === o.v ? 'border-white/80 bg-white/10' : 'border-white/10 bg-white/5'
                        } ${o.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="radio"
                          name="me-upload-visibility"
                          className="mt-[3px] accent-white cursor-pointer"
                          checked={draft.visibility === o.v}
                          disabled={o.disabled}
                          onChange={() => setDraft((d) => ({ ...d, visibility: o.v }))}
                        />
                        <span>
                          <span className="th text-[13px] font-medium text-white block">{o.title}</span>
                          <span className="th text-[10px] text-white/50 block mt-0.5">{o.sub}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border border-white/10 rounded-lg p-3 bg-white/5">
                  <div>
                    <div className="th text-[14px] font-medium text-white">Traveller Only</div>
                    <div className="th text-[10px] text-white/50 mt-0.5">ภาพนี้จะเห็นได้เฉพาะสมาชิก Traveller ด้วยกันเท่านั้น</div>
                  </div>
                  <Switch
                    checked={draft.voyageurOnly}
                    onCheckedChange={(checked) => setDraft(d => ({ ...d, voyageurOnly: checked }))}
                  />
                </div>

                <div>
                  <div className="caps text-white/50 mb-1.5 text-[10px]">คำบรรยายภาพ</div>
                  <textarea 
                    className="w-full text-sm py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all resize-none" 
                    rows={2} 
                    placeholder="เล่าเรื่องราวเล็กๆ เกี่ยวกับภาพนี้"
                    value={draft.caption}
                    onChange={(e) => setDraft(d => ({ ...d, caption: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-white/10 mt-2 sm:justify-between items-center flex-row shrink-0">
                <button type="button" className="text-white/50 hover:text-white text-sm px-2 transition-colors" onClick={() => setIsModalOpen(false)} disabled={isUploading}>
                  Cancel
                </button>
                <button type="submit" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-6 py-2 rounded-full transition-colors disabled:opacity-50" disabled={!draft.file || !draft.title || isUploading || (draft.visibility === 'public' && publicQuotaUsed)}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
