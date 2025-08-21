#!/bin/sh

set -e

echo "➡️ Running Prisma Migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete."

echo "➡️ Running Prisma Seed..."
npx tsx prisma/seed.ts

echo "✅ Seeding complete."

echo "➡️ Running Prisma Generate..."
npx tsx prisma/lot.ts


echo "✅ Lot sync completed."

echo "🚀 Starting NestJS app..."
exec node dist/src/main.js