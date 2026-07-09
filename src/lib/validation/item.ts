import { Category, ItemStatus } from "@prisma/client";
import { z } from "zod";

export const quickAddItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  category: z.enum(Category),
});

export type QuickAddItemInput = z.infer<typeof quickAddItemSchema>;

const specSchema = z.object({
  key: z.string().trim().min(1, "Spec key is required").max(100),
  value: z.string().trim().min(1, "Spec value is required").max(500),
});

export const updateItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(200),
  category: z.enum(Category),
  status: z.enum(ItemStatus),
  costPence: z.coerce.number("Must be a number").int("Must be a whole number of pence").min(0),
  feesPence: z.coerce.number("Must be a number").int("Must be a whole number of pence").min(0),
  // z.literal("") must come before the coercing number schema — Number("") is 0, not NaN,
  // so a number-first union would swallow "" as 0 before this transform ever saw a "" to null out.
  soldPricePence: z
    .union([z.literal(""), z.coerce.number().int().min(0)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  specs: z
    .array(specSchema)
    .refine(
      (specs) =>
        new Set(specs.map((s) => s.key.trim().toLowerCase())).size === specs.length,
      { message: "Spec keys must be unique" },
    ),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
