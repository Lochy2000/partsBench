import Link from "next/link";
import { PackageSearch } from "lucide-react";
import type { Category, ItemStatus } from "@prisma/client";
import { getInventoryItems } from "@/lib/items";
import { SMART_FILTERS, type SmartFilterKey } from "@/lib/filters";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { InventoryFilterBar } from "@/components/inventory-filter-bar";
import { Button } from "@/components/ui/button";

// Behind auth, reads live per-request DB state — must never be statically prerendered
// (same reasoning as the home page, see docs/build/02-app-shell-design-system.md).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function isSmartFilterKey(value: string | undefined): value is SmartFilterKey {
  return value !== undefined && value in SMART_FILTERS;
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
    <Button size="sm" variant={active ? "default" : "outline"} render={<Link href={href} />}>
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
    <Button size="sm" variant="outline" render={<Link href={href} />}>
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

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category,
      status,
      smart,
      archived: showArchived ? "true" : undefined,
      page: undefined,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/inventory?${qs}` : "/inventory";
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`${filtered.length} item${filtered.length === 1 ? "" : "s"}`}
      />

      <div className="mt-4 space-y-3">
        <InventoryFilterBar category={category} status={status} />

        <div className="flex flex-wrap gap-2">
          <FilterTab href={hrefWith({ smart: undefined })} active={!smart}>
            All
          </FilterTab>
          {(Object.keys(SMART_FILTERS) as SmartFilterKey[]).map((key) => (
            <FilterTab key={key} href={hrefWith({ smart: key })} active={smart === key}>
              {SMART_FILTERS[key].label}
            </FilterTab>
          ))}
          <FilterTab
            href={hrefWith({ archived: showArchived ? undefined : "true" })}
            active={showArchived}
          >
            Archived
          </FilterTab>
        </div>
      </div>

      <div className="mt-4">
        {pageItems.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No items match these filters"
            description="Try a different filter, or clear them to see everything."
          />
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {pageItems.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">{item.category}</span>
                  <StatusBadge status={item.status} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <PagerButton
            href={hrefWith({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
          >
            Previous
          </PagerButton>
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <PagerButton
            href={hrefWith({ page: String(currentPage + 1) })}
            disabled={currentPage >= totalPages}
          >
            Next
          </PagerButton>
        </div>
      )}
    </div>
  );
}
