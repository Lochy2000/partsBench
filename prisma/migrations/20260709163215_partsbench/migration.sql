-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CPU', 'GPU', 'RAM', 'MOTHERBOARD', 'STORAGE', 'PSU', 'CASE', 'COOLING', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('BOUGHT', 'NEEDS_CLEANING', 'NEEDS_TESTING', 'FAULT_FOUND', 'REPAIRING', 'READY_TO_LIST', 'LISTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER', 'TEST', 'LISTING');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PASS', 'FAIL', 'PENDING');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'BOUGHT',
    "costPence" INTEGER NOT NULL DEFAULT 0,
    "feesPence" INTEGER NOT NULL DEFAULT 0,
    "soldPricePence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemSpec" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ItemSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPhoto" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestLog" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "checklistItem" TEXT NOT NULL,
    "result" "TestResult" NOT NULL,
    "notes" TEXT,
    "evidencePhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");

-- CreateIndex
CREATE INDEX "ItemSpec_itemId_idx" ON "ItemSpec"("itemId");

-- CreateIndex
CREATE INDEX "ItemPhoto_itemId_idx" ON "ItemPhoto"("itemId");

-- CreateIndex
CREATE INDEX "TestLog_itemId_idx" ON "TestLog"("itemId");

-- AddForeignKey
ALTER TABLE "ItemSpec" ADD CONSTRAINT "ItemSpec_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPhoto" ADD CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestLog" ADD CONSTRAINT "TestLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestLog" ADD CONSTRAINT "TestLog_evidencePhotoId_fkey" FOREIGN KEY ("evidencePhotoId") REFERENCES "ItemPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
