-- Allow multiple brand settings and link to estate
ALTER TABLE "public"."brandSetting" ALTER COLUMN "id" DROP DEFAULT;

ALTER TABLE "public"."brandSetting" ADD COLUMN "estateId" BIGINT;

CREATE UNIQUE INDEX "brandSetting_estateId_key" ON "public"."brandSetting"("estateId");

ALTER TABLE "public"."brandSetting" ADD CONSTRAINT "brandSetting_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
