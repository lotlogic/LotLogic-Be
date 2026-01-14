-- CreateTable
CREATE TABLE "public"."actLandUseZone" (
    "id" SERIAL NOT NULL,
    "objectId" INTEGER NOT NULL,
    "zoneCode" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "geometry" geometry NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actLandUseZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actLandUseZone_objectId_key" ON "public"."actLandUseZone"("objectId");

-- CreateIndex
CREATE INDEX "actLandUseZone_zoneCode_idx" ON "public"."actLandUseZone"("zoneCode");

-- CreateIndex
CREATE INDEX "actLandUseZone_geometry_gist" ON "public"."actLandUseZone" USING GIST ("geometry");

