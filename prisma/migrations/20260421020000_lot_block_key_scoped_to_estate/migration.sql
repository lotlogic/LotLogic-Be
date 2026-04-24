DROP INDEX IF EXISTS "public"."lot_blockKey_key";

CREATE UNIQUE INDEX IF NOT EXISTS "lot_estateId_blockKey_key"
ON "public"."lot"("estateId", "blockKey");
