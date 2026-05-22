// Mock data: photographers, photos, ambassadors, seasons.
// Picsum.photos with stable seeds — reliable, consistent images.

const u = (seed, w=1200, h) => `https://picsum.photos/seed/${seed}/${w}/${h || Math.round(w * 1.25)}`;

export const PHOTOGRAPHERS = [
  { username: 'kanthorn', name: 'Kanthorn Aroonrat', loc: 'Chiang Mai, TH', bio: 'Long-form landscape photographer. Currently chasing fog through the Mae Hong Son loop.', avatar: u('av-kanthorn', 240, 240), cover: u('mountain-mist-cover', 1800, 800), followers: 2840, photos: 47, isAmbassador: true, joined: '2024.03', cameras: ['Sony A7R V', 'Hasselblad 907X'] },
  { username: 'phim.s', name: 'Phimlapas Suwanlapa', loc: 'Bangkok, TH', bio: 'Portrait & documentary. Editorial work for travel magazines across SEA.', avatar: u('av-phim', 240, 240), cover: u('studio-window-cover', 1800, 800), followers: 1620, photos: 31, isAmbassador: false, joined: '2024.07', cameras: ['Leica Q3'] },
  { username: 'wattana', name: 'Wattana Boonchoo', loc: 'Pai, TH', bio: 'Black & white only. Film since 1998.', avatar: u('av-wattana', 240, 240), cover: u('alley-charcoal-cover', 1800, 800), followers: 4210, photos: 88, isAmbassador: true, joined: '2024.01', cameras: ['Nikon Z f', 'Hasselblad 500C/M'] },
  { username: 'natty', name: 'Nattaya Lekprasert', loc: 'Phuket, TH', bio: 'Coastal & underwater. Diver first, photographer second.', avatar: u('av-natty', 240, 240), cover: u('sea-tide-cover', 1800, 800), followers: 980, photos: 22, isAmbassador: false, joined: '2024.09', cameras: ['Sony A1', 'GoPro Hero 12'] },
  { username: 'somchai.k', name: 'Somchai Klongchum', loc: 'Lampang, TH', bio: 'Quiet rituals, slow mornings.', avatar: u('av-somchai', 240, 240), cover: u('quiet-morning-cover', 1800, 800), followers: 615, photos: 14, isAmbassador: false, joined: '2025.02', cameras: ['Fuji X100VI'] },
  { username: 'maliwan', name: 'Maliwan Chaiyaphum', loc: 'Sukhothai, TH', bio: 'Temples, monks, mornings at 5:30.', avatar: u('av-maliwan', 240, 240), cover: u('temple-dawn-cover', 1800, 800), followers: 1240, photos: 39, isAmbassador: true, joined: '2024.05', cameras: ['Canon R5'] },
  { username: 'jirayu', name: 'Jirayu Tangwongsiri', loc: 'Krabi, TH', bio: 'Aerial & long exposure.', avatar: u('av-jirayu', 240, 240), cover: u('aerial-coast-cover', 1800, 800), followers: 720, photos: 18, isAmbassador: false, joined: '2025.01', cameras: ['DJI Mavic 3 Pro', 'Sony A7 IV'] },
  { username: 'pim.travels', name: 'Pim Asanachinda', loc: 'Bangkok, TH', bio: 'Travel customer turned photographer. GOGRAPHY Patagonia 2025.', avatar: u('av-pim', 240, 240), cover: u('patagonia-cover', 1800, 800), followers: 320, photos: 9, isAmbassador: false, isCustomer: true, customerTrips: ['GOGRAPHY Patagonia · Jan 2025', 'GOGRAPHY Iceland · Nov 2023'], joined: '2025.03', cameras: ['Fuji X-T5'] },
  { username: 'thanavat', name: 'Thanavat Liangthongchai', loc: 'Bangkok, TH', bio: 'Architect by day, traveler at heart. Two trips with GOGRAPHY so far.', avatar: u('av-thanavat', 240, 240), cover: u('thanavat-cover', 1800, 800), followers: 180, photos: 6, isAmbassador: false, isCustomer: true, customerTrips: ['GOGRAPHY Atacama · Mar 2025', 'GOGRAPHY Bhutan · Oct 2024'], joined: '2025.04', cameras: ['Sony A7 IV'] },
  { username: 'oranan', name: 'Oranan Sutthikulanon', loc: 'Phuket, TH', bio: 'Doctor. Photography is the off-call meditation.', avatar: u('av-oranan', 240, 240), cover: u('oranan-cover', 1800, 800), followers: 240, photos: 8, isAmbassador: false, isCustomer: true, customerTrips: ['GOGRAPHY Mongolia · Aug 2024'], joined: '2025.01', cameras: ['Leica M11', 'Canon R5'] },
  { username: 'kuldeep.r', name: 'Kuldeep Rangsiwoot', loc: 'Chiang Rai, TH', bio: 'Retired engineer. Late-blooming photographer.', avatar: u('av-kuldeep', 240, 240), cover: u('kuldeep-cover', 1800, 800), followers: 410, photos: 11, isAmbassador: false, isCustomer: true, customerTrips: ['GOGRAPHY Iceland · Feb 2024', 'GOGRAPHY Patagonia · Jan 2025', 'GOGRAPHY Mongolia · Aug 2024'], joined: '2024.10', cameras: ['Nikon Z9'] },
];

export const PHOTOS = [
  { id: 'p001', slug: 'morning-fog-doi-inthanon', title: 'Morning fog, Doi Inthanon', by: 'kanthorn', cat: 'Landscape', w: 1600, h: 2000, src: u('doi-inthanon-fog', 1400, 1750), caption: 'ม่านหมอกห่มผืนป่า — 5:42 น. 1,200 ม. เหนือระดับน้ำทะเล', exif: { camera: 'Sony A7R V', lens: '24-70mm f/2.8 GM II', iso: 100, shutter: '1/60', aperture: 'f/8.0', focal: '35mm' }, likes: 1284, likes24h: 218, comments: 24, favorites: 412, hours: 32, picks: ['editor'], date: '2026.03.18' },
  { id: 'p002', slug: 'monk-walk', title: 'การเดินบิณฑบาตร์', by: 'wattana', cat: 'BW', w: 1600, h: 2200, src: u('monk-walk-bw', 1400, 1925), caption: 'Sukhothai. ฟิล์ม Tri-X 400 push to 1600.', exif: { camera: 'Hasselblad 500C/M', lens: '80mm f/2.8 Planar', iso: 1600, shutter: '1/125', aperture: 'f/4.0', focal: '80mm' }, likes: 980, likes24h: 142, comments: 18, favorites: 380, hours: 48, picks: ['ambassador'], date: '2026.03.17' },
  { id: 'p003', slug: 'silver-tide', title: 'Silver tide', by: 'natty', cat: 'Landscape', w: 1800, h: 1200, src: u('silver-tide-andaman', 1400, 933), caption: 'Andaman, 18:11. 30s exposure.', exif: { camera: 'Sony A1', lens: '16-35mm f/2.8 GM', iso: 50, shutter: '30"', aperture: 'f/11', focal: '20mm' }, likes: 743, likes24h: 89, comments: 11, favorites: 215, hours: 24, picks: [], date: '2026.03.19' },
  { id: 'p004', slug: 'her-3am', title: 'Her, 3am', by: 'phim.s', cat: 'Portrait', w: 1400, h: 1800, src: u('her-3am-portrait', 1400, 1800), caption: 'Bangkok studio. Available light.', exif: { camera: 'Leica Q3', lens: '28mm f/1.7 Summilux', iso: 800, shutter: '1/60', aperture: 'f/1.7', focal: '28mm' }, likes: 1640, likes24h: 312, comments: 41, favorites: 588, hours: 14, picks: ['editor', 'ambassador'], date: '2026.03.20' },
  { id: 'p005', slug: 'first-light', title: 'First light', by: 'maliwan', cat: 'Landscape', w: 1600, h: 2000, src: u('temple-first-light', 1400, 1750), caption: 'Wat Mahathat, 6:04 น.', exif: { camera: 'Canon R5', lens: 'RF 24-105mm f/4L', iso: 200, shutter: '1/250', aperture: 'f/5.6', focal: '70mm' }, likes: 890, likes24h: 64, comments: 9, favorites: 244, hours: 72, picks: ['editor'], date: '2026.03.16' },
  { id: 'p006', slug: 'untitled-08', title: 'Untitled, 08', by: 'wattana', cat: 'BW', w: 1400, h: 1750, src: u('untitled-08-bw', 1400, 1750), caption: 'ฟิล์ม Acros 100. Bangkok, alley off Charoenkrung.', exif: { camera: 'Nikon Z f', lens: '35mm f/1.8 S', iso: 100, shutter: '1/200', aperture: 'f/2.8', focal: '35mm' }, likes: 540, likes24h: 41, comments: 7, favorites: 198, hours: 96, picks: [], date: '2026.03.14' },
  { id: 'p007', slug: 'patagonia-blue', title: 'Patagonia, blue hour', by: 'jirayu', cat: 'Landscape', w: 1800, h: 1200, src: u('patagonia-blue-hour', 1400, 933), caption: 'Torres del Paine. Aerial.', exif: { camera: 'DJI Mavic 3 Pro', lens: 'Hasselblad L2D-20c', iso: 200, shutter: '1/30', aperture: 'f/4.0', focal: '24mm' }, likes: 1124, likes24h: 188, comments: 16, favorites: 402, hours: 40, picks: ['ambassador'], date: '2026.03.18' },
  { id: 'p008', slug: 'window', title: 'หน้าต่าง', by: 'somchai.k', cat: 'BW', w: 1400, h: 1750, src: u('window-lampang-bw', 1400, 1750), caption: 'Lampang, บ้านเก่า.', exif: { camera: 'Fuji X100VI', lens: '23mm f/2.0', iso: 200, shutter: '1/125', aperture: 'f/4.0', focal: '23mm' }, likes: 411, likes24h: 38, comments: 5, favorites: 142, hours: 60, picks: [], date: '2026.03.15' },
  { id: 'p009', slug: 'his-hands', title: 'His hands', by: 'phim.s', cat: 'Portrait', w: 1400, h: 1800, src: u('his-hands-paper', 1400, 1800), caption: 'ลุงคำดี อายุ 78 ปี. ช่างทำกระดาษสา, ปาย.', exif: { camera: 'Leica Q3', lens: '28mm f/1.7', iso: 400, shutter: '1/80', aperture: 'f/2.8', focal: '28mm' }, likes: 1248, likes24h: 156, comments: 28, favorites: 462, hours: 28, picks: ['editor'], date: '2026.03.19' },
  { id: 'p010', slug: 'sea-of-clouds', title: 'Sea of clouds', by: 'kanthorn', cat: 'Landscape', w: 1800, h: 1200, src: u('sea-of-clouds-mae-salong', 1400, 933), caption: 'Doi Mae Salong, 6:18.', exif: { camera: 'Sony A7R V', lens: '70-200mm f/2.8 GM II', iso: 100, shutter: '1/500', aperture: 'f/6.3', focal: '135mm' }, likes: 1402, likes24h: 240, comments: 22, favorites: 510, hours: 36, picks: ['ambassador'], date: '2026.03.17' },
  { id: 'p011', slug: 'her-portrait', title: 'Suda, in profile', by: 'maliwan', cat: 'Portrait', w: 1400, h: 1750, src: u('suda-profile-portrait', 1400, 1750), caption: 'หลังการแสดงโขน — โขนพระราชทาน, 2568.', exif: { camera: 'Canon R5', lens: 'RF 85mm f/1.2L', iso: 800, shutter: '1/200', aperture: 'f/2.0', focal: '85mm' }, likes: 678, likes24h: 88, comments: 12, favorites: 226, hours: 44, picks: [], date: '2026.03.18' },
  { id: 'p012', slug: 'monsoon', title: 'Monsoon', by: 'natty', cat: 'BW', w: 1600, h: 2000, src: u('monsoon-storm-bw', 1400, 1750), caption: 'Phuket. Storm front, July.', exif: { camera: 'Sony A1', lens: '24-70mm f/2.8 GM II', iso: 1600, shutter: '1/1000', aperture: 'f/4.0', focal: '50mm' }, likes: 521, likes24h: 73, comments: 8, favorites: 178, hours: 22, picks: [], date: '2026.03.19' },
  { id: 'p013', slug: 'reflection', title: 'Reflection, Pang Oung', by: 'kanthorn', cat: 'Landscape', w: 1800, h: 1200, src: u('reflection-pang-oung', 1400, 933), caption: 'Mae Hong Son. 5:50.', exif: { camera: 'Sony A7R V', lens: '24-70mm GM II', iso: 100, shutter: '1/30', aperture: 'f/11', focal: '24mm' }, likes: 802, likes24h: 102, comments: 14, favorites: 268, hours: 50, picks: ['editor'], date: '2026.03.17' },
  { id: 'p014', slug: 'songkran-1', title: 'Songkran I', by: 'jirayu', cat: 'BW', w: 1400, h: 1750, src: u('songkran-bangkok-bw', 1400, 1750), caption: 'Khao San, สงกรานต์ 68.', exif: { camera: 'Sony A7 IV', lens: '35mm f/1.4 GM', iso: 200, shutter: '1/1600', aperture: 'f/2.0', focal: '35mm' }, likes: 988, likes24h: 162, comments: 19, favorites: 304, hours: 30, picks: [], date: '2026.03.18' },
  { id: 'p015', slug: 'patagonia-customer', title: 'แสงแรกของวัน — Patagonia', by: 'pim.travels', cat: 'Landscape', w: 1800, h: 1200, src: u('patagonia-customer-trip', 1400, 933), caption: 'จาก GOGRAPHY Patagonia 2025. ครั้งแรกที่ถ่ายภาพภูเขา.', exif: { camera: 'Fuji X-T5', lens: 'XF 16-80mm f/4', iso: 200, shutter: '1/250', aperture: 'f/8.0', focal: '23mm' }, likes: 224, likes24h: 56, comments: 11, favorites: 88, hours: 18, picks: ['editor'], date: '2026.03.20' },
  { id: 'p016', slug: 'monks-shadow', title: "Monk's shadow", by: 'maliwan', cat: 'BW', w: 1400, h: 1750, src: u('monk-shadow-bw', 1400, 1750), caption: 'Wat Pho. 16:42.', exif: { camera: 'Canon R5', lens: 'RF 50mm f/1.2L', iso: 400, shutter: '1/250', aperture: 'f/4.0', focal: '50mm' }, likes: 612, likes24h: 84, comments: 9, favorites: 198, hours: 28, picks: [], date: '2026.03.19' },
  { id: 'p017', slug: 'ricefields', title: 'นาขั้นบันได', by: 'somchai.k', cat: 'Landscape', w: 1800, h: 1200, src: u('ricefields-mae-chaem', 1400, 933), caption: 'Mae Chaem.', exif: { camera: 'Fuji X100VI', lens: '23mm f/2.0', iso: 200, shutter: '1/500', aperture: 'f/8.0', focal: '23mm' }, likes: 386, likes24h: 32, comments: 6, favorites: 124, hours: 80, picks: [], date: '2026.03.13' },
  { id: 'p018', slug: 'studio-3', title: 'Studio, 03', by: 'phim.s', cat: 'Portrait', w: 1400, h: 1750, src: u('studio-portrait-03', 1400, 1750), caption: 'Bangkok studio.', exif: { camera: 'Leica Q3', lens: '28mm f/1.7', iso: 200, shutter: '1/160', aperture: 'f/2.8', focal: '28mm' }, likes: 712, likes24h: 95, comments: 13, favorites: 232, hours: 36, picks: [], date: '2026.03.18' },
  { id: 'p019', slug: 'atacama-stars', title: 'Atacama, 23:40', by: 'thanavat', cat: 'Landscape', w: 1800, h: 1200, src: u('atacama-stars-customer', 1400, 933), caption: 'Cerro Toco. ทริป GOGRAPHY Atacama 2025.', exif: { camera: 'Sony A7 IV', lens: '14mm f/1.8 GM', iso: 3200, shutter: '20"', aperture: 'f/2.0', focal: '14mm' }, likes: 318, likes24h: 72, comments: 14, favorites: 122, hours: 22, picks: [], date: '2026.03.19', tripContext: 'GOGRAPHY Atacama · Mar 2025' },
  { id: 'p020', slug: 'mongolia-rider', title: 'Rider, Khustai', by: 'oranan', cat: 'Portrait', w: 1400, h: 1750, src: u('mongolia-rider-customer', 1400, 1750), caption: 'Khustai National Park.', exif: { camera: 'Leica M11', lens: '50mm f/1.4', iso: 200, shutter: '1/500', aperture: 'f/4.0', focal: '50mm' }, likes: 408, likes24h: 84, comments: 18, favorites: 144, hours: 30, picks: ['editor'], date: '2026.03.18', tripContext: 'GOGRAPHY Mongolia · Aug 2024' },
  { id: 'p021', slug: 'iceland-glacier', title: 'Jökulsárlón', by: 'kuldeep.r', cat: 'Landscape', w: 1800, h: 1200, src: u('iceland-glacier-customer', 1400, 933), caption: 'น้ำแข็งลอย. ฤดูหนาว 2024.', exif: { camera: 'Nikon Z9', lens: '14-24mm f/2.8 S', iso: 100, shutter: '1/125', aperture: 'f/11', focal: '20mm' }, likes: 522, likes24h: 96, comments: 21, favorites: 188, hours: 54, picks: [], date: '2026.03.16', tripContext: 'GOGRAPHY Iceland · Feb 2024' },
  { id: 'p022', slug: 'bhutan-prayer', title: 'Prayer flags, Paro', by: 'thanavat', cat: 'BW', w: 1400, h: 1750, src: u('bhutan-prayer-customer', 1400, 1750), caption: 'Taktsang. ทริป Bhutan 2024.', exif: { camera: 'Sony A7 IV', lens: '35mm f/1.4 GM', iso: 400, shutter: '1/250', aperture: 'f/2.8', focal: '35mm' }, likes: 286, likes24h: 38, comments: 9, favorites: 98, hours: 64, picks: [], date: '2026.03.14', tripContext: 'GOGRAPHY Bhutan · Oct 2024' },
];

// Pulse score calculation per brief:
// pulse = (likes*1 + likes24h*3 + curationBonus) / max(hours, 1)
export function pulseScore(p) {
  let bonus = 0;
  if (p.picks.includes('editor') && p.picks.includes('ambassador')) bonus = 100;
  else if (p.picks.length > 0) bonus = 50;
  return (p.likes * 1 + p.likes24h * 3 + bonus) / Math.max(p.hours, 1);
}

PHOTOS.forEach(p => p.pulse = pulseScore(p));
PHOTOS.sort((a,b) => b.pulse - a.pulse);
PHOTOS.forEach((p, i) => p.rank = i + 1);

// Force B&W photos to render as grayscale via picsum's ?grayscale modifier
PHOTOS.forEach(p => {
  if (p.cat === 'BW' && p.src && p.src.includes('picsum.photos') && !p.src.includes('grayscale')) {
    p.src = p.src + (p.src.includes('?') ? '&' : '?') + 'grayscale';
  }
});

export const AMBASSADORS = PHOTOGRAPHERS.filter(p => p.isAmbassador);

export const SEASONS = [
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

export const COMMENTS = {
  p004: [
    { user: 'kanthorn', text: 'แสงเหมือนยุค Saul Leiter — ลึกแต่อ่อนโยน', at: '2 วันก่อน' },
    { user: 'wattana', text: 'นี่คือสิ่งที่ Q3 ทำได้ดีกว่ากล้องอื่น', at: '1 วันก่อน' },
    { user: 'natty', text: 'beautifully restrained.', at: '14 ชม.ที่แล้ว' },
  ],
  default: [
    { user: 'somchai.k', text: 'งดงาม. composition ตรงเส้นที่สาม pixel-perfect', at: '8 ชม.ที่แล้ว' },
    { user: 'pim.travels', text: 'เริ่มเก็บเป็น reference ของผมแล้ว 🤍', at: '3 ชม.ที่แล้ว' },
  ]
};


// Convenience helpers
export const findPhoto = (id) => PHOTOS.find(p => p.id === id);
export const findPhotographer = (username) => PHOTOGRAPHERS.find(p => p.username === username);
export const voyageurUsernames = new Set(PHOTOGRAPHERS.filter(p => p.isCustomer).map(p => p.username));
