"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
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
