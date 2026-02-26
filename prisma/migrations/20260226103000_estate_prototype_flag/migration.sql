ALTER TABLE "public"."estate"
ADD COLUMN "isPrototype" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "estate_isPrototype_single_true_idx"
ON "public"."estate"("isPrototype")
WHERE "isPrototype" = true;
