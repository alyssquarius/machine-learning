import { safeImageUrl } from './format';

export const MAX_CAR_PHOTOS = 10;
export function carPhotos(car: { images?: unknown; image?: unknown }): string[] {
  const values = Array.isArray(car.images) && car.images.length ? car.images : [car.image];
  return [...new Set(values.map(safeImageUrl).filter(Boolean))].slice(0, MAX_CAR_PHOTOS);
}
