import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// bulkArchiveItems/bulkDeleteItems call revalidatePath(), which only works inside a real
// Next.js request context — mock it so these can be exercised directly against the test
// database (and, for the photo-cleanup test, real MinIO).
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { bulkArchiveItems, bulkDeleteItems } = await import("@/actions/items");
const { confirmPhotoUpload, requestPhotoUpload } = await import("@/actions/photos");
const { createDownloadUrl } = await import("@/lib/r2");

describe("bulkArchiveItems (integration)", () => {
  beforeEach(async () => {
    await prisma.testLog.deleteMany();
    await prisma.itemPhoto.deleteMany();
    await prisma.itemSpec.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("archives every selected item", async () => {
    const a = await prisma.item.create({
      data: { name: "A", category: "GPU", status: "BOUGHT" },
    });
    const b = await prisma.item.create({
      data: { name: "B", category: "RAM", status: "NEEDS_TESTING" },
    });

    await bulkArchiveItems([a.id, b.id]);

    const items = await prisma.item.findMany({ where: { id: { in: [a.id, b.id] } } });
    expect(items.every((item) => item.status === "ARCHIVED")).toBe(true);
  });

  it("rejects an empty selection", async () => {
    await expect(bulkArchiveItems([])).rejects.toThrow();
  });
});

describe("bulkDeleteItems (integration)", () => {
  beforeEach(async () => {
    await prisma.testLog.deleteMany();
    await prisma.itemPhoto.deleteMany();
    await prisma.itemSpec.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deletes an archived item and its specs/test logs", async () => {
    const item = await prisma.item.create({
      data: {
        name: "Junk item",
        category: "RAM",
        status: "ARCHIVED",
        specs: { create: [{ key: "Speed", value: "3200MHz" }] },
      },
    });
    await prisma.testLog.create({
      data: { itemId: item.id, checklistItem: "MemTest86 pass (no errors)", result: "PASS" },
    });

    const result = await bulkDeleteItems([item.id]);

    expect(result.deletedCount).toBe(1);
    expect(await prisma.item.findUnique({ where: { id: item.id } })).toBeNull();
    expect(await prisma.itemSpec.count({ where: { itemId: item.id } })).toBe(0);
    expect(await prisma.testLog.count({ where: { itemId: item.id } })).toBe(0);
  });

  it("refuses to delete an item that isn't archived, even if requested", async () => {
    const active = await prisma.item.create({
      data: { name: "Still active", category: "GPU", status: "BOUGHT" },
    });

    const result = await bulkDeleteItems([active.id]);

    expect(result.deletedCount).toBe(0);
    const stillThere = await prisma.item.findUnique({ where: { id: active.id } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.status).toBe("BOUGHT");
  });

  it("deletes only the archived items from a mixed selection, leaving active ones untouched", async () => {
    const archived = await prisma.item.create({
      data: { name: "Archived", category: "GPU", status: "ARCHIVED" },
    });
    const active = await prisma.item.create({
      data: { name: "Active", category: "GPU", status: "LISTED" },
    });

    const result = await bulkDeleteItems([archived.id, active.id]);

    expect(result.deletedCount).toBe(1);
    expect(await prisma.item.findUnique({ where: { id: archived.id } })).toBeNull();
    expect(await prisma.item.findUnique({ where: { id: active.id } })).not.toBeNull();
  });

  it("removes the item's photos from storage, not just the database rows", async () => {
    const item = await prisma.item.create({
      data: { name: "With photo", category: "GPU", status: "ARCHIVED" },
    });

    const { uploadUrl, storageKey } = await requestPhotoUpload({
      itemId: item.id,
      photoType: "TEST",
      contentType: "image/jpeg",
      filename: "photo.jpg",
    });
    await fetch(uploadUrl, {
      method: "PUT",
      body: Buffer.from("fake-jpeg-bytes"),
      headers: { "Content-Type": "image/jpeg" },
    });
    await confirmPhotoUpload({ itemId: item.id, photoType: "TEST", storageKey });

    await bulkDeleteItems([item.id]);

    const signedGetUrl = await createDownloadUrl(storageKey);
    const response = await fetch(signedGetUrl);
    expect(response.status).toBe(404);
  });

  it("rejects an empty selection", async () => {
    await expect(bulkDeleteItems([])).rejects.toThrow();
  });
});
