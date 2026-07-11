import { PhotoType } from "@prisma/client";
import { z } from "zod";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;

export const requestUploadSchema = z.object({
  itemId: z.string().min(1),
  photoType: z.enum(PhotoType),
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  filename: z.string().min(1).max(255),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z.object({
  itemId: z.string().min(1),
  photoType: z.enum(PhotoType),
  storageKey: z.string().min(1),
});

export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
