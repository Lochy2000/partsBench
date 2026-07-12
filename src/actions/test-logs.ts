"use server";

import { revalidatePath } from "next/cache";
import type { TestResult } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setTestResultSchema } from "@/lib/validation/test-log";

export async function setTestResult(input: {
  itemId: string;
  checklistItem: string;
  result: TestResult;
  notes: string | null;
  evidencePhotoId: string | null;
}): Promise<void> {
  const parsed = setTestResultSchema.parse(input);

  await prisma.testLog.upsert({
    where: {
      itemId_checklistItem: {
        itemId: parsed.itemId,
        checklistItem: parsed.checklistItem,
      },
    },
    create: {
      itemId: parsed.itemId,
      checklistItem: parsed.checklistItem,
      result: parsed.result,
      notes: parsed.notes,
      evidencePhotoId: parsed.evidencePhotoId,
    },
    update: {
      result: parsed.result,
      notes: parsed.notes,
      evidencePhotoId: parsed.evidencePhotoId,
    },
  });

  revalidatePath(`/items/${parsed.itemId}`);
}
