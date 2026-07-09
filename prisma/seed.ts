import { prisma } from "../src/lib/prisma";

async function main() {
  const gpu = await prisma.item.create({
    data: {
      name: "MSI RTX 3070 Gaming X",
      category: "GPU",
      status: "READY_TO_LIST",
      costPence: 25000,
      feesPence: 0,
      specs: {
        create: [
          { key: "VRAM", value: "8GB GDDR6" },
          { key: "Interface", value: "PCIe 4.0 x16" },
        ],
      },
      photos: {
        create: [{ type: "BEFORE", storageKey: "seed/gpu-before.jpg" }],
      },
    },
  });

  await prisma.testLog.create({
    data: {
      itemId: gpu.id,
      checklistItem: "3DMark Time Spy run",
      result: "PASS",
      notes: "Scored within expected range for the model.",
    },
  });

  await prisma.item.create({
    data: {
      name: "Corsair Vengeance LPX 16GB (2x8GB)",
      category: "RAM",
      status: "NEEDS_TESTING",
      costPence: 3500,
      specs: {
        create: [
          { key: "Speed", value: "3200MHz" },
          { key: "Modules", value: "2x8GB" },
        ],
      },
    },
  });

  await prisma.item.create({
    data: {
      name: "Samsung 970 EVO Plus 500GB",
      category: "STORAGE",
      status: "LISTED",
      costPence: 4000,
      feesPence: 250,
      soldPricePence: null,
      specs: {
        create: [{ key: "Interface", value: "NVMe M.2" }],
      },
    },
  });

  await prisma.item.create({
    data: {
      name: "AMD Ryzen 5 3600",
      category: "CPU",
      status: "FAULT_FOUND",
      costPence: 6000,
      specs: {
        create: [{ key: "Cores", value: "6" }],
      },
    },
  });

  await prisma.item.create({
    data: {
      name: "Generic ATX Mid Tower Case",
      category: "CASE",
      status: "BOUGHT",
      costPence: 1000,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
