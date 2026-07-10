import { notFound } from "next/navigation";
import { getItemById } from "@/lib/items";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EditItemForm } from "./edit-item-form";

export default async function EditItemPage({
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
      <PageHeader
        title={item.name}
        description={item.category}
        action={<StatusBadge status={item.status} />}
      />
      <div className="mt-6">
        <EditItemForm item={item} />
      </div>
    </div>
  );
}
