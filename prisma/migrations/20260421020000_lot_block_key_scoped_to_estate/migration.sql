ALTER TABLE "public"."lot"
DROP CONSTRAINT "lot_blockKey_key";

CREATE UNIQUE INDEX "lot_estateId_blockKey_key"
ON "public"."lot"("estateId", "blockKey");
