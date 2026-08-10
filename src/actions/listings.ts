"use server";

import { revalidatePath } from "next/cache";
import type { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createListingSchema, updateListingStatusSchema } from "@/lib/validation/listing";

export interface ListingFormState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createListing(
  _prevState: ListingFormState | undefined,
  formData: FormData,
): Promise<ListingFormState> {
  const parsed = createListingSchema.safeParse({
    itemId: formData.get("itemId"),
    platform: formData.get("platform"),
    url: formData.get("url") ?? undefined,
    pricePence: formData.get("pricePence"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.listing.create({ data: parsed.data });

  revalidatePath(`/items/${parsed.data.itemId}`);
  return {};
}

// Called directly from a client component (not a <form>), same convention as
// updateItemStatus — a listing attempt's status is a single independent field.
export async function updateListingStatus(id: string, status: ListingStatus): Promise<void> {
  const parsed = updateListingStatusSchema.parse({ id, status });

  const listing = await prisma.listing.update({
    where: { id: parsed.id },
    data: { status: parsed.status },
  });

  revalidatePath(`/items/${listing.itemId}`);
}

export async function deleteListing(id: string): Promise<void> {
  const listing = await prisma.listing.delete({ where: { id } });

  revalidatePath(`/items/${listing.itemId}`);
}
