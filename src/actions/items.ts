"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/r2";
import {
  bulkItemIdsSchema,
  quickAddItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
} from "@/lib/validation/item";

export interface ItemFormState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createItem(
  _prevState: ItemFormState | undefined,
  formData: FormData,
): Promise<ItemFormState> {
  const parsed = quickAddItemSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const item = await prisma.item.create({ data: parsed.data });

  redirect(`/items/${item.id}`);
}

export async function updateItem(
  _prevState: ItemFormState | undefined,
  formData: FormData,
): Promise<ItemFormState> {
  let specs: unknown;
  try {
    specs = JSON.parse(String(formData.get("specs") ?? "[]"));
  } catch {
    return { formError: "Invalid specs data." };
  }

  const parsed = updateItemSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    category: formData.get("category"),
    costPence: formData.get("costPence"),
    feesPence: formData.get("feesPence"),
    soldPricePence: formData.get("soldPricePence"),
    notes: formData.get("notes") ?? undefined,
    specs,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, specs: specRows, ...data } = parsed.data;

  await prisma.$transaction([
    prisma.item.update({ where: { id }, data }),
    prisma.itemSpec.deleteMany({ where: { itemId: id } }),
    ...(specRows.length > 0
      ? [
          prisma.itemSpec.createMany({
            data: specRows.map((spec) => ({ ...spec, itemId: id })),
          }),
        ]
      : []),
  ]);

  redirect(`/items/${id}`);
}

// Called directly from a client component (not a <form>) so status can change instantly
// without touching the rest of the item's fields — see docs/build/06-item-detail-page.md.
export async function updateItemStatus(id: string, status: ItemStatus): Promise<void> {
  const parsed = updateItemStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    throw new Error("Invalid status update");
  }

  await prisma.item.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath(`/items/${parsed.data.id}`);
  revalidatePath("/");
}

export async function archiveItem(id: string): Promise<void> {
  await prisma.item.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  redirect("/");
}

// Bulk version of archiveItem for the inventory list's multi-select (Section 09) — stays on
// the page (no redirect) since archiving from a list of many items shouldn't navigate away.
export async function bulkArchiveItems(ids: string[]): Promise<void> {
  const parsed = bulkItemIdsSchema.parse({ ids });

  await prisma.item.updateMany({
    where: { id: { in: parsed.ids } },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/inventory");
  revalidatePath("/");
}

// Permanent delete — the one exception to "archive, never delete" (docs/00-OVERVIEW.md #7),
// deliberately narrow: only ever deletes items that are ALREADY archived, re-checked here
// server-side rather than trusted from the client, so this can only ever be reached via the
// archive-first, delete-second flow regardless of what the UI sends. Removes the item's R2
// photo objects too (cascade only covers the database rows, not storage).
export async function bulkDeleteItems(ids: string[]): Promise<{ deletedCount: number }> {
  const parsed = bulkItemIdsSchema.parse({ ids });

  const items = await prisma.item.findMany({
    where: { id: { in: parsed.ids }, status: "ARCHIVED" },
    include: { photos: true },
  });

  await Promise.allSettled(
    items.flatMap((item) => item.photos.map((photo) => deleteObject(photo.storageKey))),
  );

  const { count } = await prisma.item.deleteMany({
    where: { id: { in: items.map((item) => item.id) } },
  });

  revalidatePath("/inventory");
  revalidatePath("/");

  return { deletedCount: count };
}
