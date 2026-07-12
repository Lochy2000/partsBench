import { buildChecklistRows } from "@/lib/checklists";
import type { FilterableItem } from "./types";

// "Needs testing" = at least one checklist item for this item's category hasn't been run yet.
export function needsTesting(item: FilterableItem): boolean {
  const rows = buildChecklistRows(item.category, item.testLogs);
  return rows.some((row) => row.result === "PENDING");
}
