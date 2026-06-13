'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

import { AdminPhotoCard } from '@/components/admin/AdminPhotoCard';

interface AdminPhotoRow {
  id: string;
  src: string;
  title: string;
  date: string;
  by: string;
  cat: string;
  exif: { camera: string };
  status: string;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<AdminPhotoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('photos')
        .select('*, users!inner(username, display_name)')
        .order('uploaded_at', { ascending: false })
        .limit(48);
      const rows: AdminPhotoRow[] = (data || []).map((p: any) => ({
        id: p.id,
        src: p.storage_url,
        title: p.title,
        date: (p.uploaded_at || '').slice(0, 10),
        by: p.users?.username || p.users?.display_name || 'unknown',
        cat: p.category || '',
        exif: { camera: p.camera || 'Unknown' },
        status: p.is_hidden ? 'Rejected' : p.status === 'published' ? 'Approved' : 'Pending',
      }));
      setPhotos(rows);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Review Gallery</h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            Manage incoming photo submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-mono text-xs uppercase tracking-widest rounded-none border-neutral-300">
            Filter: Pending
          </Button>
          <Button className="font-mono text-xs uppercase tracking-widest rounded-none bg-neutral-900 text-white hover:bg-neutral-800">
            Latest First
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">Loading Photos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <AdminPhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}
