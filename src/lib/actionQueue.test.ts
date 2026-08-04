import { describe, expect, it } from "vitest";
import { rankActionQueue, type ActionQueueItem } from "./actionQueue";

let nextId = 0;
function makeItem(overrides: Partial<ActionQueueItem> = {}): ActionQueueItem {
  nextId += 1;
  return {
    id: `item-${nextId}`,
    category: "STORAGE",
    status: "BOUGHT",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    photos: [],
    testLogs: [],
    ...overrides,
  };
}

const storageChecklist = [
  "CrystalDiskInfo health check — no reallocated sectors",
  "SMART status healthy",
  "Read/write speed test within expected range",
];

function allPass(checklist: string[]) {
  return checklist.map((checklistItem) => ({
    checklistItem,
    result: "PASS" as const,
    notes: null,
    evidencePhotoId: null,
  }));
}

describe("rankActionQueue", () => {
  it("flags FAULT_FOUND with a repair-decision reason", () => {
    const item = makeItem({ status: "FAULT_FOUND", photos: [{ id: "p1" }] });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("Fault found — needs a repair decision");
  });

  it("flags a totally untouched item as just-added, not generic missing-photos", () => {
    const item = makeItem({ status: "BOUGHT", photos: [], testLogs: [] });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("Just added — no photos yet");
  });

  it("flags missing photos with the generic reason once testing has started", () => {
    const item = makeItem({
      status: "BOUGHT",
      photos: [],
      testLogs: [
        { checklistItem: storageChecklist[0], result: "PASS", notes: null, evidencePhotoId: null },
      ],
    });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("No photos yet");
  });

  it("does not flag missing photos on terminal statuses", () => {
    const item = makeItem({ status: "LISTED", photos: [] });
    expect(rankActionQueue([item])).toHaveLength(0);
  });

  it("flags needsTesting with a pending-count reason once photographed", () => {
    const item = makeItem({
      status: "BOUGHT",
      photos: [{ id: "p1" }],
      testLogs: [
        { checklistItem: storageChecklist[0], result: "PASS", notes: null, evidencePhotoId: null },
      ],
    });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("2 checklist items still pending");
  });

  it("uses singular wording for exactly one pending checklist item", () => {
    const item = makeItem({
      status: "BOUGHT",
      photos: [{ id: "p1" }],
      testLogs: allPass(storageChecklist.slice(0, 2)),
    });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("1 checklist item still pending");
  });

  it("flags a fully tested and photographed item as ready to advance", () => {
    const item = makeItem({
      status: "BOUGHT",
      photos: [{ id: "p1" }],
      testLogs: allPass(storageChecklist),
    });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("Fully tested and photographed — move to Ready to List");
  });

  it("does not flag an item already in READY_TO_LIST or LISTED as ready-to-advance", () => {
    const readyItem = makeItem({
      status: "READY_TO_LIST",
      photos: [{ id: "p1" }],
      testLogs: allPass(storageChecklist),
    });
    const listedItem = makeItem({
      status: "LISTED",
      photos: [{ id: "p1" }],
      testLogs: allPass(storageChecklist),
    });
    expect(rankActionQueue([readyItem, listedItem])).toHaveLength(0);
  });

  it("flags NEEDS_CLEANING once already tested and photographed", () => {
    const item = makeItem({
      status: "NEEDS_CLEANING",
      photos: [{ id: "p1" }],
      testLogs: allPass(storageChecklist),
    });
    const [entry] = rankActionQueue([item]);
    expect(entry.reason).toBe("Needs cleaning before testing");
  });

  it("excludes SOLD and ARCHIVED items entirely", () => {
    const sold = makeItem({ status: "SOLD", photos: [] });
    const archived = makeItem({ status: "ARCHIVED", photos: [] });
    expect(rankActionQueue([sold, archived])).toHaveLength(0);
  });

  it("orders by tier first, then by createdAt within a tier", () => {
    const oldCleaning = makeItem({
      status: "NEEDS_CLEANING",
      photos: [{ id: "p1" }],
      testLogs: allPass(storageChecklist),
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });
    const newFault = makeItem({
      status: "FAULT_FOUND",
      photos: [{ id: "p1" }],
      createdAt: new Date("2026-06-01T00:00:00Z"),
    });
    const oldMissingPhotos = makeItem({
      status: "BOUGHT",
      photos: [],
      createdAt: new Date("2025-06-01T00:00:00Z"),
    });
    const newMissingPhotos = makeItem({
      status: "BOUGHT",
      photos: [],
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    const ranked = rankActionQueue([oldCleaning, newFault, oldMissingPhotos, newMissingPhotos]);

    expect(ranked.map((entry) => entry.item.id)).toEqual([
      newFault.id,
      oldMissingPhotos.id,
      newMissingPhotos.id,
      oldCleaning.id,
    ]);
  });

  it("returns an empty queue for an empty item set", () => {
    expect(rankActionQueue([])).toEqual([]);
  });
});
