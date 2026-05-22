ALTER TABLE "public"."estate"
ADD COLUMN "brandGuid" UUID;

UPDATE "public"."estate" AS e
SET "brandGuid" = bs."guid"
FROM "public"."brandSetting" AS bs
WHERE bs."estateId" = e."id";

CREATE INDEX "estate_brandGuid_idx" ON "public"."estate"("brandGuid");

ALTER TABLE "public"."estate"
ADD CONSTRAINT "estate_brandGuid_fkey"
FOREIGN KEY ("brandGuid") REFERENCES "public"."brandSetting"("guid")
ON DELETE SET NULL
ON UPDATE CASCADE;

DROP INDEX IF EXISTS "brandSetting_estateId_key";

ALTER TABLE "public"."brandSetting"
DROP CONSTRAINT IF EXISTS "brandSetting_estateId_fkey";

ALTER TABLE "public"."brandSetting"
DROP COLUMN IF EXISTS "estateId";
