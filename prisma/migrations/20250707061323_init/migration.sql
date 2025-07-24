-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "blockKey" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "sectionNumber" INTEGER,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "zoning" TEXT NOT NULL,
    "overlays" TEXT,
    "address" TEXT,
    "district" TEXT,
    "division" TEXT,
    "lifecycleStage" TEXT,
    "shapeArea" DOUBLE PRECISION,
    "shapeLength" DOUBLE PRECISION,
    "globalId" TEXT,
    "geojson" JSONB,
    "geometry" geometry,
    "estateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lot_blockKey_key" ON "Lot"("blockKey");

-- CreateIndex
CREATE INDEX "geometry_index" ON "Lot"("geometry");

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
