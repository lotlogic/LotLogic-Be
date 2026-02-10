-- CreateEnum
CREATE TYPE "public"."Jurisdiction" AS ENUM ('NSW', 'ACT');

-- CreateEnum
CREATE TYPE "public"."RuleSetStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."BuilderEstateApprovalStatus" AS ENUM ('APPROVED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."DesignOnLotStatus" AS ENUM ('PASS', 'FAIL', 'MANUAL_REVIEW');

-- AlterTable
ALTER TABLE "public"."estate"
ADD COLUMN "jurisdiction" "public"."Jurisdiction" NOT NULL DEFAULT 'ACT';

-- AlterTable
ALTER TABLE "public"."floorPlan"
ADD COLUMN "storeys" INTEGER,
ADD COLUMN "buildingHeight_m" DOUBLE PRECISION,
ADD COLUMN "roofPitch_deg" DOUBLE PRECISION,
ADD COLUMN "architecturalStyle" TEXT,
ADD COLUMN "hasFrontFacingServiceAreas" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."designOnLot"
ADD COLUMN "status" "public"."DesignOnLotStatus" NOT NULL DEFAULT 'FAIL',
ADD COLUMN "failReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "manualReviewReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "stateRuleSetId" BIGINT,
ADD COLUMN "estateRuleSetId" BIGINT;

-- Backfill status from legacy compatibility boolean
UPDATE "public"."designOnLot"
SET "status" = 'PASS'
WHERE "isCompatible" = true;

-- CreateTable
CREATE TABLE "public"."stateRuleSet" (
    "id" BIGSERIAL NOT NULL,
    "jurisdiction" "public"."Jurisdiction" NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."RuleSetStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "rules" JSONB NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stateRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estateRuleSet" (
    "id" BIGSERIAL NOT NULL,
    "estateId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."RuleSetStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "rules" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estateRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estateLotConstraint" (
    "id" BIGSERIAL NOT NULL,
    "estateId" BIGINT NOT NULL,
    "lotId" BIGINT NOT NULL,
    "estateRuleSetId" BIGINT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estateLotConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."builderEstateApproval" (
    "id" BIGSERIAL NOT NULL,
    "builderId" BIGINT NOT NULL,
    "estateId" BIGINT NOT NULL,
    "status" "public"."BuilderEstateApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builderEstateApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stateRuleSet_jurisdiction_version_key" ON "public"."stateRuleSet"("jurisdiction", "version");

-- CreateIndex
CREATE INDEX "stateRuleSet_jurisdiction_status_idx" ON "public"."stateRuleSet"("jurisdiction", "status");

-- CreateIndex
CREATE UNIQUE INDEX "estateRuleSet_estateId_version_key" ON "public"."estateRuleSet"("estateId", "version");

-- CreateIndex
CREATE INDEX "estateRuleSet_estateId_status_idx" ON "public"."estateRuleSet"("estateId", "status");

-- CreateIndex
CREATE INDEX "estateLotConstraint_estateId_lotId_isActive_idx" ON "public"."estateLotConstraint"("estateId", "lotId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "builderEstateApproval_builderId_estateId_key" ON "public"."builderEstateApproval"("builderId", "estateId");

-- CreateIndex
CREATE INDEX "builderEstateApproval_estateId_status_idx" ON "public"."builderEstateApproval"("estateId", "status");

-- CreateIndex
CREATE INDEX "designOnLot_lotId_isCompatible_idx" ON "public"."designOnLot"("lotId", "isCompatible");

-- CreateIndex
CREATE INDEX "designOnLot_status_idx" ON "public"."designOnLot"("status");

-- AddForeignKey
ALTER TABLE "public"."designOnLot"
ADD CONSTRAINT "designOnLot_stateRuleSetId_fkey" FOREIGN KEY ("stateRuleSetId") REFERENCES "public"."stateRuleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."designOnLot"
ADD CONSTRAINT "designOnLot_estateRuleSetId_fkey" FOREIGN KEY ("estateRuleSetId") REFERENCES "public"."estateRuleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estateRuleSet"
ADD CONSTRAINT "estateRuleSet_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estateLotConstraint"
ADD CONSTRAINT "estateLotConstraint_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estateLotConstraint"
ADD CONSTRAINT "estateLotConstraint_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estateLotConstraint"
ADD CONSTRAINT "estateLotConstraint_estateRuleSetId_fkey" FOREIGN KEY ("estateRuleSetId") REFERENCES "public"."estateRuleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."builderEstateApproval"
ADD CONSTRAINT "builderEstateApproval_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "public"."builder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."builderEstateApproval"
ADD CONSTRAINT "builderEstateApproval_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
