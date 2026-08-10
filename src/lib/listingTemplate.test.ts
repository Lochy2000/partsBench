import { describe, expect, it } from "vitest";
import { buildListingDraft, type ListingDraftItem } from "./listingTemplate";

function makeItem(overrides: Partial<ListingDraftItem> = {}): ListingDraftItem {
  return {
    name: "Samsung 970 Evo 1TB",
    category: "STORAGE",
    specs: [],
    ...overrides,
  };
}

const checklist = [
  "CrystalDiskInfo health check — no reallocated sectors",
  "SMART status healthy",
  "Read/write speed test within expected range",
];

function row(checklistItem: string, result: "PASS" | "FAIL" | "PENDING") {
  return { checklistItem, result, notes: null, evidencePhotoId: null };
}

describe("buildListingDraft", () => {
  it("includes every spec and every passed checklist item with full evidence", () => {
    const item = makeItem({ specs: [{ key: "Capacity", value: "1TB" }, { key: "Interface", value: "NVMe" }] });
    const rows = checklist.map((c) => row(c, "PASS"));

    const draft = buildListingDraft(item, rows);

    expect(draft.title).toBe("Samsung 970 Evo 1TB — Storage");
    expect(draft.description).toContain("- Capacity: 1TB");
    expect(draft.description).toContain("- Interface: NVMe");
    for (const checklistItem of checklist) {
      expect(draft.description).toContain(`- ${checklistItem}`);
    }
  });

  it("only claims passed checklist items with partial evidence", () => {
    const item = makeItem();
    const rows = [row(checklist[0], "PASS"), row(checklist[1], "FAIL"), row(checklist[2], "PENDING")];

    const draft = buildListingDraft(item, rows);

    expect(draft.description).toContain(`- ${checklist[0]}`);
    expect(draft.description).not.toContain(checklist[1]);
    expect(draft.description).not.toContain(checklist[2]);
  });

  it("omits the tested section entirely with zero evidence, never fabricating a claim", () => {
    const item = makeItem();
    const rows = checklist.map((c) => row(c, "PENDING"));

    const draft = buildListingDraft(item, rows);

    expect(draft.description).not.toContain("Tested & confirmed");
    for (const checklistItem of checklist) {
      expect(draft.description).not.toContain(checklistItem);
    }
  });

  it("omits the specs section entirely when the item has no specs recorded", () => {
    const item = makeItem({ specs: [] });

    const draft = buildListingDraft(item, []);

    expect(draft.description).not.toContain("Specs:");
  });

  it("never lets a FAIL or PENDING checklist item's text leak into the description", () => {
    const item = makeItem();
    const rows = [row(checklist[0], "PASS"), row(checklist[1], "FAIL"), row(checklist[2], "PENDING")];

    const draft = buildListingDraft(item, rows);
    const passedOnly = rows.filter((r) => r.result === "PASS").map((r) => r.checklistItem);
    const notPassed = rows.filter((r) => r.result !== "PASS").map((r) => r.checklistItem);

    for (const text of passedOnly) expect(draft.description).toContain(text);
    for (const text of notPassed) expect(draft.description).not.toContain(text);
  });
});
