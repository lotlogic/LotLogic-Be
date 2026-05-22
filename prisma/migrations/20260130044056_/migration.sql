/*
  Warnings:

  - Made the column `coordinates` on table `geoData` required. This step will fail if there are existing NULL values in that column.
  - Made the column `geoType` on table `geoData` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."actBlock_geometry_gist";

-- DropIndex
DROP INDEX "public"."actLandUseZone_geometry_gist";

-- DropIndex
DROP INDEX "public"."actLandUseZone_zoneCode_idx";

-- AlterTable
ALTER TABLE "public"."geoData" ALTER COLUMN "coordinates" SET NOT NULL,
ALTER COLUMN "geoType" SET NOT NULL;
