import { PhotoType } from "@prisma/client";
import { z } from "zod";

export const requestUploadSchema = z.object({
  itemId: z.string().min(1),
  photoType: z.enum(PhotoType),
  // Not a strict image/* allowlist — real camera captures (especially on Android) report MIME
  // types that don't match any fixed list, sometimes even an empty string, and this is an
  // authenticated single-user tool, not a public upload endpoint, so there's nothing a stricter
  // check would actually be defending against. A previous exact-enum version rejected real
  // camera photos outright (desktop file-picker uploads worked, phone camera captures didn't).
  contentType: z.string().min(1),
  filename: z.string().min(1).max(255),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z.object({
  itemId: z.string().min(1),
  photoType: z.enum(PhotoType),
  storageKey: z.string().min(1),
});

export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
