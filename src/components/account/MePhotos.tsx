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
import type { Photographer, Photo, Category } from '@/lib/types';
import { MAX_UPLOAD_BYTES, formatBytes, convertToWebP } from '@/lib/imageConvert';
import { getPresignedUploadUrl } from '@/app/actions/r2-upload';
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
  }>({
    title: '',
    cat: 'Landscape',
    caption: '',
    voyageurOnly: false,
    file: null,
    previewUrl: '',
    camera: '',
    lens: ''
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
      .gte('uploaded_at', startOfDay.toISOString());
    setUploadedTodayCount(count || 0);
  };

  useEffect(() => {
    checkUploadLimit();
  }, [authUser]);

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
      favorites_count: 0
    });

    if (dbError) {
      toast.error('Database error: ' + dbError.message);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    setIsModalOpen(false);
    setDraft({ title: '', cat: 'Landscape', caption: '', voyageurOnly: false, file: null, previewUrl: '', camera: '', lens: '' });
    toast.success('อัปโหลดสำเร็จแล้ว!', { description: 'รูปภาพของคุณถูกส่งเข้าสู่ระบบแล้ว' });
    checkUploadLimit();

    if (onPhotoUploaded) {
      onPhotoUploaded();
    }
  };

  // Enforce 2 per day limit for non-photographers
  const limitReached = !isPhotographer && uploadedTodayCount >= 2;

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
        <button 
          className="btn btn-solid btn-sm" 
          onClick={() => setIsModalOpen(true)}
        >
          Upload photo
        </button>
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
              <RealtimePhotoGrid photos={display} cols={3} uniform deletable onDeleted={onPhotoDeleted} />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="public">
          <div className="py-8">
            {visible.length > 0 ? (
              <RealtimePhotoGrid photos={visible} cols={3} uniform deletable onDeleted={onPhotoDeleted} />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="hidden">
          <div className="py-8">
            {hidden.length > 0 ? (
              <RealtimePhotoGrid photos={hidden} cols={3} uniform deletable onDeleted={onPhotoDeleted} />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 bg-[#1a1a1a]/80 backdrop-blur-2xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-white !rounded-2xl outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border">
          {limitReached ? (
            <div className="py-10 text-center">
              <h2 className="th text-[24px] font-normal mb-2 text-white">Limit Reached</h2>
              <p className="th text-white/60 text-[14px]">คุณอัปโหลดภาพครบโควตา 2 ภาพสำหรับวันนี้แล้ว (รีเซ็ตเวลา 00:00 น.)</p>
              <button className="bg-white text-black px-6 py-2 rounded-full font-medium mt-6 hover:bg-white/90 transition-colors" onClick={() => setIsModalOpen(false)}>เข้าใจแล้ว</button>
            </div>
          ) : (
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
                      <div className="th text-[12px]">คลิกเพื่อเลือกภาพ</div>
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

                <div className="flex items-center justify-between border border-white/10 rounded-lg p-3 bg-white/5">
                  <div>
                    <div className="th text-[12px] font-medium text-white">Traveller Only</div>
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
                <button type="submit" className="bg-white text-black hover:bg-white/90 text-sm font-medium px-6 py-2 rounded-full transition-colors disabled:opacity-50" disabled={!draft.file || !draft.title || isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
