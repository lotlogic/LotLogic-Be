ALTER TABLE "public"."lot"
  ADD COLUMN "salesMode" TEXT NOT NULL DEFAULT 'land_sale',
  ADD COLUMN "price" INTEGER;

ALTER TABLE "public"."enquiry"
  ADD COLUMN "journeyType" TEXT,
  ADD COLUMN "finishesLevel" TEXT;
