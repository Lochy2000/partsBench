import { Skeleton } from "@/components/ui/skeleton";

export function InventoryListSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <Skeleton className="h-4 w-20" />
      <div className="divide-y divide-border rounded-lg border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-40" />
            <span className="ml-auto flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
