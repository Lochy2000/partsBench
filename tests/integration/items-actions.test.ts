import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// createItem/updateItem/archiveItem call redirect(), and updateItemStatus calls revalidatePath() —
// both only work inside a real Next.js request context — mock so these can be exercised directly
// against the test database.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { archiveItem, createItem, updateItem, updateItemStatus } = await import(
  "@/actions/items"
);
const { getActiveItems } = await import("@/lib/items");

function buildFormData(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("item server actions (integration)", () => {
  beforeEach(async () => {
    await prisma.testLog.deleteMany();
    await prisma.itemPhoto.deleteMany();
    await prisma.itemSpec.deleteMany();
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("createItem creates an item from just name + category", async () => {
    const result = await createItem(
      undefined,
      buildFormData({ name: "Test GPU", category: "GPU" }),
    );

    expect(result?.fieldErrors).toBeUndefined();

    const items = await prisma.item.findMany();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Test GPU");
    expect(items[0].category).toBe("GPU");
    expect(items[0].status).toBe("BOUGHT");
  });

  it("createItem returns field errors and writes nothing on invalid input", async () => {
    const result = await createItem(
      undefined,
      buildFormData({ name: "", category: "GPU" }),
    );

    expect(result?.fieldErrors?.name).toBeDefined();
    expect(await prisma.item.count()).toBe(0);
  });

  it("updateItem updates core fields and replaces specs", async () => {
    const item = await prisma.item.create({
      data: {
        name: "Old name",
        category: "GPU",
        status: "BOUGHT",
        specs: { create: [{ key: "OldKey", value: "OldValue" }] },
      },
    });

    const formData = buildFormData({
      id: item.id,
      name: "New name",
      category: "GPU",
      costPence: "1000",
      feesPence: "0",
      soldPricePence: "",
    });
    formData.set("specs", JSON.stringify([{ key: "NewKey", value: "NewValue" }]));

    const result = await updateItem(undefined, formData);
    expect(result?.fieldErrors).toBeUndefined();

    const updated = await prisma.item.findUniqueOrThrow({
      where: { id: item.id },
      include: { specs: true },
    });

    expect(updated.name).toBe("New name");
    // status is untouched by updateItem — it's changed independently via updateItemStatus.
    expect(updated.status).toBe("BOUGHT");
    expect(updated.costPence).toBe(1000);
    expect(updated.specs).toHaveLength(1);
    expect(updated.specs[0].key).toBe("NewKey");
  });

  it("updateItem rejects duplicate spec keys and leaves specs unchanged", async () => {
    const item = await prisma.item.create({
      data: {
        name: "Item",
        category: "GPU",
        status: "BOUGHT",
        specs: { create: [{ key: "Original", value: "Value" }] },
      },
    });

    const formData = buildFormData({
      id: item.id,
      name: "Item",
      category: "GPU",
      costPence: "0",
      feesPence: "0",
      soldPricePence: "",
    });
    formData.set(
      "specs",
      JSON.stringify([
        { key: "Speed", value: "3200MHz" },
        { key: "speed", value: "duplicate" },
      ]),
    );

    const result = await updateItem(undefined, formData);
    expect(result?.fieldErrors?.specs).toBeDefined();

    const unchanged = await prisma.itemSpec.findMany({ where: { itemId: item.id } });
    expect(unchanged).toHaveLength(1);
    expect(unchanged[0].key).toBe("Original");
  });

  it("updateItemStatus changes only the status field", async () => {
    const item = await prisma.item.create({
      data: {
        name: "Item",
        category: "GPU",
        status: "BOUGHT",
        costPence: 500,
        specs: { create: [{ key: "Speed", value: "3200MHz" }] },
      },
    });

    await updateItemStatus(item.id, "NEEDS_TESTING");

    const updated = await prisma.item.findUniqueOrThrow({
      where: { id: item.id },
      include: { specs: true },
    });
    expect(updated.status).toBe("NEEDS_TESTING");
    expect(updated.name).toBe("Item");
    expect(updated.costPence).toBe(500);
    expect(updated.specs).toHaveLength(1);
  });

  it("updateItemStatus rejects an invalid status and writes nothing", async () => {
    const item = await prisma.item.create({
      data: { name: "Item", category: "GPU", status: "BOUGHT" },
    });

    await expect(
      updateItemStatus(item.id, "NOT_A_STATUS" as never),
    ).rejects.toThrow();

    const unchanged = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(unchanged.status).toBe("BOUGHT");
  });

  it("archiveItem sets status to ARCHIVED and excludes it from getActiveItems", async () => {
    const item = await prisma.item.create({
      data: { name: "Item", category: "GPU", status: "READY_TO_LIST" },
    });
    const other = await prisma.item.create({
      data: { name: "Other", category: "RAM", status: "BOUGHT" },
    });

    await archiveItem(item.id);

    const archived = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(archived.status).toBe("ARCHIVED");

    const active = await getActiveItems();
    expect(active.map((i) => i.id)).toEqual([other.id]);
  });
});
