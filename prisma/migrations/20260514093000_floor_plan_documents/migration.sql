CREATE TABLE "public"."floorPlanDocument" (
  "id" BIGSERIAL NOT NULL,
  "floorPlanId" BIGINT NOT NULL,
  "documentName" TEXT,
  "fileName" TEXT NOT NULL,
  "documentUrl" TEXT NOT NULL,
  "fileSizeBytes" INTEGER,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "floorPlanDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "floorPlanDocument_floorPlanId_idx"
ON "public"."floorPlanDocument"("floorPlanId");

ALTER TABLE "public"."floorPlanDocument"
ADD CONSTRAINT "floorPlanDocument_floorPlanId_fkey"
FOREIGN KEY ("floorPlanId")
REFERENCES "public"."floorPlan"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
