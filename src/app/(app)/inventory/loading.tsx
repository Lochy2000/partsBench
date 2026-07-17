import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryListSkeleton } from "@/components/inventory-list-skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Inventory" />

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <InventoryListSkeleton />
    </div>
  );
}
