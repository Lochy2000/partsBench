import type { Category, ItemPhoto, ItemStatus, TestLog } from "@prisma/client";

export interface FilterableItem {
  status: ItemStatus;
  category: Category;
  photos: Pick<ItemPhoto, "id">[];
  testLogs: Pick<TestLog, "checklistItem" | "result" | "notes" | "evidencePhotoId">[];
}
