ALTER TABLE "public"."lot"
ADD COLUMN "houseAndLandFloorPlanId" BIGINT;

CREATE INDEX "lot_houseAndLandFloorPlanId_idx"
ON "public"."lot"("houseAndLandFloorPlanId");

ALTER TABLE "public"."lot"
ADD CONSTRAINT "lot_houseAndLandFloorPlanId_fkey"
FOREIGN KEY ("houseAndLandFloorPlanId")
REFERENCES "public"."floorPlan"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
