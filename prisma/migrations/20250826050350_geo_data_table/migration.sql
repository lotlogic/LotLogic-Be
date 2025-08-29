-- CreateTable
CREATE TABLE "public"."geoData" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "color" TEXT,
    "coordinates" TEXT,
    "geoType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geoData_pkey" PRIMARY KEY ("id")
);