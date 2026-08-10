// Browser-only. Phone camera photos routinely come in at 4-5MB / 12MP+, which is far more
// resolution than a parts listing needs — downscaling + re-encoding client-side keeps the
// camera/camera-roll upload flow intact while cutting uploaded bytes by ~10x.
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;

// GIFs would lose animation if run through canvas; anything not raster-image shouldn't be
// touched either.
function isCompressible(file: File): boolean {
  return file.type.startsWith("image/") && file.type !== "image/gif";
}

export async function compressImageFile(file: File): Promise<File> {
  if (!isCompressible(file)) return file;

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF orientation tag during decode — without it, phone photos
    // shot in portrait can come out sideways once the tag is stripped by re-encoding.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    console.error("Image decode failed, uploading original:", err);
    return file;
  }

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^./]+$/, "") + ".jpg";
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
