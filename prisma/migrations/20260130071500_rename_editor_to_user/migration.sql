-- Rename EDITOR to USER for the UserRole enum
ALTER TYPE "public"."UserRole" RENAME VALUE 'EDITOR' TO 'USER';

-- Ensure the default matches the renamed enum value
ALTER TABLE "public"."user" ALTER COLUMN "role" SET DEFAULT 'USER';
