import JSZip from "jszip";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getObjectBytes } from "@/lib/r2";

// aws-sdk needs Node APIs, not the Edge runtime.
export const runtime = "nodejs";

// Zips whatever photo ids the caller asks for, scoped to this item — no PhotoType filtering,
// no "must be tagged LISTING" requirement. Which photos to offer is entirely a client-side
// selection concern (see ListingPhotoExport); this endpoint just packs what it's given.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: itemId } = await params;
  const photoIds = request.nextUrl.searchParams.getAll("photoId");

  if (photoIds.length === 0) {
    return new Response("No photos selected", { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { name: true } });
  if (!item) {
    return new Response("Item not found", { status: 404 });
  }

  const photos = await prisma.itemPhoto.findMany({
    where: { id: { in: photoIds }, itemId },
  });

  if (photos.length === 0) {
    return new Response("No matching photos for this item", { status: 400 });
  }

  const zip = new JSZip();
  for (const photo of photos) {
    const bytes = await getObjectBytes(photo.storageKey);
    const extension = photo.storageKey.split(".").pop() ?? "jpg";
    zip.file(`${photo.type.toLowerCase()}-${photo.id}.${extension}`, bytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const filename = `${item.name.replace(/[^a-z0-9-]+/gi, "-")}-photos.zip`;

  // TS 5.7+ types both Buffer and jszip's Uint8Array output as Uint8Array<ArrayBufferLike>
  // (ArrayBufferLike also covers SharedArrayBuffer), which Response's BodyInit rejects even
  // though this is always a real ArrayBuffer at runtime — a type-system gap, not a real bug.
  return new Response(zipBytes as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
