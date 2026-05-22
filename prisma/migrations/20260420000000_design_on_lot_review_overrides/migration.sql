CREATE TYPE "public"."DesignOnLotReviewDecision" AS ENUM ('NONE', 'APPROVED', 'REJECTED');

ALTER TABLE "public"."designOnLot"
ADD COLUMN "systemStatus" "public"."DesignOnLotStatus" NOT NULL DEFAULT 'FAIL',
ADD COLUMN "systemFailReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "systemManualReviewReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "systemMatchedFilters" JSONB,
ADD COLUMN "systemAssessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "reviewDecision" "public"."DesignOnLotReviewDecision" NOT NULL DEFAULT 'NONE',
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedByUserId" BIGINT;

UPDATE "public"."designOnLot"
SET
  "systemStatus" = "status",
  "systemFailReasons" = "failReasons",
  "systemManualReviewReasons" = "manualReviewReasons",
  "systemMatchedFilters" = "matchedFilters",
  "systemAssessedAt" = "assessedAt";

ALTER TABLE "public"."designOnLot"
ADD CONSTRAINT "designOnLot_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."user"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "designOnLot_reviewDecision_idx" ON "public"."designOnLot"("reviewDecision");
CREATE INDEX "designOnLot_reviewedByUserId_idx" ON "public"."designOnLot"("reviewedByUserId");
