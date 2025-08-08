-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "public"."estate" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "themeColor" TEXT,

    CONSTRAINT "estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lot" (
    "id" BIGSERIAL NOT NULL,
    "blockKey" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "sectionNumber" INTEGER,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "zoning" TEXT NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "division" TEXT,
    "lifecycleStage" TEXT,
    "geojson" JSONB,
    "geometry" geometry,
    "estateId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "overlays" TEXT[],

    CONSTRAINT "lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zoningRule" (
    "id" BIGSERIAL NOT NULL,
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

    CONSTRAINT "zoningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lotZoningRule" (
    "lotId" BIGINT NOT NULL,
    "zoningRuleId" BIGINT NOT NULL,
    "isOverlay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lotZoningRule_pkey" PRIMARY KEY ("lotId","zoningRuleId")
);

-- CreateTable
CREATE TABLE "public"."houseDesign" (
    "id" BIGSERIAL NOT NULL,
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
    "rumpus" BOOLEAN NOT NULL,
    "alfresco" BOOLEAN NOT NULL,
    "pergola" BOOLEAN NOT NULL,

    CONSTRAINT "houseDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."facade" (
    "id" BIGSERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "houseDesignId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."designOnLot" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "houseDesignId" BIGINT NOT NULL,
    "isCompatible" BOOLEAN NOT NULL,
    "matchedFilters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designOnLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."builder" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enquiry" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "comments" TEXT,
    "lotId" BIGINT,
    "houseDesignId" BIGINT,
    "facadeId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enquiryBuilder" (
    "id" BIGSERIAL NOT NULL,
    "enquiryId" BIGINT NOT NULL,
    "builderId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiryBuilder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lot_blockKey_key" ON "public"."lot"("blockKey");

-- CreateIndex
CREATE INDEX "geometry_index" ON "public"."lot"("geometry");

-- CreateIndex
CREATE UNIQUE INDEX "zoningRule_code_key" ON "public"."zoningRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "designOnLot_lotId_houseDesignId_key" ON "public"."designOnLot"("lotId", "houseDesignId");

-- CreateIndex
CREATE UNIQUE INDEX "enquiryBuilder_enquiryId_builderId_key" ON "public"."enquiryBuilder"("enquiryId", "builderId");

-- AddForeignKey
ALTER TABLE "public"."lot" ADD CONSTRAINT "lot_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lotZoningRule" ADD CONSTRAINT "lotZoningRule_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lotZoningRule" ADD CONSTRAINT "lotZoningRule_zoningRuleId_fkey" FOREIGN KEY ("zoningRuleId") REFERENCES "public"."zoningRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facade" ADD CONSTRAINT "facade_houseDesignId_fkey" FOREIGN KEY ("houseDesignId") REFERENCES "public"."houseDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."designOnLot" ADD CONSTRAINT "designOnLot_houseDesignId_fkey" FOREIGN KEY ("houseDesignId") REFERENCES "public"."houseDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."designOnLot" ADD CONSTRAINT "designOnLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enquiry" ADD CONSTRAINT "enquiry_facadeId_fkey" FOREIGN KEY ("facadeId") REFERENCES "public"."facade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enquiry" ADD CONSTRAINT "enquiry_houseDesignId_fkey" FOREIGN KEY ("houseDesignId") REFERENCES "public"."houseDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enquiry" ADD CONSTRAINT "enquiry_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enquiryBuilder" ADD CONSTRAINT "enquiryBuilder_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "public"."builder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enquiryBuilder" ADD CONSTRAINT "enquiryBuilder_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "public"."enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
