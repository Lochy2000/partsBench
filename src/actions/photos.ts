"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { PhotoType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createUploadUrl, deleteObject } from "@/lib/r2";
import { confirmUploadSchema, requestUploadSchema } from "@/lib/validation/photo";

export interface RequestUploadResult {
  uploadUrl: string;
  storageKey: string;
}

export async function requestPhotoUpload(input: {
  itemId: string;
  photoType: PhotoType;
  contentType: string;
  filename: string;
}): Promise<RequestUploadResult> {
  const parsed = requestUploadSchema.parse(input);

  const extension = parsed.filename.split(".").pop() ?? "jpg";
  const storageKey = `items/${parsed.itemId}/${parsed.photoType.toLowerCase()}/${randomUUID()}.${extension}`;

  const uploadUrl = await createUploadUrl(storageKey, parsed.contentType);

  return { uploadUrl, storageKey };
}

export async function confirmPhotoUpload(input: {
  itemId: string;
  photoType: PhotoType;
  storageKey: string;
}): Promise<void> {
  const parsed = confirmUploadSchema.parse(input);

  await prisma.itemPhoto.create({
    data: {
      itemId: parsed.itemId,
      type: parsed.photoType,
      storageKey: parsed.storageKey,
    },
  });

  revalidatePath(`/items/${parsed.itemId}`);
}

export async function deletePhoto(photoId: string): Promise<void> {
  const photo = await prisma.itemPhoto.findUniqueOrThrow({ where: { id: photoId } });

  await deleteObject(photo.storageKey);
  await prisma.itemPhoto.delete({ where: { id: photoId } });

  revalidatePath(`/items/${photo.itemId}`);
}
