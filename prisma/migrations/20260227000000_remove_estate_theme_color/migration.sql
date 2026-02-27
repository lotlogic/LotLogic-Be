-- Drop unused estate theme color field
ALTER TABLE "public"."estate"
DROP COLUMN IF EXISTS "themeColor";
