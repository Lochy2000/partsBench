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
    include: { specs: true, photos: true },
  });
}
