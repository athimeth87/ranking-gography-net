'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { createDrop } from '@/lib/data/drops';
import { toast } from 'sonner';

// ===== "ตั้งเป็น Drop" — pick photos, schedule a timed release =====

interface EligiblePhoto {
  id: string;
  title: string;
  thumbnail_url: string | null;
  storage_url: string;
}

interface CreateDropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photographerId: string;
  onCreated?: () => void;
}

export function CreateDropDialog({ open, onOpenChange, photographerId, onCreated }: CreateDropDialogProps) {
  const [photos, setPhotos] = useState<EligiblePhoto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [seriesLabel, setSeriesLabel] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase
      .from('photos')
      .select('id, title, thumbnail_url, storage_url')
      .eq('photographer_id', photographerId)
      .is('drop_id', null)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => setPhotos((data as EligiblePhoto[] | null) ?? []));
  }, [open, photographerId]);

  const toggle = (id: string) => {
    setSelected((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setSelected(new Set());
    setTitle('');
    setSeriesLabel('');
    setDescription('');
    setScheduledAt('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (selected.size === 0) { toast.error('เลือกภาพอย่างน้อย 1 ภาพ'); return; }
    if (!title.trim()) { toast.error('กรอกชื่อ Drop ก่อน'); return; }
    const when = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      toast.error('เลือกเวลาปล่อยเป็นอนาคต');
      return;
    }

    setSaving(true);
    const ids = Array.from(selected);
    const first = photos.find((p) => p.id === ids[0]);
    const res = await createDrop({
      photographerId,
      title: title.trim(),
      seriesLabel: seriesLabel.trim(),
      description: description.trim(),
      scheduledAt: when.toISOString(),
      photoIds: ids,
      previewUrl: first ? first.thumbnail_url ?? first.storage_url : null,
    });
    setSaving(false);

    if (!res.ok) {
      toast.error('สร้าง Drop ไม่สำเร็จ: ' + (res.error ?? 'unknown'));
      return;
    }
    toast.success('ตั้ง Drop สำเร็จแล้ว', {
      description: `ภาพ ${ids.length} ภาพถูกซ่อนไว้ และจะปล่อยอัตโนมัติตามเวลาที่ตั้ง`,
    });
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-[#1a1a1a]/80 backdrop-blur-2xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-white !rounded-2xl outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-2 shrink-0">
            <DialogTitle className="font-serif text-2xl font-normal text-center text-white">ตั้งเป็น Drop</DialogTitle>
            <div className="th text-center text-white/50 text-xs mt-1">
              เลือกภาพ → ตั้งเวลา → ภาพจะถูกซ่อนจนถึงเวลาปล่อย
            </div>
          </DialogHeader>

          <div className="py-4 flex flex-col gap-4 overflow-y-auto max-h-[55vh] pr-2 [&::-webkit-scrollbar]:hidden">
            <div>
              <div className="caps text-white/50 mb-1.5 text-[10px]">
                เลือกภาพ ({selected.size})
              </div>
              {photos.length === 0 ? (
                <div className="th text-white/40 text-[13px] py-6 text-center border border-dashed border-white/15 rounded-lg">
                  ยังไม่มีภาพที่ตั้งเป็น Drop ได้
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {photos.map((p) => {
                    const isOn = selected.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        className={`relative aspect-square overflow-hidden rounded-md border transition-all cursor-pointer p-0 bg-white/5 ${
                          isOn ? 'border-white' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.thumbnail_url ?? p.storage_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                        {isOn && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black text-[10px] grid place-items-center">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="caps text-white/50 mb-1.5 text-[10px]">ชื่อ Drop</div>
              <Input
                className="h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20"
                placeholder="เช่น Before the fog lifts"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <div className="caps text-white/50 mb-1.5 text-[10px]">Series label (ไม่บังคับ)</div>
              <Input
                className="h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20"
                placeholder="เช่น DROP 04 — LANDSCAPE SERIES"
                value={seriesLabel}
                onChange={(e) => setSeriesLabel(e.target.value)}
              />
            </div>

            <div>
              <div className="caps text-white/50 mb-1.5 text-[10px]">คำอธิบาย (ไม่บังคับ)</div>
              <textarea
                className="w-full text-sm py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all resize-none"
                rows={2}
                placeholder="เล่าสั้นๆ ว่าชุดนี้คืออะไร"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <div className="caps text-white/50 mb-1.5 text-[10px]">เวลาปล่อย</div>
              <Input
                type="datetime-local"
                className="h-10 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 [color-scheme:dark]"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/10 mt-2 sm:justify-between items-center flex-row shrink-0">
            <button
              type="button"
              className="text-white/50 hover:text-white text-sm px-2 transition-colors"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-white text-black hover:bg-white/90 text-sm font-medium px-6 py-2 rounded-full transition-colors disabled:opacity-50"
              disabled={saving || selected.size === 0 || !title.trim() || !scheduledAt}
            >
              {saving ? 'Saving…' : 'ตั้ง Drop'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
