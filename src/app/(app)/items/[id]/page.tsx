import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getItemById } from "@/lib/items";
import { PageHeader } from "@/components/page-header";
import { StatusChanger } from "@/components/status-changer";
import { ItemForm } from "./item-form";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <PageHeader
        title={item.name}
        description={item.category}
        action={<StatusChanger itemId={item.id} status={item.status} />}
      />
      <div className="mt-6">
        <ItemForm item={item} />
      </div>
    </div>
  );
}
