import { describe, expect, it } from "vitest";
import { getChecklistForCategory } from "@/lib/checklists";
import { missingPhotos, needsTesting, readyToList } from "@/lib/filters";
import type { FilterableItem } from "@/lib/filters";

const RAM_CHECKLIST = getChecklistForCategory("RAM");

function itemWith(overrides: Partial<FilterableItem>): FilterableItem {
  return {
    status: "BOUGHT",
    category: "RAM",
    photos: [],
    testLogs: [],
    ...overrides,
  };
}

function allPassedLogs(): FilterableItem["testLogs"] {
  return RAM_CHECKLIST.map((checklistItem) => ({
    checklistItem,
    result: "PASS" as const,
    notes: null,
    evidencePhotoId: null,
  }));
}

describe("needsTesting", () => {
  it("is true when no TestLog rows exist yet (everything defaults to PENDING)", () => {
    expect(needsTesting(itemWith({ testLogs: [] }))).toBe(true);
  });

  it("is true when at least one checklist row is still PENDING", () => {
    const logs = allPassedLogs();
    logs[0] = { ...logs[0], result: "PENDING" };
    expect(needsTesting(itemWith({ testLogs: logs }))).toBe(true);
  });

  it("is false once every checklist row is PASS or FAIL (nothing left untested)", () => {
    const logs = allPassedLogs();
    logs[0] = { ...logs[0], result: "FAIL" };
    expect(needsTesting(itemWith({ testLogs: logs }))).toBe(false);
  });

  it("is false when every checklist row has passed", () => {
    expect(needsTesting(itemWith({ testLogs: allPassedLogs() }))).toBe(false);
  });
});

describe("missingPhotos", () => {
  it("is true at zero photos", () => {
    expect(missingPhotos(itemWith({ photos: [] }))).toBe(true);
  });

  it("is false at exactly one photo (the threshold)", () => {
    expect(missingPhotos(itemWith({ photos: [{ id: "p1" }] }))).toBe(false);
  });

  it("is false with multiple photos", () => {
    expect(missingPhotos(itemWith({ photos: [{ id: "p1" }, { id: "p2" }] }))).toBe(false);
  });
});

describe("readyToList", () => {
  const passedAndPhotographed = {
    testLogs: allPassedLogs(),
    photos: [{ id: "p1" }],
  };

  it("is true when fully tested, has a photo, and not already listed/sold/archived", () => {
    expect(readyToList(itemWith({ ...passedAndPhotographed, status: "BOUGHT" }))).toBe(true);
  });

  it("is false without any photos, even if fully tested", () => {
    expect(
      readyToList(itemWith({ testLogs: allPassedLogs(), photos: [], status: "BOUGHT" })),
    ).toBe(false);
  });

  it("is false with an unresolved FAIL result", () => {
    const logs = allPassedLogs();
    logs[0] = { ...logs[0], result: "FAIL" };
    expect(readyToList(itemWith({ ...passedAndPhotographed, testLogs: logs }))).toBe(false);
  });

  it("is false with a still-PENDING checklist item", () => {
    const logs = allPassedLogs();
    logs[0] = { ...logs[0], result: "PENDING" };
    expect(readyToList(itemWith({ ...passedAndPhotographed, testLogs: logs }))).toBe(false);
  });

  it.each(["LISTED", "SOLD", "ARCHIVED"] as const)(
    "is false when status is already %s",
    (status) => {
      expect(readyToList(itemWith({ ...passedAndPhotographed, status }))).toBe(false);
    },
  );
});
