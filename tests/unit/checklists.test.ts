import { describe, expect, it } from "vitest";
import { buildChecklistRows, getChecklistForCategory } from "@/lib/checklists";

describe("getChecklistForCategory", () => {
  it("returns the GPU checklist for GPU", () => {
    const checklist = getChecklistForCategory("GPU");
    expect(checklist).toContain("Boots and displays video");
  });

  it("returns the RAM checklist for RAM", () => {
    const checklist = getChecklistForCategory("RAM");
    expect(checklist).toContain("MemTest86 pass (no errors)");
  });

  it("returns the STORAGE checklist for STORAGE", () => {
    const checklist = getChecklistForCategory("STORAGE");
    expect(checklist).toContain("SMART status healthy");
  });

  it("returns the CPU checklist for CPU", () => {
    const checklist = getChecklistForCategory("CPU");
    expect(checklist).toContain("Boots successfully in test rig");
  });

  it("falls back to the default checklist for a category with no dedicated one", () => {
    const psu = getChecklistForCategory("PSU");
    const caseChecklist = getChecklistForCategory("CASE");
    expect(psu).toEqual(caseChecklist);
    expect(psu).toContain("Powers on / functions as expected");
  });
});

describe("buildChecklistRows", () => {
  it("defaults every row to PENDING with no notes/evidence when no TestLog rows exist", () => {
    const rows = buildChecklistRows("RAM", []);
    expect(rows).toHaveLength(getChecklistForCategory("RAM").length);
    expect(rows.every((row) => row.result === "PENDING")).toBe(true);
    expect(rows.every((row) => row.notes === null && row.evidencePhotoId === null)).toBe(
      true,
    );
  });

  it("fills in result/notes/evidence from matching TestLog rows", () => {
    const [firstItem] = getChecklistForCategory("RAM");
    const rows = buildChecklistRows("RAM", [
      {
        checklistItem: firstItem,
        result: "PASS",
        notes: "Looks good",
        evidencePhotoId: "photo-1",
      },
    ]);

    const match = rows.find((row) => row.checklistItem === firstItem);
    expect(match?.result).toBe("PASS");
    expect(match?.notes).toBe("Looks good");
    expect(match?.evidencePhotoId).toBe("photo-1");
  });

  it("ignores TestLog rows for checklist items no longer in the config", () => {
    const rows = buildChecklistRows("RAM", [
      {
        checklistItem: "Some removed checklist item",
        result: "FAIL",
        notes: null,
        evidencePhotoId: null,
      },
    ]);
    expect(rows.every((row) => row.result === "PENDING")).toBe(true);
  });
});
