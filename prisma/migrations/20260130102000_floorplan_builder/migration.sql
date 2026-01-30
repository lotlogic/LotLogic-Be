-- Add builderId to floorPlan and backfill existing rows
ALTER TABLE "public"."floorPlan" ADD COLUMN "builderId" BIGINT;

UPDATE "public"."floorPlan"
SET "builderId" = (
  SELECT id FROM "public"."builder" ORDER BY id ASC LIMIT 1
)
WHERE "builderId" IS NULL;

ALTER TABLE "public"."floorPlan" ALTER COLUMN "builderId" SET NOT NULL;

ALTER TABLE "public"."floorPlan"
ADD CONSTRAINT "floorPlan_builderId_fkey"
FOREIGN KEY ("builderId") REFERENCES "public"."builder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "floorPlan_builderId_idx" ON "public"."floorPlan"("builderId");
