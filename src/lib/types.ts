export type Category = 'Landscape' | 'Portrait' | 'BW';
export type PickKind = 'editor' | 'ambassador';
export type UserState = 'guest' | 'user' | 'customer' | 'photographer';
export type Theme = 'light' | 'dark';
export type Mode = 'atelier' | 'editorial';

export interface Exif {
  camera: string;
  lens: string;
  iso: number;
  shutter: string;
  aperture: string;
  focal: string;
}

/** Raw authored photo data, before pulse/rank are derived. */
export interface PhotoSeed {
  id: string;
  slug: string;
  title: string;
  by: string; // photographer username
  cat: Category;
  w: number;
  h: number;
  src: string;
  caption: string;
  exif: Exif;
  likes: number;
  likes24h: number;
  comments: number;
  favorites: number;
  hours: number;
  picks: PickKind[];
  date: string;
  tripContext?: string;
  voyageurOnly?: boolean;
  avatarUrl?: string;
}

/** A photo with derived ranking fields. */
export interface Photo extends PhotoSeed {
  pulse: number;
  rank: number;
}

export interface Photographer {
  id?: string;
  username: string;
  name: string;
  loc: string;
  bio: string;
  avatar: string;
  cover: string;
  followers: number;
  photos: number;
  isAmbassador: boolean;
  isCustomer?: boolean;
  isRankMaster?: boolean;
  customerTrips?: string[];
  joined: string;
  cameras: string[];
}

export type SeasonStatus = 'live' | 'closed';

export interface SeasonWinner {
  photoId: string;
  voucher: string;
}

export interface Season {
  id: string;
  name: string;
  range: string;
  status: SeasonStatus;
  endDate?: string; // ISO date: last day of the season
  winners: Record<Category, SeasonWinner> | null;
}

export interface Comment {
  user: string;
  text: string;
  at: string;
}
