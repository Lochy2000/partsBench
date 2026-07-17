import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import type { Category, ItemStatus } from "@prisma/client";
import { getInventoryItems } from "@/lib/items";
import { SMART_FILTERS, type SmartFilterKey } from "@/lib/filters";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InventoryFilterBar } from "@/components/inventory-filter-bar";
import { InventoryList } from "@/components/inventory-list";
import { InventoryListSkeleton } from "@/components/inventory-list-skeleton";
import { Button } from "@/components/ui/button";

// Behind auth, reads live per-request DB state — must never be statically prerendered
// (same reasoning as the home page, see docs/build/02-app-shell-design-system.md).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type InventoryFilterState = {
  category: Category | undefined;
  status: ItemStatus | undefined;
  smart: SmartFilterKey | undefined;
  showArchived: boolean;
};

function isSmartFilterKey(value: string | undefined): value is SmartFilterKey {
  return value !== undefined && value in SMART_FILTERS;
}

// Pure so both the instantly-rendered filter shell and the suspended results
// (which needs pager links) can build hrefs without waiting on each other.
function hrefWith(base: InventoryFilterState, overrides: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  const merged: Record<string, string | undefined> = {
    category: base.category,
    status: base.status,
    smart: base.smart,
    archived: base.showArchived ? "true" : undefined,
    page: undefined,
    ...overrides,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/inventory?${qs}` : "/inventory";
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={active ? "default" : "outline"}
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

function PagerButton({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button size="sm" variant="outline" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={href} />}>
      {children}
    </Button>
  );
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const category = params.category as Category | undefined;
  const status = params.status as ItemStatus | undefined;
  const smart = isSmartFilterKey(params.smart) ? params.smart : undefined;
  const showArchived = params.archived === "true";
  const requestedPage = Math.max(1, Number(params.page ?? "1") || 1);

  const base: InventoryFilterState = { category, status, smart, showArchived };

  // Keyed by the full filter state so each change remounts the boundary and
  // shows the skeleton again, instead of leaving stale results on screen.
  const resultsKey = `${category ?? ""}|${status ?? ""}|${smart ?? ""}|${showArchived}|${requestedPage}`;

  return (
    <div>
      <PageHeader title="Inventory" />

      <div className="mt-4 space-y-3">
        <InventoryFilterBar category={category} status={status} />

        <div className="flex flex-wrap gap-2">
          <FilterTab href={hrefWith(base, { smart: undefined })} active={!smart}>
            All
          </FilterTab>
          {(Object.keys(SMART_FILTERS) as SmartFilterKey[]).map((key) => (
            <FilterTab key={key} href={hrefWith(base, { smart: key })} active={smart === key}>
              {SMART_FILTERS[key].label}
            </FilterTab>
          ))}
          <FilterTab
            href={hrefWith(base, { archived: showArchived ? undefined : "true" })}
            active={showArchived}
          >
            Archived
          </FilterTab>
        </div>
      </div>

      <Suspense key={resultsKey} fallback={<InventoryListSkeleton />}>
        <InventoryResults base={base} requestedPage={requestedPage} />
      </Suspense>
    </div>
  );
}

async function InventoryResults({
  base,
  requestedPage,
}: {
  base: InventoryFilterState;
  requestedPage: number;
}) {
  const { category, status, smart, showArchived } = base;
  const items = await getInventoryItems({ includeArchived: showArchived });

  let filtered = items;
  if (category) filtered = filtered.filter((item) => item.category === category);
  if (status) filtered = filtered.filter((item) => item.status === status);
  if (smart) filtered = filtered.filter(SMART_FILTERS[smart].predicate);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        {filtered.length} item{filtered.length === 1 ? "" : "s"}
      </p>

      {pageItems.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No items match these filters"
          description="Try a different filter, or clear them to see everything."
        />
      ) : (
        <InventoryList items={pageItems} showArchived={showArchived} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PagerButton
            href={hrefWith(base, { page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
          >
            Previous
          </PagerButton>
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <PagerButton
            href={hrefWith(base, { page: String(currentPage + 1) })}
            disabled={currentPage >= totalPages}
          >
            Next
          </PagerButton>
        </div>
      )}
    </div>
  );
}
