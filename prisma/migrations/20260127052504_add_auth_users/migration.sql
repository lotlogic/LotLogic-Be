-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" BIGSERIAL NOT NULL,
    "externalAuthId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'EDITOR',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."userEstate" (
    "userId" BIGINT NOT NULL,
    "estateId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userEstate_pkey" PRIMARY KEY ("userId","estateId")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_externalAuthId_key" ON "public"."user"("externalAuthId");

-- CreateIndex
CREATE INDEX "userEstate_estateId_idx" ON "public"."userEstate"("estateId");

-- AddForeignKey
ALTER TABLE "public"."userEstate" ADD CONSTRAINT "userEstate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."userEstate" ADD CONSTRAINT "userEstate_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "public"."estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
