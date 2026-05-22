import type { Season } from '@/lib/types';

export const SEASONS: Season[] = [
  { id: 'spring-2026', name: 'Spring 2026', range: 'มกราคม — เมษายน 2569', status: 'live', winners: null },
  { id: 'winter-2025', name: 'Winter 2025', range: 'กันยายน — ธันวาคม 2568', status: 'closed', winners: {
      Landscape: { photoId: 'p010', voucher: '50,000 THB' },
      Portrait: { photoId: 'p004', voucher: '50,000 THB' },
      BW: { photoId: 'p002', voucher: '50,000 THB' },
    }
  },
  { id: 'autumn-2025', name: 'Autumn 2025', range: 'พฤษภาคม — สิงหาคม 2568', status: 'closed', winners: {
      Landscape: { photoId: 'p013', voucher: '50,000 THB' },
      Portrait: { photoId: 'p011', voucher: '50,000 THB' },
      BW: { photoId: 'p006', voucher: '50,000 THB' },
    }
  },
];
