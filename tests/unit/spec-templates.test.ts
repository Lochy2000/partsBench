import { Category } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getSpecTemplateKeysForCategory } from "@/lib/spec-templates";

describe("getSpecTemplateKeysForCategory", () => {
  it("returns a non-empty suggestion list for every category", () => {
    for (const category of Object.values(Category)) {
      const keys = getSpecTemplateKeysForCategory(category);
      expect(keys.length).toBeGreaterThan(0);
    }
  });

  it("returns the GPU template for GPU", () => {
    expect(getSpecTemplateKeysForCategory("GPU")).toContain("VRAM");
  });

  it("falls back to the default template for a category with no dedicated one", () => {
    const other = getSpecTemplateKeysForCategory("OTHER");
    expect(other).toContain("Condition");
  });
});
