import Link from "next/link";
import { Package } from "lucide-react";
import { getActiveItems } from "@/lib/items";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Behind auth, reads live per-request DB state — must never be statically prerendered
// (a build-time static pass would run this query against a database that isn't
// reachable at build time, and would serve stale data even if it were).
export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await getActiveItems();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Stat cards and the action queue land here in Section 10."
        action={
          <Button nativeButton={false} render={<Link href="/items/new" />}>
            Add item
          </Button>
        }
      />

      {items.length === 0 ? (
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
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">{item.category}</span>
                  <StatusBadge status={item.status} />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
