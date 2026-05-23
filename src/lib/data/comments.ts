import type { Comment } from '@/lib/types';

export const COMMENTS: Record<string, Comment[]> = {
  p004: [
    { user: 'kanthorn', text: 'แสงเหมือนยุค Saul Leiter — ลึกแต่อ่อนโยน', at: '2 วันก่อน' },
    { user: 'wattana', text: 'นี่คือสิ่งที่ Q3 ทำได้ดีกว่ากล้องอื่น', at: '1 วันก่อน' },
    { user: 'natty', text: 'beautifully restrained.', at: '14 ชม.ที่แล้ว' },
  ],
  default: [
    { user: 'somchai.k', text: 'งดงาม. composition ตรงเส้นที่สาม pixel-perfect', at: '8 ชม.ที่แล้ว' },
    { user: 'pim.travels', text: 'เริ่มเก็บเป็น reference ของผมแล้ว 🤍', at: '3 ชม.ที่แล้ว' },
  ],
};
