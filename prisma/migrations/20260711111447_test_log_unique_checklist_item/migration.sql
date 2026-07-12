-- AlterTable
ALTER TABLE "TestLog" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "TestLog_itemId_checklistItem_key" ON "TestLog"("itemId", "checklistItem");
