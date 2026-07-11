import { describe, expect, it } from "vitest";
import {
  quickAddItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
} from "@/lib/validation/item";

describe("quickAddItemSchema", () => {
  it("accepts valid input", () => {
    const result = quickAddItemSchema.safeParse({ name: "RTX 3070", category: "GPU" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = quickAddItemSchema.safeParse({ name: "", category: "GPU" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing category", () => {
    const result = quickAddItemSchema.safeParse({ name: "RTX 3070" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category value", () => {
    const result = quickAddItemSchema.safeParse({
      name: "RTX 3070",
      category: "NOT_A_CATEGORY",
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from the name", () => {
    const result = quickAddItemSchema.safeParse({ name: "  RTX 3070  ", category: "GPU" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("RTX 3070");
    }
  });
});

describe("updateItemSchema", () => {
  const validBase = {
    id: "abc123",
    name: "RTX 3070",
    category: "GPU",
    costPence: 25000,
    feesPence: 0,
    soldPricePence: null,
    specs: [],
  };

  it("accepts valid input with an empty spec array", () => {
    const result = updateItemSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts valid specs", () => {
    const result = updateItemSchema.safeParse({
      ...validBase,
      specs: [{ key: "VRAM", value: "8GB" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate spec keys, case-insensitively", () => {
    const result = updateItemSchema.safeParse({
      ...validBase,
      specs: [
        { key: "VRAM", value: "8GB" },
        { key: "vram", value: "16GB" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative cost", () => {
    const result = updateItemSchema.safeParse({ ...validBase, costPence: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer cost", () => {
    const result = updateItemSchema.safeParse({ ...validBase, costPence: 10.5 });
    expect(result.success).toBe(false);
  });

  it("treats an empty string soldPricePence as null", () => {
    const result = updateItemSchema.safeParse({ ...validBase, soldPricePence: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.soldPricePence).toBeNull();
    }
  });

});

describe("updateItemStatusSchema", () => {
  it("accepts a valid status", () => {
    const result = updateItemStatusSchema.safeParse({
      id: "abc123",
      status: "NEEDS_TESTING",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status", () => {
    const result = updateItemStatusSchema.safeParse({
      id: "abc123",
      status: "NOT_A_STATUS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing id", () => {
    const result = updateItemStatusSchema.safeParse({ status: "NEEDS_TESTING" });
    expect(result.success).toBe(false);
  });
});
