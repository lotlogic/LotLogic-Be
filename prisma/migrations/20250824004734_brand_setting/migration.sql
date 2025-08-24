/*
  Warnings:

  - You are about to drop the `brand` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."builder" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."estate" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."facade" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."floorPlan" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."lot" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."zoningRule" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."brand";

-- CreateTable
CREATE TABLE "public"."brandSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "bgPrimaryColor" TEXT,
    "bgSecondaryColor" TEXT,
    "textPrimaryColor" TEXT,
    "textSecondaryColor" TEXT,
    "fontFamilyPrimary" TEXT,
    "fontFamilySecondary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brandSetting_pkey" PRIMARY KEY ("id")
);

-- RenameForeignKey
ALTER TABLE "public"."designOnLot" RENAME CONSTRAINT "designOnLot_houseDesignId_fkey" TO "designOnLot_floorPlanId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."enquiry" RENAME CONSTRAINT "enquiry_houseDesignId_fkey" TO "enquiry_floorPlanId_fkey";

-- RenameForeignKey
ALTER TABLE "public"."facade" RENAME CONSTRAINT "facade_houseDesignId_fkey" TO "facade_floorPlanId_fkey";

-- RenameIndex
ALTER INDEX "public"."designOnLot_lotId_houseDesignId_key" RENAME TO "designOnLot_lotId_floorPlanId_key";
