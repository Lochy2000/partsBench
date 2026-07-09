import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Item CRUD (integration)", () => {
  beforeEach(async () => {
    await prisma.testLog.deleteMany();
    await prisma.itemPhoto.deleteMany();
    await prisma.itemSpec.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates an item with specs and reads it back with relations", async () => {
    const created = await prisma.item.create({
      data: {
        name: "Test GPU",
        category: "GPU",
        status: "NEEDS_TESTING",
        costPence: 12345,
        specs: {
          create: [
            { key: "VRAM", value: "8GB" },
            { key: "Interface", value: "PCIe 4.0" },
          ],
        },
      },
    });

    const found = await prisma.item.findUniqueOrThrow({
      where: { id: created.id },
      include: { specs: true, photos: true, testLogs: true },
    });

    expect(found.name).toBe("Test GPU");
    expect(found.category).toBe("GPU");
    expect(found.costPence).toBe(12345);
    expect(found.specs).toHaveLength(2);
    expect(found.specs.map((s) => s.key).sort()).toEqual(["Interface", "VRAM"]);
    expect(found.photos).toHaveLength(0);
    expect(found.testLogs).toHaveLength(0);
  });

  it("links a test log to an evidence photo", async () => {
    const item = await prisma.item.create({
      data: {
        name: "Test RAM",
        category: "RAM",
        status: "NEEDS_TESTING",
        costPence: 1000,
      },
    });

    const photo = await prisma.itemPhoto.create({
      data: { itemId: item.id, type: "TEST", storageKey: "test/photo.jpg" },
    });

    const log = await prisma.testLog.create({
      data: {
        itemId: item.id,
        checklistItem: "MemTest86 pass",
        result: "PASS",
        evidencePhotoId: photo.id,
      },
    });

    const found = await prisma.testLog.findUniqueOrThrow({
      where: { id: log.id },
      include: { evidencePhoto: true },
    });

    expect(found.evidencePhoto?.id).toBe(photo.id);
    expect(found.result).toBe("PASS");
  });

  it("cascades delete: removing an item removes its specs and photos", async () => {
    const item = await prisma.item.create({
      data: {
        name: "Test Storage",
        category: "STORAGE",
        status: "BOUGHT",
        costPence: 500,
        specs: { create: [{ key: "Interface", value: "SATA" }] },
        photos: { create: [{ type: "BEFORE", storageKey: "test/before.jpg" }] },
      },
    });

    await prisma.item.delete({ where: { id: item.id } });

    expect(await prisma.itemSpec.count({ where: { itemId: item.id } })).toBe(0);
    expect(await prisma.itemPhoto.count({ where: { itemId: item.id } })).toBe(0);
  });
});
