'use client';
import { useState } from 'react';
import { useApp } from '@/providers/AppProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Photographer, Photo } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface Gallery {
  id: string;
  title: string;
  count: number;
  cover: string;
  isPublic: boolean;
}

interface MeGalleriesProps {
  persona: Photographer;
  myPhotos: Photo[];
  galleries: Gallery[];
  onGalleryCreated: () => Promise<void> | void;
}

export function MeGalleries({ galleries, onGalleryCreated }: MeGalleriesProps) {
  const { authUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryName.trim() || !authUser?.id) return;

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('galleries').insert({
      user_id: authUser.id,
      name: newGalleryName.trim(),
      is_public: false
    });

    if (error) {
      alert('Error creating gallery: ' + error.message);
      setIsSubmitting(false);
    } else {
      setNewGalleryName('');
      setIsModalOpen(false);
      setIsSubmitting(false);
      await onGalleryCreated();
    }
  };

  return (
    <div>
      <div className="caps opacity-55 mb-[14px]">Curated collections</div>
      <div className="flex justify-between items-baseline pb-6 border-b border-rule">
        <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">
          Galleries
        </h1>
        <button className="btn btn-sm" onClick={() => setIsModalOpen(true)}>+ New gallery</button>
      </div>

      <div className="mt-10">
        {galleries.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {galleries.map((g) => (
              <div key={g.id} className="cursor-pointer">
                <div className="aspect-[4/3] bg-tile overflow-hidden relative">
                  {g.cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={g.cover} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-fg-soft caps text-xs opacity-50">Empty</div>
                  )}
                  <div className="absolute top-3 left-3 bg-bg px-2 py-1">
                    <div className="caps text-[9px]">{g.isPublic ? 'Public' : 'Private'}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-baseline">
                  <div className="text-[18px] font-medium tracking-[-0.01em]">{g.title}</div>
                  <span className="mono text-[11px] opacity-55">{g.count} photos</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-rule">
            <p className="th text-[14px] text-fg-soft mb-4">ยังไม่มี Gallery ของคุณ</p>
            <button className="btn btn-solid" onClick={() => setIsModalOpen(true)}>Create first gallery</button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateGallery}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-normal">Create new gallery</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <Input
                placeholder="e.g. Kyoto Trip 2026"
                value={newGalleryName}
                onChange={(e) => setNewGalleryName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-solid ml-2"
                disabled={!newGalleryName.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
