-- CreateTable
CREATE TABLE "public"."actBlock" (
    "id" SERIAL NOT NULL,
    "objectId" INTEGER NOT NULL,
    "blockKey" BIGINT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "derivedAreaSqm" BIGINT,
    "properties" JSONB NOT NULL,
    "geometry" geometry NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actBlock_objectId_key" ON "public"."actBlock"("objectId");

-- CreateIndex
CREATE INDEX "actBlock_blockKey_idx" ON "public"."actBlock"("blockKey");

-- CreateIndex
CREATE INDEX "actBlock_geometry_gist" ON "public"."actBlock" USING GIST ("geometry");

