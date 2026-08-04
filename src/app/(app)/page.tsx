import Link from "next/link";
import { AlertCircle, CircleCheckBig, CirclePoundSterling, Package, Tag } from "lucide-react";
import { getInventoryItems } from "@/lib/items";
import { rankActionQueue } from "@/lib/actionQueue";
import { formatPence } from "@/lib/currency";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Behind auth, reads live per-request DB state — must never be statically prerendered
// (a build-time static pass would run this query against a database that isn't
// reachable at build time, and would serve stale data even if it were).
export const dynamic = "force-dynamic";

const QUEUE_DISPLAY_LIMIT = 5;

export default async function Home() {
  const items = await getInventoryItems();

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          action={
            <Button nativeButton={false} render={<Link href="/items/new" />}>
              Add item
            </Button>
          }
        />
        <EmptyState
          icon={Package}
          title="No items yet"
          description="Add your first part to get started."
          action={
            <Button nativeButton={false} render={<Link href="/items/new" />}>
              Add item
            </Button>
          }
        />
      </>
    );
  }

  const queue = rankActionQueue(items);
  const visibleQueue = queue.slice(0, QUEUE_DISPLAY_LIMIT);
  const remaining = queue.length - visibleQueue.length;

  const listedCount = items.filter((item) => item.status === "LISTED").length;
  const totalInvestedPence = items.reduce(
    (sum, item) => sum + item.costPence + item.feesPence,
    0,
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What needs your attention right now."
        action={
          <Button nativeButton={false} render={<Link href="/items/new" />}>
            Add item
          </Button>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active items" value={String(items.length)} icon={Package} />
        <StatCard label="Needs attention" value={String(queue.length)} icon={AlertCircle} />
        <StatCard label="Listed" value={String(listedCount)} icon={Tag} />
        <StatCard
          label="Total invested"
          value={formatPence(totalInvestedPence)}
          icon={CirclePoundSterling}
        />
      </div>

      <div className="mt-6 space-y-2">
        <h2 className="text-sm font-medium text-foreground">Action queue</h2>

        {visibleQueue.length === 0 ? (
          <EmptyState
            icon={CircleCheckBig}
            title="All caught up"
            description="Nothing needs attention right now."
          />
        ) : (
          <>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {visibleQueue.map(({ item, reason }) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {item.name}
                      </span>
                      <span className="block truncate text-muted-foreground">{reason}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-muted-foreground">{item.category}</span>
                      <StatusBadge status={item.status} />
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {remaining > 0 && (
              <Link
                href="/inventory"
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                +{remaining} more need attention — view full inventory
              </Link>
            )}
          </>
        )}
      </div>
    </>
  );
}
