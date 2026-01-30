-- Add guid to brandSetting
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "public"."brandSetting" ADD COLUMN "guid" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "brandSetting_guid_key" ON "public"."brandSetting"("guid");
