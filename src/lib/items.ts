import { prisma } from "@/lib/prisma";

export function getActiveItems() {
  return prisma.item.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { specs: true },
    orderBy: { createdAt: "desc" },
  });
}

// Fetches with just enough of each relation for the smart filter predicates (Section 09) to
// run in-memory — filtering happens in src/lib/filters, not as SQL, per that section's doc.
export function getInventoryItems({ includeArchived = false }: { includeArchived?: boolean } = {}) {
  return prisma.item.findMany({
    where: includeArchived ? {} : { status: { not: "ARCHIVED" } },
    include: {
      photos: { select: { id: true } },
      testLogs: {
        select: { checklistItem: true, result: true, notes: true, evidencePhotoId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: {
      specs: true,
      // Ordered so evidence-photo labels (e.g. "Test #1", "Test #2") stay stable across reloads.
      photos: { orderBy: { createdAt: "asc" } },
      testLogs: true,
    },
  });
}
