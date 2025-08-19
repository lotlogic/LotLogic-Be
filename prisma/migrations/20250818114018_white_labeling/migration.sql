CREATE TABLE "public"."brand" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" VARCHAR(20),
    "secondaryColor" VARCHAR(20),
    "bgPrimaryColor" VARCHAR(20),
    "bgSecondaryColor" VARCHAR(20),
    "textPrimaryColor" VARCHAR(20),
    "textSecondaryColor" VARCHAR(20),
    "fontFamilyPrimary" VARCHAR(20),
    "fontFamilySecondary" VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "brand_domain_key" UNIQUE ("domain")
);
