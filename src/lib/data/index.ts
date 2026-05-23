import type { Category, Comment, Photo, Photographer, Season } from '@/lib/types';
import { rankPhotos } from '@/lib/pulse';
import { PHOTO_SEEDS } from './photos';
import { PHOTOGRAPHERS } from './photographers';
import { SEASONS } from './seasons';
import { COMMENTS } from './comments';

const PHOTOS: Photo[] = rankPhotos(PHOTO_SEEDS);

export type SortKey = 'pulse' | 'recent' | 'likes';

export interface GetPhotosOptions {
  category?: Category;
  by?: string;
  sort?: SortKey;
}

export function getPhotos(opts: GetPhotosOptions = {}): Photo[] {
  let list = PHOTOS;
  if (opts.category) list = list.filter((p) => p.cat === opts.category);
  if (opts.by) list = list.filter((p) => p.by === opts.by);
  if (opts.sort === 'recent') list = [...list].sort((a, b) => b.date.localeCompare(a.date));
  else if (opts.sort === 'likes') list = [...list].sort((a, b) => b.likes - a.likes);
  return list;
}

export function getPhoto(id: string): Photo | undefined {
  return PHOTOS.find((p) => p.id === id);
}

export function getPhotographer(username: string): Photographer | undefined {
  return PHOTOGRAPHERS.find((p) => p.username === username);
}

export function getPhotographers(): Photographer[] {
  return PHOTOGRAPHERS;
}

export function getAmbassadors(): Photographer[] {
  return PHOTOGRAPHERS.filter((p) => p.isAmbassador);
}

export function getSeasons(): Season[] {
  return SEASONS;
}

export function getCommentsFor(photoId: string): Comment[] {
  return COMMENTS[photoId] ?? COMMENTS.default ?? [];
}

export function getVoyageurUsernames(): Set<string> {
  return new Set(PHOTOGRAPHERS.filter((p) => p.isCustomer).map((p) => p.username));
}
