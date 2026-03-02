CREATE TYPE "public"."EnquiryStatus" AS ENUM ('PENDING', 'PROCESSED');

ALTER TABLE "public"."enquiry"
  ADD COLUMN "status" "public"."EnquiryStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "estateId" BIGINT;

CREATE INDEX "enquiry_status_idx" ON "public"."enquiry"("status");
CREATE INDEX "enquiry_estateId_idx" ON "public"."enquiry"("estateId");

ALTER TABLE "public"."enquiry"
  ADD CONSTRAINT "enquiry_estateId_fkey"
  FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
