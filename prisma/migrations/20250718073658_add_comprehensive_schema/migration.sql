/*
  Warnings:

  - You are about to drop the column `globalId` on the `Lot` table. All the data in the column will be lost.
  - You are about to drop the column `shapeArea` on the `Lot` table. All the data in the column will be lost.
  - You are about to drop the column `shapeLength` on the `Lot` table. All the data in the column will be lost.
  - The `overlays` column on the `Lot` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Estate" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "themeColor" TEXT;

-- AlterTable
ALTER TABLE "Lot" DROP COLUMN "globalId",
DROP COLUMN "shapeArea",
DROP COLUMN "shapeLength",
DROP COLUMN "overlays",
ADD COLUMN     "overlays" TEXT[];

-- CreateTable
CREATE TABLE "ZoningRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isOverlay" BOOLEAN NOT NULL DEFAULT false,
    "maxBuildingHeight_m" DOUBLE PRECISION,
    "maxStoreys" INTEGER,
    "minLotArea_sqm" DOUBLE PRECISION,
    "minLotWidth_m" DOUBLE PRECISION,
    "minLotDepth_m" DOUBLE PRECISION,
    "minFrontageStandard_m" DOUBLE PRECISION,
    "minFrontageCorner_m" DOUBLE PRECISION,
    "minFSR" DOUBLE PRECISION,
    "maxFSR" DOUBLE PRECISION,
    "minFrontSetback_m" DOUBLE PRECISION,
    "minRearSetback_m" DOUBLE PRECISION,
    "minSideSetback_m" DOUBLE PRECISION,
    "appliesToZones" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotZoningRule" (
    "lotId" TEXT NOT NULL,
    "zoningRuleId" TEXT NOT NULL,
    "isOverlay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LotZoningRule_pkey" PRIMARY KEY ("lotId","zoningRuleId")
);

-- CreateTable
CREATE TABLE "HouseDesign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floorplanUrl" TEXT,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "garages" INTEGER NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "minLotWidth" DOUBLE PRECISION NOT NULL,
    "minLotDepth" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facade" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "houseDesignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignOnLot" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "houseDesignId" TEXT NOT NULL,
    "isCompatible" BOOLEAN NOT NULL,
    "matchedFilters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignOnLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Builder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Builder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "comments" TEXT,
    "lotId" TEXT,
    "houseDesignId" TEXT,
    "facadeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryBuilder" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "builderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryBuilder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoningRule_code_key" ON "ZoningRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DesignOnLot_lotId_houseDesignId_key" ON "DesignOnLot"("lotId", "houseDesignId");

-- CreateIndex
CREATE UNIQUE INDEX "EnquiryBuilder_enquiryId_builderId_key" ON "EnquiryBuilder"("enquiryId", "builderId");

-- AddForeignKey
ALTER TABLE "LotZoningRule" ADD CONSTRAINT "LotZoningRule_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotZoningRule" ADD CONSTRAINT "LotZoningRule_zoningRuleId_fkey" FOREIGN KEY ("zoningRuleId") REFERENCES "ZoningRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facade" ADD CONSTRAINT "Facade_houseDesignId_fkey" FOREIGN KEY ("houseDesignId") REFERENCES "HouseDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignOnLot" ADD CONSTRAINT "DesignOnLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignOnLot" ADD CONSTRAINT "DesignOnLot_houseDesignId_fkey" FOREIGN KEY ("houseDesignId") REFERENCES "HouseDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_houseDesignId_fkey" FOREIGN KEY ("houseDesignId") REFERENCES "HouseDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_facadeId_fkey" FOREIGN KEY ("facadeId") REFERENCES "Facade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryBuilder" ADD CONSTRAINT "EnquiryBuilder_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryBuilder" ADD CONSTRAINT "EnquiryBuilder_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "Builder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
