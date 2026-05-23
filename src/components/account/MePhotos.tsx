'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyMe } from './primitives';
import type { Photographer, Photo } from '@/lib/types';

interface MePhotosProps {
  persona: Photographer;
  myPhotos: Photo[];
  isPhotographer: boolean;
}

export function MePhotos({ myPhotos, isPhotographer }: MePhotosProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'public' | 'hidden'>('all');

  if (!isPhotographer) {
    return (
      <EmptyMe
        title="คุณยังไม่ได้ลงทะเบียนเป็นช่างภาพ"
        body="สมัครเป็น Photographer เพื่อเริ่มอัพโหลดภาพ"
        cta="Apply as photographer"
        onClick={() => router.push('/apply-photographer')}
      />
    );
  }

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
        <button className="btn btn-solid btn-sm" onClick={() => router.push('/upload')}>
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
              <PhotoGrid photos={display} cols={3} uniform />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="public">
          <div className="py-8">
            {visible.length > 0 ? (
              <PhotoGrid photos={visible} cols={3} uniform />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="hidden">
          <div className="py-8">
            {hidden.length > 0 ? (
              <PhotoGrid photos={hidden} cols={3} uniform />
            ) : (
              <div className="py-20 text-center text-fg-soft th">ไม่มีภาพในแท็บนี้</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
