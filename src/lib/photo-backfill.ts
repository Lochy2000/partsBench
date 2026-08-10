import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { deleteObject, getObjectBytes, putObjectBytes } from "@/lib/r2";

// Shared by scripts/compress-existing-photos.ts (local, against any env file) and
// src/app/api/admin/compress-photos/route.ts (runs on Vercel, where secrets like DATABASE_URL
// are only ever resolved by the running app, never exportable to a local .env file — see
// docs/build/07-photo-pipeline.md). Re-encodes existing ItemPhoto objects using the same rules
// as the upload-time compression in src/lib/image-compression.ts.
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 82;

export interface BackfillBatchResult {
  processed: number;
  rewritten: number;
  skipped: number;
  failed: number;
  bytesBefore: number;
  bytesAfter: number;
  nextCursor: string | null;
  done: boolean;
  log: string[];
}

function isCompressibleKey(key: string): boolean {
  const ext = key.split(".").pop()?.toLowerCase();
  return ext !== undefined && ["jpg", "jpeg", "png", "webp"].includes(ext);
}

export async function compressBackfillBatch({
  dryRun,
  limit,
  cursor,
}: {
  dryRun: boolean;
  limit: number;
  cursor: string | null;
}): Promise<BackfillBatchResult> {
  const photos = await prisma.itemPhoto.findMany({
    select: { id: true, storageKey: true },
    orderBy: { id: "asc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const result: BackfillBatchResult = {
    processed: photos.length,
    rewritten: 0,
    skipped: 0,
    failed: 0,
    bytesBefore: 0,
    bytesAfter: 0,
    nextCursor: photos.length > 0 ? photos[photos.length - 1].id : cursor,
    done: photos.length < limit,
    log: [],
  };

  for (const photo of photos) {
    if (!isCompressibleKey(photo.storageKey)) {
      result.skipped++;
      continue;
    }

    try {
      const original = await getObjectBytes(photo.storageKey);

      const compressed = await sharp(original)
        .rotate() // apply EXIF orientation before stripping metadata, same as the browser path
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();

      if (compressed.length >= original.length) {
        result.skipped++;
        continue;
      }

      // Standardize on .jpg like the client-side compressor does — sharp always outputs JPEG
      // here regardless of source format.
      const newKey = photo.storageKey.replace(/\.[^./]+$/, ".jpg");

      result.log.push(
        `${photo.storageKey} — ${(original.length / 1024).toFixed(0)}KB -> ${(compressed.length / 1024).toFixed(0)}KB` +
          (newKey !== photo.storageKey ? ` (renamed to ${newKey})` : ""),
      );

      if (!dryRun) {
        await putObjectBytes(newKey, compressed, "image/jpeg");
        if (newKey !== photo.storageKey) {
          await prisma.itemPhoto.update({
            where: { id: photo.id },
            data: { storageKey: newKey },
          });
          await deleteObject(photo.storageKey);
        }
      }

      result.rewritten++;
      result.bytesBefore += original.length;
      result.bytesAfter += compressed.length;
    } catch (err) {
      result.failed++;
      result.log.push(`Failed on ${photo.storageKey}: ${String(err)}`);
    }
  }

  return result;
}
