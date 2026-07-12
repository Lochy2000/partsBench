import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// setTestResult calls revalidatePath(), which only works inside a real Next.js request
// context — mock it so this can be exercised directly against the test database.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { setTestResult } = await import("@/actions/test-logs");

const CHECKLIST_ITEM = "MemTest86 pass (no errors)";

describe("setTestResult (integration)", () => {
  beforeEach(async () => {
    await prisma.testLog.deleteMany();
    await prisma.itemPhoto.deleteMany();
    await prisma.itemSpec.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a TestLog row on first call", async () => {
    const item = await prisma.item.create({
      data: { name: "Test RAM", category: "RAM", status: "NEEDS_TESTING" },
    });

    await setTestResult({
      itemId: item.id,
      checklistItem: CHECKLIST_ITEM,
      result: "PASS",
      notes: "Ran overnight, 0 errors",
      evidencePhotoId: null,
    });

    const log = await prisma.testLog.findUniqueOrThrow({
      where: { itemId_checklistItem: { itemId: item.id, checklistItem: CHECKLIST_ITEM } },
    });
    expect(log.result).toBe("PASS");
    expect(log.notes).toBe("Ran overnight, 0 errors");
  });

  it("updates the same row instead of creating a duplicate on repeated calls", async () => {
    const item = await prisma.item.create({
      data: { name: "Test RAM", category: "RAM", status: "NEEDS_TESTING" },
    });

    await setTestResult({
      itemId: item.id,
      checklistItem: CHECKLIST_ITEM,
      result: "PENDING",
      notes: null,
      evidencePhotoId: null,
    });
    await setTestResult({
      itemId: item.id,
      checklistItem: CHECKLIST_ITEM,
      result: "FAIL",
      notes: "One error found",
      evidencePhotoId: null,
    });

    const logs = await prisma.testLog.findMany({ where: { itemId: item.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0].result).toBe("FAIL");
    expect(logs[0].notes).toBe("One error found");
  });

  it("links and unlinks an evidence photo", async () => {
    const item = await prisma.item.create({
      data: { name: "Test RAM", category: "RAM", status: "NEEDS_TESTING" },
    });
    const photo = await prisma.itemPhoto.create({
      data: { itemId: item.id, type: "TEST", storageKey: "test/photo.jpg" },
    });

    await setTestResult({
      itemId: item.id,
      checklistItem: CHECKLIST_ITEM,
      result: "PASS",
      notes: null,
      evidencePhotoId: photo.id,
    });

    let log = await prisma.testLog.findFirstOrThrow({ where: { itemId: item.id } });
    expect(log.evidencePhotoId).toBe(photo.id);

    await setTestResult({
      itemId: item.id,
      checklistItem: CHECKLIST_ITEM,
      result: "PASS",
      notes: null,
      evidencePhotoId: null,
    });

    log = await prisma.testLog.findFirstOrThrow({ where: { itemId: item.id } });
    expect(log.evidencePhotoId).toBeNull();
  });

  it("rejects an invalid result and writes nothing", async () => {
    const item = await prisma.item.create({
      data: { name: "Test RAM", category: "RAM", status: "NEEDS_TESTING" },
    });

    await expect(
      setTestResult({
        itemId: item.id,
        checklistItem: CHECKLIST_ITEM,
        result: "NOT_A_RESULT" as never,
        notes: null,
        evidencePhotoId: null,
      }),
    ).rejects.toThrow();

    expect(await prisma.testLog.count({ where: { itemId: item.id } })).toBe(0);
  });
});
