import { buildChecklistRows } from "@/lib/checklists";
import { missingPhotos } from "./missing-photos";
import type { FilterableItem } from "./types";

const ALREADY_HANDLED_STATUSES = new Set(["LISTED", "SOLD", "ARCHIVED"]);

// "Ready to list" = every checklist item passed, at least one photo exists, and it isn't
// already listed/sold/archived. A FAIL result means an unresolved fault, not just "untested" —
// re-testing after a repair overwrites the same row (Section 08's upsert), so a lingering FAIL
// here is real, not stale.
export function readyToList(item: FilterableItem): boolean {
  if (ALREADY_HANDLED_STATUSES.has(item.status)) return false;
  if (missingPhotos(item)) return false;

  const rows = buildChecklistRows(item.category, item.testLogs);
  return rows.every((row) => row.result === "PASS");
}
