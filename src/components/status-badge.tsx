import type { ItemStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<ItemStatus, string> = {
  BOUGHT: "Bought",
  NEEDS_CLEANING: "Needs cleaning",
  NEEDS_TESTING: "Needs testing",
  FAULT_FOUND: "Fault found",
  REPAIRING: "Repairing",
  READY_TO_LIST: "Ready to list",
  LISTED: "Listed",
  SOLD: "Sold",
  ARCHIVED: "Archived",
};

// Dot color maps to the 8-hue categorical palette in globals.css (--chart-1..8),
// validated for CVD-safety and contrast via the dataviz skill's methodology. Text
// stays neutral ink regardless of status — the dot carries identity, never color
// alone (some hues here, e.g. yellow/aqua/magenta, only clear a contrast WARN band,
// which is safe to ship precisely because color isn't the only channel: pairing
// with a visible label is the required mitigation). ARCHIVED gets the muted token
// rather than a categorical hue — deliberately desaturated so inactive items recede
// instead of competing with active-state colors.
export const STATUS_DOT_CLASS: Record<ItemStatus, string> = {
  LISTED: "bg-chart-1",
  READY_TO_LIST: "bg-chart-2",
  NEEDS_TESTING: "bg-chart-3",
  SOLD: "bg-chart-4",
  BOUGHT: "bg-chart-5",
  FAULT_FOUND: "bg-chart-6",
  REPAIRING: "bg-chart-7",
  NEEDS_CLEANING: "bg-chart-8",
  ARCHIVED: "bg-muted-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ItemStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT_CLASS[status])}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
