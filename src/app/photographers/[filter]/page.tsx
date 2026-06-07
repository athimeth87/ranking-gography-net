import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { PageCover } from '@/components/layout/PageCover';
import { PhotographersDirectory } from '@/components/photographers/PhotographersDirectory';

// ===== Filtered photographers directory — /photographers/[filter] =====
// Valid filter values: 'all' | 'voyageurs' | 'ambassadors' | 'general'

type FilterValue = 'all' | 'voyageurs' | 'ambassadors' | 'general';
const VALID_FILTERS: FilterValue[] = ['all', 'voyageurs', 'ambassadors', 'general'];

export default function PhotographersFilterPage({ params }: { params: { filter: string } }) {
  if (!VALID_FILTERS.includes(params.filter as FilterValue)) notFound();
  const filter = params.filter as FilterValue;

  const coverPhotoId = filter === 'voyageurs' ? 'p015' : filter === 'ambassadors' ? 'p002' : 'p018';
  const title =
    filter === 'voyageurs'
      ? 'Travellers'
      : filter === 'ambassadors'
        ? 'Ambassadors'
        : filter === 'general'
          ? 'Photographers'
          : 'All photographers';
  const subtitle =
    filter === 'voyageurs'
      ? 'ลูกค้า GOGRAPHY ที่เคยร่วมทริปและมีภาพอยู่บนเวที'
      : filter === 'ambassadors'
        ? 'ช่างภาพรับเชิญที่ GOGRAPHY ไว้วางใจให้คัดเลือกภาพ'
        : 'รวมช่างภาพและ Travellers ที่อยู่บนเวที GOGRAPHY Ranking';

  return (
    <div className="page-fade">
      <PageCover photoId={coverPhotoId} eyebrow="Directory" title={title} subtitle={subtitle} />
      <Suspense fallback={null}>
        <PhotographersDirectory initialFilter={filter} />
      </Suspense>
      <Footer />
    </div>
  );
}
