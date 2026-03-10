CREATE TYPE "public"."EstateAccessStatus" AS ENUM ('LIVE', 'GATED');

ALTER TABLE "public"."estate"
ADD COLUMN "status" "public"."EstateAccessStatus" NOT NULL DEFAULT 'LIVE',
ADD COLUMN "accessPasswordHash" TEXT;
