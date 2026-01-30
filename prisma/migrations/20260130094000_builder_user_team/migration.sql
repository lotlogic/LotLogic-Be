-- Replace builder externalAuthId with a builder-user join table

-- CreateTable
CREATE TABLE "public"."builderUser" (
    "userId" BIGINT NOT NULL,
    "builderId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builderUser_pkey" PRIMARY KEY ("userId","builderId")
);

-- CreateIndex
CREATE INDEX "builderUser_builderId_idx" ON "public"."builderUser"("builderId");

-- AddForeignKey
ALTER TABLE "public"."builderUser" ADD CONSTRAINT "builderUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."builderUser" ADD CONSTRAINT "builderUser_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "public"."builder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing mappings and drop legacy column if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'builder'
          AND column_name = 'externalAuthId'
    ) THEN
        INSERT INTO "public"."builderUser" ("userId", "builderId")
        SELECT u."id", b."id"
        FROM "public"."builder" b
        JOIN "public"."user" u ON u."externalAuthId" = b."externalAuthId"
        WHERE b."externalAuthId" IS NOT NULL
        ON CONFLICT DO NOTHING;

        ALTER TABLE "public"."builder" DROP CONSTRAINT IF EXISTS "builder_externalAuthId_fkey";
        DROP INDEX IF EXISTS "public"."builder_externalAuthId_key";
        ALTER TABLE "public"."builder" DROP COLUMN IF EXISTS "externalAuthId";
    END IF;
END $$;
