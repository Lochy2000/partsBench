import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// confirmPhotoUpload/deletePhoto call revalidatePath(), which only works inside a real
// Next.js request context — mock it so these can be exercised directly against MinIO + the
// test database.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { confirmPhotoUpload, deletePhoto, requestPhotoUpload } = await import(
  "@/actions/photos"
);
const { createDownloadUrl } = await import("@/lib/r2");

describe("photo pipeline actions (integration)", () => {
  beforeEach(async () => {
    await prisma.testLog.deleteMany();
    await prisma.itemPhoto.deleteMany();
    await prisma.itemSpec.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("requestPhotoUpload returns a presigned URL and a storage key namespaced by item + type", async () => {
    const item = await prisma.item.create({
      data: { name: "Test GPU", category: "GPU", status: "BOUGHT" },
    });

    const { uploadUrl, storageKey } = await requestPhotoUpload({
      itemId: item.id,
      photoType: "BEFORE",
      contentType: "image/jpeg",
      filename: "photo.jpg",
    });

    expect(uploadUrl).toContain(process.env.R2_BUCKET);
    expect(storageKey).toMatch(new RegExp(`^items/${item.id}/before/[^/]+\\.jpg$`));
  });

  it("uploads, confirms, and serves a photo via a signed URL — not accessible unsigned", async () => {
    const item = await prisma.item.create({
      data: { name: "Test GPU", category: "GPU", status: "BOUGHT" },
    });

    const { uploadUrl, storageKey } = await requestPhotoUpload({
      itemId: item.id,
      photoType: "TEST",
      contentType: "image/jpeg",
      filename: "photo.jpg",
    });

    const fileContents = Buffer.from("fake-jpeg-bytes");
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: fileContents,
      headers: { "Content-Type": "image/jpeg" },
    });
    expect(uploadResponse.ok).toBe(true);

    await confirmPhotoUpload({ itemId: item.id, photoType: "TEST", storageKey });

    const photo = await prisma.itemPhoto.findFirstOrThrow({ where: { itemId: item.id } });
    expect(photo.storageKey).toBe(storageKey);
    expect(photo.type).toBe("TEST");

    const signedGetUrl = await createDownloadUrl(storageKey);
    const signedResponse = await fetch(signedGetUrl);
    expect(signedResponse.status).toBe(200);
    expect(await signedResponse.text()).toBe("fake-jpeg-bytes");

    const endpoint = process.env.R2_ENDPOINT;
    const unsignedResponse = await fetch(`${endpoint}/${process.env.R2_BUCKET}/${storageKey}`);
    expect(unsignedResponse.ok).toBe(false);
  });

  it("deletePhoto removes both the R2 object and the DB row", async () => {
    const item = await prisma.item.create({
      data: { name: "Test GPU", category: "GPU", status: "BOUGHT" },
    });

    const { uploadUrl, storageKey } = await requestPhotoUpload({
      itemId: item.id,
      photoType: "AFTER",
      contentType: "image/jpeg",
      filename: "photo.jpg",
    });

    await fetch(uploadUrl, {
      method: "PUT",
      body: Buffer.from("fake-jpeg-bytes"),
      headers: { "Content-Type": "image/jpeg" },
    });
    await confirmPhotoUpload({ itemId: item.id, photoType: "AFTER", storageKey });

    const photo = await prisma.itemPhoto.findFirstOrThrow({ where: { itemId: item.id } });

    await deletePhoto(photo.id);

    expect(await prisma.itemPhoto.findUnique({ where: { id: photo.id } })).toBeNull();

    const signedGetUrl = await createDownloadUrl(storageKey);
    const response = await fetch(signedGetUrl);
    expect(response.status).toBe(404);
  });
});
