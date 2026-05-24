import { getPhotos } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Check, X, Eye } from 'lucide-react';
import Link from 'next/link';

import { AdminPhotoCard } from '@/components/admin/AdminPhotoCard';

export default function AdminPhotosPage() {
  const PHOTOS = getPhotos();
  // Add some mock statuses to the imported data
  const photos = PHOTOS.slice(0, 12).map((p, i) => ({
    ...p,
    status: i % 4 === 0 ? 'Pending' : (i % 7 === 0 ? 'Rejected' : 'Approved')
  }));

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <AdminPhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </div>
  );
}
