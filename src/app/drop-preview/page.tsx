'use client';
// Temp design-preview route — delete before merging.
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { NextDropCard } from '@/components/photo/NextDropCard';
import type { DropRow } from '@/lib/data/drops';

export default function DropPreviewPage() {
  const params = useSearchParams();
  const { setTheme } = useApp();
  const urlTheme = params?.get('theme');

  // ?theme= seeds the shared theme state once; the normal toggle works after
  useEffect(() => {
    if (urlTheme === 'dark' || urlTheme === 'light') setTheme(urlTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTheme]);

  const mock: DropRow = useMemo(() => ({
    id: 'preview',
    photographer_id: 'preview',
    title: 'Before the fog lifts',
    series_label: 'DROP 04 — LANDSCAPE SERIES',
    description: 'ชุดภาพยอดเขายามเช้าก่อนหมอกจาง จากเส้นทาง Lauterbrunnen — เก็บไว้ในลิ้นชักมาทั้งฤดู และจะปล่อยพร้อมกันครั้งเดียว',
    preview_url: '/home-cover.jpg',
    scheduled_at: new Date(Date.now() + (2 * 86_400_000) + (14 * 3_600_000) + (52 * 60_000) + 9_000).toISOString(),
    status: 'scheduled',
    released_at: null,
    created_at: new Date().toISOString(),
  }), []);

  return (
    <div className="wrap py-12 md:py-20">
      <NextDropCard photographerId="preview" previewDrop={mock} />
    </div>
  );
}
