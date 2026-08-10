import { ListingPlatform, ListingStatus } from "@prisma/client";
import { z } from "zod";

export const createListingSchema = z.object({
  itemId: z.string().min(1),
  platform: z.enum(ListingPlatform),
  url: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v)),
  pricePence: z.coerce.number("Must be a number").int("Must be a whole number of pence").min(0),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ListingStatus),
});

export type UpdateListingStatusInput = z.infer<typeof updateListingStatusSchema>;
