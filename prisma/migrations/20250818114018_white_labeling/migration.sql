CREATE TABLE "public"."whiteLabel" (
    "id" INTEGER NOT NULL,
    "brandName" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "brandTitle" VARCHAR(255) NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" VARCHAR(20),
    "secondaryColor" VARCHAR(20),
    "textPrimaryColor" VARCHAR(20),
    "textSecondaryColor" VARCHAR(20),
    "backgroundPrimaryColor" VARCHAR(20),
    "backgroundSecondaryColor" VARCHAR(20),
    "fontFamilyPrimary" VARCHAR(20),
    "fontFamilySecondary" VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),

    CONSTRAINT "white_label_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "white_label_domain_key" UNIQUE ("domain")
);
