ALTER TABLE "public"."houseDesign" RENAME CONSTRAINT "houseDesign_pkey" TO "floorPlan_pkey";

ALTER TABLE "houseDesign" RENAME TO "floorPlan";

ALTER TABLE "public"."estate" ALTER COLUMN updatedAt SET DEFAULT NOW();

ALTER TABLE "public"."lot" ALTER COLUMN updatedAt SET DEFAULT NOW();

ALTER TABLE "public"."zoningRule" ALTER COLUMN updatedAt SET DEFAULT NOW();

ALTER TABLE "public"."floorPlan" ALTER COLUMN updatedAt SET DEFAULT NOW();

ALTER TABLE "public"."facade" ALTER COLUMN updatedAt SET DEFAULT NOW();

ALTER TABLE "public"."builder" ALTER COLUMN updatedAt SET DEFAULT NOW();