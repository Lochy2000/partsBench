-- AlterEnum
ALTER TYPE "PhotoType" ADD VALUE 'UNSORTED';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "notes" TEXT;
