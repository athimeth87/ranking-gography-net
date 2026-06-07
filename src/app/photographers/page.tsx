import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';
import { PhotographersDirectory } from '@/components/photographers/PhotographersDirectory';

// ===== Photographers directory — /photographers =====
// Public directory of every photographer on the platform.

export default function PhotographersPage() {
  return (
    <div className="page-fade">
      <PageCover
        photoId="p018"
        eyebrow="Directory"
        title="All photographers"
        subtitle="รวมช่างภาพและ Travellers ที่อยู่บนเวที GOGRAPHY Ranking — ค้นหา กรอง หรือเรียงตามที่คุณต้องการ"
      />
      <Suspense fallback={null}>
        <PhotographersDirectory initialFilter="all" />
      </Suspense>
      <Footer />
    </div>
  );
}
