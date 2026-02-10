-- AlterTable
ALTER TABLE "public"."lot"
ADD COLUMN "frontageM" DOUBLE PRECISION,
ADD COLUMN "lotType" TEXT,
ADD COLUMN "roadFacing" TEXT,
ADD COLUMN "precinct" TEXT,
ADD COLUMN "ruleOverrides" JSONB;
