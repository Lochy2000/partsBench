import { buildChecklistRows } from "@/lib/checklists";
import { missingPhotos, needsTesting, readyToList } from "@/lib/filters";
import type { FilterableItem } from "@/lib/filters";

const TERMINAL_STATUSES = new Set(["LISTED", "SOLD", "ARCHIVED"]);
const ALREADY_READY_STATUSES = new Set(["READY_TO_LIST", "LISTED"]);

export interface ActionQueueItem extends FilterableItem {
  id: string;
  createdAt: Date;
}

export interface ActionQueueEntry<T extends ActionQueueItem> {
  item: T;
  reason: string;
}

interface RankedReason {
  tier: number;
  reason: string;
}

// Each item gets exactly one reason: the first tier below it matches. Tiers are ordered by
// urgency, not by how "finished" the item is — a stuck/faulty item outranks one that just
// needs a quick status flip. Terminal statuses never appear here at all (nothing actionable
// to surface yet — that's the deferred staleness/idle-time rule, not this section).
function rankReason(item: ActionQueueItem): RankedReason | null {
  if (TERMINAL_STATUSES.has(item.status)) return null;

  if (item.status === "FAULT_FOUND") {
    return { tier: 1, reason: "Fault found — needs a repair decision" };
  }

  if (missingPhotos(item)) {
    const reason = item.testLogs.length === 0 ? "Just added — no photos yet" : "No photos yet";
    return { tier: 2, reason };
  }

  if (needsTesting(item)) {
    const pendingCount = buildChecklistRows(item.category, item.testLogs).filter(
      (row) => row.result === "PENDING",
    ).length;
    return {
      tier: 3,
      reason: `${pendingCount} checklist item${pendingCount === 1 ? "" : "s"} still pending`,
    };
  }

  // Checked before the "ready to advance" nudge: a manually-flagged cleaning need means the
  // item isn't presentable yet even if it's functionally tested and photographed.
  if (item.status === "NEEDS_CLEANING") {
    return { tier: 4, reason: "Needs cleaning before testing" };
  }

  if (readyToList(item) && !ALREADY_READY_STATUSES.has(item.status)) {
    return { tier: 5, reason: "Fully tested and photographed — move to Ready to List" };
  }

  return null;
}

// Pure function: full item set in, ranked { item, reason } list out. No DB access, no React —
// reuses Section 09's predicates as building blocks rather than re-deriving the same conditions.
export function rankActionQueue<T extends ActionQueueItem>(items: T[]): ActionQueueEntry<T>[] {
  const ranked: { item: T; tier: number; reason: string }[] = [];

  for (const item of items) {
    const ranking = rankReason(item);
    if (ranking) ranked.push({ item, tier: ranking.tier, reason: ranking.reason });
  }

  ranked.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.item.createdAt.getTime() - b.item.createdAt.getTime();
  });

  return ranked.map(({ item, reason }) => ({ item, reason }));
}
