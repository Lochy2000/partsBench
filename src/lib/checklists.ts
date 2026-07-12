import type { Category, TestLog } from "@prisma/client";
import cpuChecklist from "./checklists/cpu.json";
import defaultChecklist from "./checklists/default.json";
import gpuChecklist from "./checklists/gpu.json";
import ramChecklist from "./checklists/ram.json";
import storageChecklist from "./checklists/storage.json";

// Hardcoded config, not DB-modelled (docs/00-OVERVIEW.md decision #4) — only the categories
// actually being tested get a real checklist for now; everything else falls back to a generic
// one until real use proves a category needs its own.
const CHECKLISTS: Partial<Record<Category, string[]>> = {
  GPU: gpuChecklist,
  RAM: ramChecklist,
  STORAGE: storageChecklist,
  CPU: cpuChecklist,
};

export function getChecklistForCategory(category: Category): string[] {
  return CHECKLISTS[category] ?? defaultChecklist;
}

export interface ChecklistRowData {
  checklistItem: string;
  result: TestLog["result"];
  notes: string | null;
  evidencePhotoId: string | null;
}

// No TestLog row yet for a checklist item just means it hasn't been touched — displayed as
// PENDING, the same enum value a row would have if explicitly marked pending. Nothing gets
// written to the database until the user actually interacts with a row.
export function buildChecklistRows(
  category: Category,
  testLogs: Pick<TestLog, "checklistItem" | "result" | "notes" | "evidencePhotoId">[],
): ChecklistRowData[] {
  return getChecklistForCategory(category).map((checklistItem) => {
    const existing = testLogs.find((log) => log.checklistItem === checklistItem);
    return {
      checklistItem,
      result: existing?.result ?? "PENDING",
      notes: existing?.notes ?? null,
      evidencePhotoId: existing?.evidencePhotoId ?? null,
    };
  });
}
