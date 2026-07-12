import { TestResult } from "@prisma/client";
import { z } from "zod";

export const setTestResultSchema = z.object({
  itemId: z.string().min(1),
  checklistItem: z.string().min(1).max(200),
  result: z.enum(TestResult),
  notes: z.string().max(1000).nullable(),
  evidencePhotoId: z.string().nullable(),
});

export type SetTestResultInput = z.infer<typeof setTestResultSchema>;
