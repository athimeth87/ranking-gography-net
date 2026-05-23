'use client';
import { getPhotos } from '@/lib/data';
import type { Photographer, Photo } from '@/lib/types';

interface Gallery {
  id: string;
  title: string;
  count: number;
  cover: string;
  isPublic: boolean;
}

interface MeGalleriesProps {
  persona: Photographer;
  myPhotos: Photo[];
}

export function MeGalleries({ myPhotos }: MeGalleriesProps) {
  const allPhotos = getPhotos();
  const fallbackSrc = allPhotos[0]?.src ?? '';
  const galleries: Gallery[] = [
    {
      id: 'g1',
      title: 'Mae Hong Son Loop',
      count: 18,
      cover: myPhotos[0]?.src ?? fallbackSrc,
      isPublic: true,
    },
    {
      id: 'g2',
      title: 'Studio sessions',
      count: 12,
      cover: allPhotos.find((p) => p.cat === 'Portrait')?.src ?? fallbackSrc,
      isPublic: false,
    },
    {
      id: 'g3',
      title: 'B/W only',
      count: 8,
      cover: allPhotos.find((p) => p.cat === 'BW')?.src ?? fallbackSrc,
      isPublic: true,
    },
  ];

  return (
    <div>
      <div className="caps opacity-55 mb-[14px]">Curated collections</div>
      <div className="flex justify-between items-baseline pb-6 border-b border-rule">
        <h1 className="th text-[56px] font-normal tracking-[-0.025em] m-0 leading-none">
          Galleries
        </h1>
        <button className="btn btn-sm">+ New gallery</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-10">
        {galleries.map((g) => (
          <div key={g.id} className="cursor-pointer">
            <div className="aspect-[4/3] bg-tile overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.cover} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
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
    </div>
  );
}
