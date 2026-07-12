import type { FilterableItem } from "./types";

// v1 threshold: zero photos of any type. Not distinguishing by PhotoType (e.g. requiring a
// BEFORE specifically) yet — deliberately the simplest defensible rule until real use shows
// it needs to be more specific.
export function missingPhotos(item: FilterableItem): boolean {
  return item.photos.length === 0;
}
