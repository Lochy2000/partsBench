import { notFound } from "next/navigation";
import { getItemById } from "@/lib/items";
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
    <div className="mx-auto w-full max-w-2xl p-4">
      <EditItemForm item={item} />
    </div>
  );
}
