import { missingPhotos } from "./missing-photos";
import { needsTesting } from "./needs-testing";
import { readyToList } from "./ready-to-list";
import type { FilterableItem } from "./types";

export { missingPhotos, needsTesting, readyToList };
export type { FilterableItem };

export type SmartFilterKey = "needsTesting" | "missingPhotos" | "readyToList";

export const SMART_FILTERS: Record<
  SmartFilterKey,
  { label: string; predicate: (item: FilterableItem) => boolean }
> = {
  needsTesting: { label: "Needs testing", predicate: needsTesting },
  missingPhotos: { label: "Missing photos", predicate: missingPhotos },
  readyToList: { label: "Ready to list", predicate: readyToList },
};
