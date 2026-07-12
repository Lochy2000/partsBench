import { prisma } from "@/lib/prisma";

export function getActiveItems() {
  return prisma.item.findMany({
    where: { status: { not: "ARCHIVED" } },
    include: { specs: true },
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
